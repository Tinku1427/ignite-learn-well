import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Paperclip, X } from "lucide-react";

export const Route = createFileRoute("/assignments")({
  head: () => ({ meta: [{ title: "Assignments — Guiding Mentor" }] }),
  component: () => <Protected><Assignments /></Protected>,
});

const MAX_MB = 25;
const BLOCKED_EXT = /\.(exe|bat|cmd|sh|ps1|js|jar|com|scr|msi|dll|py|rb|php)$/i;

function Assignments() {
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["assignments", uid],
    queryFn: async () => {
      const [a, s] = await Promise.all([
        supabase.from("assignments").select("*, subjects(name)").order("due_at", { ascending: true }),
        supabase.from("assignment_submissions").select("*").eq("user_id", uid!),
      ]);
      return { assignments: a.data ?? [], subs: s.data ?? [] };
    },
    enabled: !!uid,
  });

  const [openId, setOpenId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const submit = useMutation({
    mutationFn: async () => {
      if (!openId || !uid) return;
      let file_url: string | null = null;
      if (file) {
        if (file.size > MAX_MB * 1024 * 1024) throw new Error(`File is over ${MAX_MB} MB`);
        if (BLOCKED_EXT.test(file.name)) throw new Error("That file type isn't allowed");
        const path = `${uid}/${openId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const up = await supabase.storage.from("assignments").upload(path, file, { upsert: false, contentType: file.type || undefined });
        if (up.error) throw up.error;
        file_url = up.data.path;
      }
      const { error } = await supabase.from("assignment_submissions").insert({
        assignment_id: openId, user_id: uid, text_answer: text || null, file_url, status: "submitted",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Submitted"); setOpenId(null); setText(""); setFile(null); qc.invalidateQueries({ queryKey: ["assignments", uid] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const submissionFor = (id: string) => data?.subs.find((s) => s.assignment_id === id);

  const now = new Date();
  const monthSubs = (data?.subs ?? []).filter((s) => new Date(s.submitted_at) > new Date(now.getFullYear(), now.getMonth(), 1));
  const monthTotal = (data?.assignments ?? []).filter((a) => a.due_at && new Date(a.due_at) > new Date(now.getFullYear(), now.getMonth(), 1)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Assignments</h1>
        <p className="text-muted-foreground text-sm">Submit, get feedback, stay on track.</p>
      </div>

      <Card><CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">This month</div>
          <div className="text-sm text-muted-foreground">{monthSubs.length} / {Math.max(monthTotal, monthSubs.length)}</div>
        </div>
        <Progress value={monthTotal ? (monthSubs.length / monthTotal) * 100 : 0} />
      </CardContent></Card>

      <div className="grid gap-3">
        {(data?.assignments ?? []).map((a) => {
          const sub = submissionFor(a.id);
          const late = a.due_at && new Date(a.due_at) < now && !sub;
          return (
            <Card key={a.id}><CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {(a as any).subjects?.name ?? "General"} · Due {a.due_at ? format(new Date(a.due_at), "d MMM") : "—"}
                  </div>
                  {a.instructions && <div className="text-sm text-muted-foreground mt-2 max-w-2xl">{a.instructions}</div>}
                </div>
                <div className="flex gap-2 items-center">
                  {sub?.status === "reviewed" ? <Badge className="bg-success text-primary-foreground">Reviewed</Badge>
                    : sub ? <Badge variant="secondary">Submitted</Badge>
                    : late ? <Badge variant="destructive">Late</Badge>
                    : <Badge variant="outline">Not started</Badge>}
                  {!sub && (
                    <Dialog open={openId === a.id} onOpenChange={(o) => { setOpenId(o ? a.id : null); if (!o) { setText(""); setFile(null); } }}>
                      <DialogTrigger asChild><Button size="sm">Submit</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Submit: {a.title}</DialogTitle></DialogHeader>
                        <Textarea rows={5} placeholder="Type your answer, notes, or a link…" value={text} onChange={(e) => setText(e.target.value)} />
                        <div className="space-y-2">
                          <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                          {file ? (
                            <div className="flex items-center justify-between rounded-lg border p-2 text-sm">
                              <span className="truncate">{file.name} · {(file.size / (1024*1024)).toFixed(1)} MB</span>
                              <Button size="icon" variant="ghost" onClick={() => setFile(null)}><X className="size-4" /></Button>
                            </div>
                          ) : (
                            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
                              <Paperclip className="size-4" /> Attach a file
                            </Button>
                          )}
                          <p className="text-xs text-muted-foreground">Any file up to {MAX_MB} MB — PDF, DOCX, images (JPG/PNG/HEIC), audio, presentations, spreadsheets. Executables and scripts aren't allowed.</p>
                        </div>
                        <Button onClick={() => submit.mutate()} disabled={submit.isPending || (!text.trim() && !file)}>
                          {submit.isPending ? "Submitting…" : "Submit answer"}
                        </Button>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
              {sub?.feedback && (
                <div className="mt-3 rounded-lg bg-secondary p-3 text-sm">
                  <div className="font-medium">Feedback{sub.grade ? ` · ${sub.grade}` : ""}</div>
                  <div className="text-muted-foreground">{sub.feedback}</div>
                </div>
              )}
            </CardContent></Card>
          );
        })}
        {(data?.assignments.length ?? 0) === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No assignments yet.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
