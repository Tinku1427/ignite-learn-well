import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";

export const Route = createFileRoute("/admin/students")({ component: AdminStudents });

function AdminStudents() {
  const [q, setQ] = useState("");
  const [exam, setExam] = useState<string>("");

  const { data } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = (data ?? []).filter((s) =>
    (!q || (s.full_name ?? "").toLowerCase().includes(q.toLowerCase())) && (!exam || s.exam === exam)
  );

  const exportCsv = () => {
    const rows = [["Name","Exam","Target Year","Phone","Joined"], ...filtered.map((s) => [s.full_name, s.exam, s.target_year, s.phone, s.created_at])];
    const csv = rows.map((r) => r.map((c) => `"${(c ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "students.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold">Students</h1>
          <p className="text-muted-foreground text-sm">Filter, open a profile, or export.</p>
        </div>
        <Button variant="outline" onClick={exportCsv} className="gap-2"><Download className="size-4" /> Export CSV</Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Input placeholder="Search name…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        {["", "JEE", "NEET"].map((e) => (
          <Button key={e || "all"} size="sm" variant={exam === e ? "default" : "outline"} onClick={() => setExam(e)}>{e || "All"}</Button>
        ))}
      </div>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground text-left">
            <tr><th className="p-3">Name</th><th className="p-3">Exam</th><th className="p-3">Year</th><th className="p-3">Phone</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 font-medium">{s.full_name || "—"}</td>
                <td className="p-3"><Badge variant="secondary">{s.exam ?? "—"}</Badge></td>
                <td className="p-3">{s.target_year ?? "—"}</td>
                <td className="p-3">{s.phone ?? "—"}</td>
                <td className="p-3"><Link to="/admin/students/$id" params={{ id: s.id }}><Button size="sm" variant="ghost">Open →</Button></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
