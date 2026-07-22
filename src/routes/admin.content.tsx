import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Protected } from "@/components/protected";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/content")({
  component: () => (
    <Protected mode="admin" staffOnly>
      <AdminShell><Content /></AdminShell>
    </Protected>
  ),
});

type Tab = "meditations" | "ambient" | "affirmations" | "sessions";

function Content() {
  const [tab, setTab] = useState<Tab>("meditations");
  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Admin · Content</div>
        <h1 className="font-display text-3xl">Content library</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-lg">
          Upload calm, ambient focus audio. Nothing is played from an external hotlink.
        </p>
      </header>

      <div className="inline-flex flex-wrap gap-1 rounded-full bg-secondary p-1 text-sm">
        {(["meditations", "ambient", "affirmations", "sessions"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("rounded-full px-4 py-1.5 capitalize", tab === t && "bg-card shadow-sm")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "meditations" && <MeditationsAdmin />}
      {tab === "ambient" && <AmbientAdmin />}
      {tab === "affirmations" && <AffirmationsAdmin />}
      {tab === "sessions" && <SessionsAdmin />}
    </div>
  );
}

/* ---------------- Meditations ---------------- */
type Med = {
  id: string; title: string; description: string | null;
  coach_name: string | null; audio_url: string; duration_seconds: number;
  time_of_day: "morning" | "evening" | "any"; is_published: boolean;
};

function MeditationsAdmin() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-meditations"],
    queryFn: async () => {
      const { data } = await supabase.from("meditation_tracks")
        .select("id,title,description,coach_name,audio_url,duration_seconds,time_of_day,is_published")
        .order("time_of_day");
      return (data ?? []) as Med[];
    },
  });

  const [form, setForm] = useState({
    title: "", description: "", coach_name: "",
    time_of_day: "morning" as Med["time_of_day"], duration_seconds: 300,
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = async () => {
    if (!file || !form.title.trim()) { toast.error("Add a title and pick an audio file."); return; }
    setBusy(true);
    try {
      const path = `meditations/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("meditation-audio")
        .upload(path, file, { contentType: file.type || "audio/mpeg", upsert: false });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("meditation_tracks").insert({
        title: form.title, description: form.description || null, coach_name: form.coach_name || null,
        audio_url: path, duration_seconds: form.duration_seconds,
        time_of_day: form.time_of_day, is_published: true,
      });
      if (insErr) throw insErr;
      toast.success("Uploaded.");
      setForm({ title: "", description: "", coach_name: "", time_of_day: "morning", duration_seconds: 300 });
      setFile(null);
      qc.invalidateQueries({ queryKey: ["admin-meditations"] });
      qc.invalidateQueries({ queryKey: ["meditation-tracks"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed.");
    } finally { setBusy(false); }
  };

  const togglePublish = useMutation({
    mutationFn: async (r: Med) => {
      await supabase.from("meditation_tracks").update({ is_published: !r.is_published }).eq("id", r.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-meditations"] }),
  });

  const remove = useMutation({
    mutationFn: async (r: Med) => {
      if (r.audio_url && !/^https?:\/\//i.test(r.audio_url)) {
        await supabase.storage.from("meditation-audio").remove([r.audio_url]);
      }
      await supabase.from("meditation_tracks").delete().eq("id", r.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-meditations"] }),
  });

  return (
    <div className="space-y-6">
      <section className="soft-card p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Upload a meditation</div>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm"
            placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm"
            placeholder="Coach name (optional)" value={form.coach_name} onChange={(e) => setForm({ ...form, coach_name: e.target.value })} />
          <input className="rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm md:col-span-2"
            placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className="rounded-lg border border-border bg-paper/60 px-2 py-2 text-sm"
            value={form.time_of_day} onChange={(e) => setForm({ ...form, time_of_day: e.target.value as Med["time_of_day"] })}>
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
            <option value="any">Any time</option>
          </select>
          <input type="number" className="rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm"
            placeholder="Duration (seconds)" value={form.duration_seconds}
            onChange={(e) => setForm({ ...form, duration_seconds: Number(e.target.value) || 0 })} />
          <label className="md:col-span-2 flex items-center gap-2 rounded-lg border border-dashed border-border bg-paper/40 px-3 py-3 text-sm cursor-pointer">
            <Upload className="size-4" />
            <span className="text-muted-foreground">{file ? file.name : "Choose .mp3 file"}</span>
            <input type="file" accept="audio/*" className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        <div className="mt-3">
          <Button onClick={upload} disabled={busy} className="rounded-full">
            <Upload className="mr-2 size-4" /> {busy ? "Uploading…" : "Upload track"}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Tracks</h2>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="soft-card p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{r.title}</div>
                <div className="text-xs text-muted-foreground">
                  {r.coach_name ?? "—"} · {Math.round(r.duration_seconds / 60)} min · {r.time_of_day}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => togglePublish.mutate(r)}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs">
                  {r.is_published ? <CheckCircle2 className="size-3.5 text-primary" /> : <Circle className="size-3.5" />}
                  {r.is_published ? "Published" : "Draft"}
                </button>
                <button onClick={() => remove.mutate(r)} className="text-muted-foreground hover:text-foreground">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
          {rows.length === 0 && <div className="soft-card p-6 text-sm text-muted-foreground">No tracks yet.</div>}
        </ul>
      </section>
    </div>
  );
}

/* ---------------- Ambient ---------------- */
type Amb = { id: string; title: string; audio_url: string; category: string | null; is_published: boolean };

function AmbientAdmin() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-ambient"],
    queryFn: async () => {
      const { data } = await supabase.from("ambient_tracks")
        .select("id,title,audio_url,category,is_published").order("title");
      return (data ?? []) as Amb[];
    },
  });
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("focus");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = async () => {
    if (!file || !title.trim()) { toast.error("Title and file required."); return; }
    setBusy(true);
    try {
      const path = `ambient/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("meditation-audio")
        .upload(path, file, { contentType: file.type || "audio/mpeg" });
      if (upErr) throw upErr;
      const { error } = await supabase.from("ambient_tracks").insert({
        title, category, audio_url: path, is_published: true,
      });
      if (error) throw error;
      toast.success("Uploaded.");
      setTitle(""); setFile(null);
      qc.invalidateQueries({ queryKey: ["admin-ambient"] });
      qc.invalidateQueries({ queryKey: ["ambient-tracks"] });
    } catch (e: any) { toast.error(e?.message ?? "Upload failed."); }
    finally { setBusy(false); }
  };

  const remove = useMutation({
    mutationFn: async (r: Amb) => {
      if (r.audio_url && !/^https?:\/\//i.test(r.audio_url))
        await supabase.storage.from("meditation-audio").remove([r.audio_url]);
      await supabase.from("ambient_tracks").delete().eq("id", r.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ambient"] }),
  });

  return (
    <div className="space-y-6">
      <section className="soft-card p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Upload ambient focus audio</div>
        <div className="grid gap-3 md:grid-cols-3">
          <input className="rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm md:col-span-2"
            placeholder="Title (e.g. Rain on cedar)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm"
            placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <label className="md:col-span-3 flex items-center gap-2 rounded-lg border border-dashed border-border bg-paper/40 px-3 py-3 text-sm cursor-pointer">
            <Upload className="size-4" />
            <span className="text-muted-foreground">{file ? file.name : "Choose .mp3 file"}</span>
            <input type="file" accept="audio/*" className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        <div className="mt-3">
          <Button onClick={upload} disabled={busy} className="rounded-full">
            <Upload className="mr-2 size-4" /> {busy ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </section>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="soft-card p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-muted-foreground">{r.category ?? "—"} · {r.is_published ? "Published" : "Draft"}</div>
            </div>
            <button onClick={() => remove.mutate(r)} className="text-muted-foreground hover:text-foreground">
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
        {rows.length === 0 && <div className="soft-card p-6 text-sm text-muted-foreground">No ambient tracks yet.</div>}
      </ul>
    </div>
  );
}

/* ---------------- Affirmations ---------------- */
type Aff = { id: string; text: string; category: string | null; is_published: boolean };

function AffirmationsAdmin() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-affirmations"],
    queryFn: async () => {
      const { data } = await supabase.from("affirmations").select("id,body,category,is_published").order("category");
      return (data ?? []) as Aff[];
    },
  });
  const [text, setText] = useState("");
  const [category, setCategory] = useState("calm");

  const add = useMutation({
    mutationFn: async () => {
      if (!text.trim()) return;
      const { error } = await supabase.from("affirmations").insert({ body: text.trim(), category, is_published: true });
      if (error) throw error;
    },
    onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: ["admin-affirmations"] }); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("affirmations").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-affirmations"] }),
  });

  return (
    <div className="space-y-4">
      <section className="soft-card p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">New affirmation</div>
        <div className="grid gap-2 md:grid-cols-4">
          <input className="rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm md:col-span-3"
            placeholder="I am steady in the effort I chose." value={text} onChange={(e) => setText(e.target.value)} />
          <input className="rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm"
            placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="mt-3"><Button onClick={() => add.mutate()} className="rounded-full">Add</Button></div>
      </section>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="soft-card p-4 flex items-center justify-between gap-3">
            <div><div className="text-sm">{r.text}</div><div className="text-[11px] text-muted-foreground">{r.category ?? "—"}</div></div>
            <button onClick={() => remove.mutate(r.id)} className="text-muted-foreground hover:text-foreground">
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
        {rows.length === 0 && <div className="soft-card p-6 text-sm text-muted-foreground">No affirmations yet.</div>}
      </ul>
    </div>
  );
}

/* ---------------- Live sessions ---------------- */
type Sess = { id: string; title: string; scheduled_at: string; join_url: string | null; recording_url: string | null; cohort_id: string | null };

function SessionsAdmin() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: async () => {
      const { data } = await supabase.from("live_sessions")
        .select("id,title,scheduled_at,zoom_url,recording_url,cohort_id")
        .order("scheduled_at", { ascending: false });
      return (data ?? []) as Sess[];
    },
  });
  const [form, setForm] = useState({ title: "", scheduled_at: "", join_url: "", recording_url: "" });

  const add = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.scheduled_at) return;
      const { error } = await supabase.from("live_sessions").insert({
        title: form.title, scheduled_at: form.scheduled_at,
        join_url: form.join_url || null, recording_url: form.recording_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { setForm({ title: "", scheduled_at: "", join_url: "", recording_url: "" });
      qc.invalidateQueries({ queryKey: ["admin-sessions"] }); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("live_sessions").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-sessions"] }),
  });

  return (
    <div className="space-y-4">
      <section className="soft-card p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Schedule a live session</div>
        <div className="grid gap-2 md:grid-cols-2">
          <input className="rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm"
            placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input type="datetime-local" className="rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm"
            value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
          <input className="rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm md:col-span-2"
            placeholder="Zoom / meet URL" value={form.join_url} onChange={(e) => setForm({ ...form, join_url: e.target.value })} />
          <input className="rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm md:col-span-2"
            placeholder="Recording URL (optional)" value={form.recording_url} onChange={(e) => setForm({ ...form, recording_url: e.target.value })} />
        </div>
        <div className="mt-3"><Button onClick={() => add.mutate()} className="rounded-full">Schedule</Button></div>
      </section>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="soft-card p-4 flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-muted-foreground">{new Date(r.scheduled_at).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-3">
              {r.join_url && <a href={r.join_url} target="_blank" className="text-xs underline text-muted-foreground" rel="noreferrer">Join</a>}
              <button onClick={() => remove.mutate(r.id)} className="text-muted-foreground hover:text-foreground">
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
        {rows.length === 0 && <div className="soft-card p-6 text-sm text-muted-foreground">No sessions scheduled.</div>}
      </ul>
    </div>
  );
}
