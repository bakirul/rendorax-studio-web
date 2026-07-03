"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface VideoTimelineScrubberProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  disabled?: boolean;
  mediaKey?: string;
}

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function VideoTimelineScrubber({
  videoRef,
  disabled = false,
  mediaKey = "",
}: VideoTimelineScrubberProps) {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const isScrubbingRef = useRef(false);

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
    if (video) setCurrentTime(video.currentTime);
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
        className="video-timeline-scrubber w-full"
        style={{ ["--scrub-progress" as string]: `${progress}%` }}
        aria-label="Video timeline"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        aria-disabled={disabled}
      />
    </div>
  );
}
