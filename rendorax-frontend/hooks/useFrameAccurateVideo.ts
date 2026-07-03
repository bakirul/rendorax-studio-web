// hooks/useFrameAccurateVideo.ts
import { useState, useEffect, useCallback, RefObject } from "react";

interface FrameAccurateState {
  currentFrame: number;
  smpteTimecode: string;
  stepForward: () => void;
  stepBackward: () => void;
  seekToFrame: (frame: number) => void;
}

export const useFrameAccurateVideo = (
  videoRef: RefObject<HTMLVideoElement>,
  frameRate: number = 24,
): FrameAccurateState => {
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [smpteTimecode, setSmpteTimecode] = useState<string>("00:00:00:00");

  // Helper: Pad numbers with leading zeros (e.g., 5 -> "05")
  const pad = (num: number, size: number = 2): string => {
    let s = num.toString();
    while (s.length < size) s = "0" + s;
    return s;
  };

  // Convert raw seconds into strictly formatted SMPTE Timecode
  const calculateSMPTE = useCallback((timeInSeconds: number, fps: number) => {
    const exactFrame = Math.floor((timeInSeconds + 0.00001) * fps);

    const hours = Math.floor(exactFrame / (fps * 3600));
    const minutes = Math.floor((exactFrame % (fps * 3600)) / (fps * 60));
    const seconds = Math.floor((exactFrame % (fps * 60)) / fps);
    const frames = Math.floor(exactFrame % fps);

    setCurrentFrame(exactFrame);
    setSmpteTimecode(
      `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`,
    );
  }, []);

  // Sync state using requestAnimationFrame for 60fps UI refresh
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return; // Exit if video isn't rendered yet

    let animationFrameId: number;

    const updateLoop = () => {
      calculateSMPTE(video.currentTime, frameRate);
      animationFrameId = requestAnimationFrame(updateLoop);
    };

    const handlePlay = () => {
      animationFrameId = requestAnimationFrame(updateLoop);
    };

    const handlePause = () => {
      cancelAnimationFrame(animationFrameId);
      // Run one last time to ensure exact lock-on pause
      calculateSMPTE(video.currentTime, frameRate);
    };

    const handleSeek = () => {
      calculateSMPTE(video.currentTime, frameRate);
    };

    const handleSeeking = () => {
      calculateSMPTE(video.currentTime, frameRate);
    };

    // 🔥 Added standard timeupdate for scrubbing the native video timeline
    const handleTimeUpdate = () => {
      if (video.paused) {
        calculateSMPTE(video.currentTime, frameRate);
      }
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("seeked", handleSeek);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("timeupdate", handleTimeUpdate);

    // Initial calculation setup
    calculateSMPTE(video.currentTime, frameRate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeked", handleSeek);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [videoRef.current, frameRate, calculateSMPTE]); // 🔥 Changed to strictly watch .current

  // Expose precise controls
  const stepForward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause(); // Ensure we don't step while playing
      const newTime = videoRef.current.currentTime + 1 / frameRate;
      videoRef.current.currentTime = Math.min(
        newTime,
        videoRef.current.duration || newTime,
      );
    }
  }, [videoRef, frameRate]);

  const stepBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      const newTime = videoRef.current.currentTime - 1 / frameRate;
      videoRef.current.currentTime = Math.max(newTime, 0);
    }
  }, [videoRef, frameRate]);

  const seekToFrame = useCallback(
    (frame: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = frame / frameRate;
      }
    },
    [videoRef, frameRate],
  );

  return {
    currentFrame,
    smpteTimecode,
    stepForward,
    stepBackward,
    seekToFrame,
  };
};
