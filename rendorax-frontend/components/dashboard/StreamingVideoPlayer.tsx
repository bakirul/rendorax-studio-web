"use client";

import React, {
  forwardRef,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { isRemoteMediaUrl, isR2MediaUrl, isHlsPlaybackUrl } from "@/utils/videoStreaming";
import { sanitizeAbsoluteMediaUrl } from "@/utils/mediaAssets";
import {
  normalizeAspectRatioSetting,
  type AspectRatioSetting,
} from "@/utils/playerAspectRatio";

/** Hardcoded map — Tailwind JIT must see these literals in source. */
const aspectMap = {
  "16:9": "aspect-video",
  "1.89:1": "aspect-[1.89/1]",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
} as const;

const INNER_FRAME_BASE =
  "relative w-full h-full max-w-full max-h-full transition-[aspect-ratio] duration-300";

const BUFFERING_OVERLAY_DELAY_MS = 400;

/** Switch branches keep every aspect-* class as a static JSX literal. */
function AspectRatioFrame({
  aspectRatio,
  videoClassName,
  children,
}: {
  aspectRatio: string;
  videoClassName: string;
  children: ReactNode;
}) {
  switch (normalizeAspectRatioSetting(aspectRatio)) {
    case "dci":
      return (
        <div
          className={`${INNER_FRAME_BASE} ${aspectMap["1.89:1"]} ${videoClassName}`}
        >
          {children}
        </div>
      );
    case "square":
      return (
        <div
          className={`${INNER_FRAME_BASE} ${aspectMap["1:1"]} ${videoClassName}`}
        >
          {children}
        </div>
      );
    case "portrait":
      return (
        <div
          className={`${INNER_FRAME_BASE} ${aspectMap["9:16"]} ${videoClassName}`}
        >
          {children}
        </div>
      );
    case "video":
    default:
      return (
        <div
          className={`${INNER_FRAME_BASE} ${aspectMap["16:9"]} ${videoClassName}`}
        >
          {children}
        </div>
      );
  }
}

export interface StreamingVideoPlayerProps
  extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, "children"> {
  src: string;
  /** Forces a full remount when the selected asset changes (e.g. Prisma id). */
  playbackKey?: string;
  children?: ReactNode;
  showLoadingOverlay?: boolean;
  loadingLabel?: string;
  aspectRatio?: AspectRatioSetting | string;
  videoClassName?: string;
}

function LoadingOverlay({
  label,
  isR2,
}: {
  label: string;
  isR2: boolean;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/75 backdrop-blur-sm">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#d4af37] border-t-transparent" />
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">
        {label}
      </p>
      {isR2 && (
        <p className="max-w-[80%] text-center text-[9px] text-gray-500">
          Streaming from Cloudflare R2
        </p>
      )}
    </div>
  );
}

const StreamingVideoPlayer = forwardRef<
  HTMLVideoElement,
  StreamingVideoPlayerProps
>(function StreamingVideoPlayer(
  {
    src,
    playbackKey,
    aspectRatio = "video",
    videoClassName = "object-cover",
    showLoadingOverlay = true,
    loadingLabel = "Buffering video…",
    autoPlay,
    crossOrigin,
    onWaiting,
    onPlaying,
    onCanPlay,
    onLoadedData,
    onError,
    onLoadStart,
    onStalled,
    children,
    className: _legacyClassName,
    ...rest
  },
  ref,
) {
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const internalRef = useRef<HTMLVideoElement | null>(null);
  const bufferingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sanitizedSrc = useMemo(() => sanitizeAbsoluteMediaUrl(src), [src]);
  const isR2 = isR2MediaUrl(sanitizedSrc);
  const resolvedCrossOrigin =
    crossOrigin ?? (isRemoteMediaUrl(sanitizedSrc) ? "anonymous" : undefined);
  const remountKey = playbackKey ?? sanitizedSrc;

  const setVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      internalRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  const clearBufferingTimer = useCallback(() => {
    if (bufferingTimerRef.current) {
      clearTimeout(bufferingTimerRef.current);
      bufferingTimerRef.current = null;
    }
  }, []);

  const scheduleBufferingOverlay = useCallback(() => {
    clearBufferingTimer();
    bufferingTimerRef.current = setTimeout(() => {
      setIsBuffering(true);
    }, BUFFERING_OVERLAY_DELAY_MS);
  }, [clearBufferingTimer]);

  const markReady = useCallback(() => {
    clearBufferingTimer();
    setIsBuffering(false);
  }, [clearBufferingTimer]);

  useEffect(() => {
    setIsBuffering(true);
    setHasError(false);
    return clearBufferingTimer;
  }, [remountKey, sanitizedSrc, clearBufferingTimer]);

  const teardownVideoElement = useCallback((video: HTMLVideoElement) => {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }, []);

  useEffect(() => {
    const video = internalRef.current;
    if (!video) return;

    if (!sanitizedSrc) {
      teardownVideoElement(video);
      return;
    }

    const isHls = isHlsPlaybackUrl(sanitizedSrc);
    let cancelled = false;
    let hlsInstance: { destroy: () => void } | null = null;

    const attachSource = async () => {
      video.pause();
      video.removeAttribute("src");

      if (isHls) {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = sanitizedSrc;
          video.load();
        } else {
          const { default: Hls } = await import("hls.js");
          if (cancelled) return;

          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              startLevel: -1,
              capLevelToPlayerSize: true,
            });
            hlsInstance = hls;
            hls.loadSource(sanitizedSrc);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (autoPlay) {
                void video.play().catch(() => {
                  // Autoplay may be blocked until user gesture.
                });
              }
            });
            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (data.fatal) {
                clearBufferingTimer();
                setIsBuffering(false);
                setHasError(true);
              }
            });
          } else {
            video.src = sanitizedSrc;
            video.load();
          }
        }
      } else {
        video.src = sanitizedSrc;
        video.load();
      }

      if (!isHls && autoPlay) {
        void video.play().catch(() => {
          // Autoplay may be blocked until user gesture.
        });
      }
    };

    void attachSource();

    return () => {
      cancelled = true;
      hlsInstance?.destroy();
      hlsInstance = null;
      teardownVideoElement(video);
    };
  }, [
    remountKey,
    sanitizedSrc,
    autoPlay,
    clearBufferingTimer,
    teardownVideoElement,
  ]);

  const handleWaiting = useCallback(
    (event: React.SyntheticEvent<HTMLVideoElement>) => {
      scheduleBufferingOverlay();
      onWaiting?.(event);
    },
    [onWaiting, scheduleBufferingOverlay],
  );

  const handleStalled = useCallback(
    (event: React.SyntheticEvent<HTMLVideoElement>) => {
      scheduleBufferingOverlay();
      const video = event.currentTarget;
      if (!video.paused && video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
        void video.play().catch(() => {
          // Ignore recovery play failures.
        });
      }
      onStalled?.(event);
    },
    [onStalled, scheduleBufferingOverlay],
  );

  return (
    <div className="relative flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden bg-black/40">
      <AspectRatioFrame aspectRatio={aspectRatio} videoClassName={videoClassName}>
        <video
          key={remountKey}
          ref={setVideoRef}
          preload="metadata"
          playsInline
          crossOrigin={resolvedCrossOrigin}
          autoPlay={autoPlay}
          className={`absolute inset-0 h-full w-full bg-[#050505] ${videoClassName}`}
          onLoadStart={(event) => {
            scheduleBufferingOverlay();
            onLoadStart?.(event);
          }}
          onWaiting={handleWaiting}
          onStalled={handleStalled}
          onPlaying={(event) => {
            markReady();
            onPlaying?.(event);
          }}
          onCanPlay={(event) => {
            markReady();
            onCanPlay?.(event);
          }}
          onLoadedData={(event) => {
            markReady();
            onLoadedData?.(event);
          }}
          onError={(event) => {
            clearBufferingTimer();
            setIsBuffering(false);
            setHasError(true);
            onError?.(event);
          }}
          {...rest}
        >
          {children}
        </video>

        {showLoadingOverlay && isBuffering && !hasError && (
          <LoadingOverlay
            label={
              sanitizedSrc
                ? loadingLabel
                : "Preparing optimized stream…"
            }
            isR2={isR2 || Boolean(sanitizedSrc)}
          />
        )}

        {hasError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-black/80 px-4 text-center">
            <span className="text-2xl opacity-40">⚠️</span>
            <p className="text-[11px] font-semibold text-gray-200">
              Unable to load video
            </p>
            <p className="text-[10px] text-gray-500">
              Check your connection or R2 CORS / Range request settings.
            </p>
          </div>
        )}
      </AspectRatioFrame>
    </div>
  );
});

export default React.memo(StreamingVideoPlayer);
