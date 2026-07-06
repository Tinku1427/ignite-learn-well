import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Phone, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support — Guiding Mentor" }] }),
  component: () => <Protected><Support /></Protected>,
});

function Support() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Need to talk to someone?</h1>
        <p className="text-muted-foreground text-sm">You're not alone. Reach out any time — we'll respond fast.</p>
      </div>
      <Card className="border-accent/40"><CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3"><Heart className="size-5 text-accent" /><span className="font-medium">Immediate support</span></div>
        <p className="text-sm text-muted-foreground mb-4">If you're struggling right now, please reach out. A short conversation can help.</p>
        <div className="flex flex-wrap gap-2">
          <a href="tel:+911800XXXXXXX"><Button className="gap-2"><Phone className="size-4" /> Call our helpline</Button></a>
          <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer"><Button variant="outline" className="gap-2"><MessageCircle className="size-4" /> WhatsApp us</Button></a>
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-6 text-sm text-muted-foreground">
        In a mental-health emergency in India, iCall (9152987821, Mon–Sat 8am–10pm) and Vandrevala Foundation (1860-2662-345, 24×7) offer free confidential support.
      </CardContent></Card>
    </div>
  );
}
