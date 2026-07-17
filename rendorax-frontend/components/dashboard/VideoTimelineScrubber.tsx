"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VideoCommentRow } from "@/utils/commentAuthor";

export type TimelineScrubberComment = Pick<
  VideoCommentRow,
  "id" | "time_stamp" | "comment_text"
>;

interface VideoTimelineScrubberProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  disabled?: boolean;
  mediaKey?: string;
  comments?: ReadonlyArray<TimelineScrubberComment>;
  onMarkerClick?: (timeSeconds: number) => void;
  /** Fired once when the user finishes a scrub gesture (not on every input tick). */
  onSeekCommit?: (timeSeconds: number) => void;
}

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function truncateText(text: string, maxLength = 80): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

function markerPercent(timeStamp: number, duration: number): number {
  if (duration <= 0 || !Number.isFinite(duration)) return 0;
  const clamped = Math.max(0, Math.min(timeStamp, duration));
  return Math.min(100, Math.max(0, (clamped / duration) * 100));
}

export default function VideoTimelineScrubber({
  videoRef,
  disabled = false,
  mediaKey = "",
  comments = [],
  onMarkerClick,
  onSeekCommit,
}: VideoTimelineScrubberProps) {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const isScrubbingRef = useRef(false);

  const showMarkers =
    !disabled && duration > 0 && Number.isFinite(duration) && comments.length > 0;

  const markerItems = useMemo(
    () =>
      showMarkers
        ? comments.map((comment) => ({
            ...comment,
            percent: markerPercent(comment.time_stamp, duration),
          }))
        : [],
    [comments, duration, showMarkers],
  );

  useEffect(() => {
    setDuration(0);
    setCurrentTime(0);
    isScrubbingRef.current = false;
  }, [mediaKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || disabled) return;

    const updateDuration = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        setDuration(video.duration);
      }
    };

    const updateTime = () => {
      if (!isScrubbingRef.current) {
        setCurrentTime(video.currentTime);
      }
    };

    updateDuration();
    updateTime();

    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("durationchange", updateDuration);
    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("seeking", updateTime);
    video.addEventListener("seeked", updateTime);

    return () => {
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("durationchange", updateDuration);
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("seeking", updateTime);
      video.removeEventListener("seeked", updateTime);
    };
  }, [videoRef, disabled, mediaKey]);

  const seekTo = useCallback(
    (value: number) => {
      const video = videoRef.current;
      if (!video || disabled) return;

      const max = duration > 0 ? duration : video.duration;
      if (!Number.isFinite(max) || max <= 0) return;

      const clamped = Math.max(0, Math.min(value, max));
      setCurrentTime(clamped);
      video.currentTime = clamped;
    },
    [videoRef, disabled, duration],
  );

  const handleInput = (event: React.FormEvent<HTMLInputElement>) => {
    seekTo(parseFloat(event.currentTarget.value));
  };

  const beginScrub = () => {
    isScrubbingRef.current = true;
  };

  const endScrub = () => {
    isScrubbingRef.current = false;
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      onSeekCommit?.(video.currentTime);
    }
  };

  const handleMarkerClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    timeStamp: number,
  ) => {
    event.stopPropagation();
    if (disabled || !onMarkerClick) return;
    onMarkerClick(timeStamp);
  };

  const progress =
    duration > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  return (
    <div
      className={`w-full rounded-lg border border-white/10 bg-[#0a0a0f]/90 px-3 py-2.5 shadow-inner ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between text-[9px] font-mono tracking-wider text-gray-500">
        <span className="text-[#d4af37]/80">
          {disabled ? "00:00" : formatClock(currentTime)}
        </span>
        <span>{disabled ? "00:00" : formatClock(duration)}</span>
      </div>
      <div className="relative w-full">
        {showMarkers &&
          markerItems.map((comment) => (
            <button
              key={comment.id}
              type="button"
              className="absolute top-1/2 z-20 flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sm border border-[#1a1a1f] bg-[#c9a227] shadow-[0_0_0_1px_rgba(212,175,55,0.35)] transition-transform hover:scale-125 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#d4af37]"
              style={{ left: `${comment.percent}%` }}
              title={`${formatClock(comment.time_stamp)} — ${truncateText(comment.comment_text)}`}
              aria-label={`Jump to comment at ${formatClock(comment.time_stamp)}: ${truncateText(comment.comment_text, 120)}`}
              onClick={(event) => handleMarkerClick(event, comment.time_stamp)}
              onPointerDown={(event) => event.stopPropagation()}
            />
          ))}
        <input
          type="range"
          min={0}
          max={duration > 0 ? duration : 1}
          step={0.033}
          value={disabled ? 0 : currentTime}
          disabled={disabled}
          onInput={handleInput}
          onChange={handleInput}
          onPointerDown={beginScrub}
          onPointerUp={endScrub}
          onPointerCancel={endScrub}
          onLostPointerCapture={endScrub}
          className="video-timeline-scrubber relative z-10 w-full"
          style={{ ["--scrub-progress" as string]: `${progress}%` }}
          aria-label="Video timeline"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          aria-disabled={disabled}
        />
      </div>
    </div>
  );
}
