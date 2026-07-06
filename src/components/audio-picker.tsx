import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Music, VolumeX } from "lucide-react";

export type AudioTrack = { id: string; title: string; category: "focus" | "relax"; url: string };

export function useAudioTracks(category: "focus" | "relax") {
  return useQuery({
    queryKey: ["audio_tracks", category],
    queryFn: async () => {
      const { data } = await supabase.from("audio_tracks").select("*").eq("category", category).order("title");
      return (data ?? []) as AudioTrack[];
    },
  });
}

export function TrackChips({
  tracks,
  selectedId,
  onSelect,
  onStop,
}: {
  tracks: AudioTrack[];
  selectedId: string | null;
  onSelect: (t: AudioTrack) => void;
  onStop: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tracks.map((t) => (
        <Button
          key={t.id}
          size="sm"
          variant={selectedId === t.id ? "default" : "outline"}
          onClick={() => onSelect(t)}
          className="gap-2"
        >
          <Music className="size-3" />
          {t.title}
        </Button>
      ))}
      {selectedId && (
        <Button size="sm" variant="ghost" onClick={onStop} className="gap-2">
          <VolumeX className="size-3" /> Stop
        </Button>
      )}
    </div>
  );
}
