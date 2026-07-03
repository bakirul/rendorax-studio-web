"use client";

import React from "react";
import type { VideoSubtitleTrack } from "@/store/useDashboardStore";

interface VideoCaptionTracksProps {
  tracks: VideoSubtitleTrack[];
}

export default function VideoCaptionTracks({ tracks }: VideoCaptionTracksProps) {
  if (tracks.length === 0) return null;

  return (
    <>
      {tracks.map((track) => (
        <track
          key={`${track.language}-${track.vttUrl}`}
          kind="captions"
          src={track.vttUrl}
          srcLang={track.language}
          label={track.label}
          default={Boolean(track.isDefault)}
        />
      ))}
    </>
  );
}
