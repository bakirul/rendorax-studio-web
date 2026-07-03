// hooks/useLUFSMeter.ts
import { useEffect, useRef, useState, type RefObject } from "react";

export const useLUFSMeter = (
  videoRef: RefObject<HTMLVideoElement | null>,
  fileUrl?: string,
  mediaElementKey?: string,
) => {
  const [lufs, setLufs] = useState<number>(-60);
  const videoRefStable = useRef(videoRef);
  videoRefStable.current = videoRef;

  useEffect(() => {
    if (!fileUrl) {
      setLufs(-60);
      return;
    }

    let cancelled = false;
    let rafId = 0;
    let sourceNode: MediaElementAudioSourceNode | null = null;
    let workletNode: AudioWorkletNode | null = null;
    let audioCtx: AudioContext | null = null;
    let boundVideo: HTMLVideoElement | null = null;

    const teardownAudio = () => {
      if (boundVideo) {
        boundVideo.removeEventListener("play", initAudio);
        boundVideo = null;
      }
      workletNode?.disconnect();
      workletNode = null;
      sourceNode?.disconnect();
      sourceNode = null;
      if (audioCtx && audioCtx.state !== "closed") {
        void audioCtx.close();
      }
      audioCtx = null;
    };

    const initAudio = async () => {
      if (cancelled || !boundVideo || audioCtx) return;

      try {
        audioCtx = new (
          window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        )();

        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }

        await audioCtx.audioWorklet.addModule("/worklets/lufs-processor.js");

        if (cancelled || !boundVideo) {
          await audioCtx.close();
          audioCtx = null;
          return;
        }

        sourceNode = audioCtx.createMediaElementSource(boundVideo);
        workletNode = new AudioWorkletNode(audioCtx, "lufs-processor");

        workletNode.port.onmessage = (event) => {
          setLufs(event.data.lufs);
        };

        sourceNode.connect(workletNode);
        workletNode.connect(audioCtx.destination);
      } catch (error) {
        console.error("[WebAudio] API initialization failed:", error);
        teardownAudio();
      }
    };

    const bindVideo = (video: HTMLVideoElement) => {
      if (boundVideo === video) {
        if (!audioCtx && !video.paused) {
          void initAudio();
        }
        return;
      }

      teardownAudio();
      boundVideo = video;
      video.addEventListener("play", initAudio);

      if (!video.paused) {
        void initAudio();
      }
    };

    const watchVideoElement = () => {
      if (cancelled) return;

      const video = videoRefStable.current.current;
      if (!video) {
        rafId = requestAnimationFrame(watchVideoElement);
        return;
      }

      if (boundVideo !== video) {
        bindVideo(video);
      } else if (!audioCtx && !video.paused) {
        void initAudio();
      }

      const currentVideo = videoRefStable.current.current;
      const needsWatch =
        !currentVideo ||
        boundVideo !== currentVideo ||
        (!audioCtx && boundVideo === currentVideo && !currentVideo.paused);
      if (needsWatch) {
        rafId = requestAnimationFrame(watchVideoElement);
      }
    };

    watchVideoElement();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      teardownAudio();
      setLufs(-60);
    };
  }, [fileUrl, videoRef, mediaElementKey]);

  return { lufs };
};
