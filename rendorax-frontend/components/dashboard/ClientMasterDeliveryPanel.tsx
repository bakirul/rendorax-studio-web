"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AssetGridMedia from "@/components/dashboard/AssetGridMedia";
import DeliveryAssetThumbnail from "@/components/dashboard/DeliveryAssetThumbnail";
import { useGalleryViewStyles } from "@/hooks/useGalleryViewStyles";
import type { MediaAssetRecord } from "@/utils/mediaAssets";
import {
  getMediaPlaybackUrl,
  resolveGalleryThumbnail,
} from "@/utils/mediaAssets";
import { isMediaFilePreviewable } from "@/utils/mediaFileCategory";
import {
  fetchMasterDelivery,
  formatMasterDeliveryActor,
  formatMasterDeliveryDate,
  formatMasterDeliveryTimestamp,
  getMasterDeliveryStatusLabel,
  hasActiveMasterDelivery,
  resolveMasterDeliveryClientAccess,
  triggerMasterDeliveryDownload,
  type MasterDeliveryEvent,
  type MasterDeliveryHistoryResponse,
} from "@/utils/masterDelivery";

type DownloadPhase = "idle" | "preparing" | "started";

type DeliveryGalleryItem = {
  mediaAssetId: string;
  fileName: string;
  event: MasterDeliveryEvent;
  isCurrent: boolean;
  asset: MediaAssetRecord | null;
};

interface ClientMasterDeliveryPanelProps {
  agencyProjectId: string;
  onViewInPlayer?: (mediaAssetId: string) => Promise<void>;
  resolvePreviewAsset?: (
    mediaAssetId: string,
  ) => Promise<MediaAssetRecord | null>;
  activePreviewAssetId?: string | null;
  /** Organization membership gate for Master download (backend still enforces). */
  allowDownload?: boolean;
}

function eventTypeLabel(eventType: MasterDeliveryEvent["eventType"]): string {
  switch (eventType) {
    case "delivered":
      return "Delivered";
    case "replaced":
      return "Replaced";
    case "restored":
      return "Restored";
    case "expired":
      return "Expired";
    default:
      return "Event";
  }
}

export default function ClientMasterDeliveryPanel({
  agencyProjectId,
  onViewInPlayer,
  resolvePreviewAsset,
  activePreviewAssetId = null,
  allowDownload = true,
}: ClientMasterDeliveryPanelProps) {
  const {
    viewMode,
    containerClass,
    gridStyle,
    aspectClass,
    objectFitClass,
    showCardInfo,
  } = useGalleryViewStyles();

  const [current, setCurrent] = useState<MasterDeliveryEvent | null>(null);
  const [history, setHistory] = useState<MasterDeliveryEvent[]>([]);
  const [assetById, setAssetById] = useState<Record<string, MediaAssetRecord>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [downloadPhase, setDownloadPhase] = useState<DownloadPhase>("idle");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const loadGenerationRef = useRef(0);
  const assetsGenerationRef = useRef(0);
  const downloadStartedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const applyResponse = useCallback((payload: MasterDeliveryHistoryResponse) => {
    setCurrent(payload.current);
    setHistory(payload.history ?? []);
  }, []);

  const loadState = useCallback(async () => {
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    setError(null);
    setDownloadError(null);
    setPreviewError(null);

    try {
      const payload = await fetchMasterDelivery(agencyProjectId);
      if (generation !== loadGenerationRef.current) return;
      applyResponse(payload);
    } catch (loadError) {
      if (generation !== loadGenerationRef.current) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load master delivery state",
      );
      setCurrent(null);
      setHistory([]);
      setAssetById({});
    } finally {
      if (generation === loadGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [agencyProjectId, applyResponse]);

  useEffect(() => {
    setHistoryOpen(false);
    setDownloadError(null);
    setPreviewError(null);
    setDownloadPhase("idle");
    void loadState();
  }, [agencyProjectId, loadState]);

  const uniqueDeliveryEvents = useMemo(() => {
    const seen = new Set<string>();
    const items: MasterDeliveryEvent[] = [];
    for (const event of history.length > 0 ? history : current ? [current] : []) {
      const id = event.mediaAssetId?.trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      items.push(event);
    }
    return items;
  }, [history, current]);

  useEffect(() => {
    if (!resolvePreviewAsset || uniqueDeliveryEvents.length === 0) {
      setAssetById({});
      return;
    }

    const generation = ++assetsGenerationRef.current;
    let cancelled = false;

    void (async () => {
      const next: Record<string, MediaAssetRecord> = {};
      await Promise.all(
        uniqueDeliveryEvents.map(async (event) => {
          const id = event.mediaAssetId.trim();
          const asset = await resolvePreviewAsset(id);
          if (asset) next[id] = asset;
        }),
      );
      if (cancelled || generation !== assetsGenerationRef.current) return;
      setAssetById(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [uniqueDeliveryEvents, resolvePreviewAsset]);

  useEffect(() => {
    return () => {
      if (downloadStartedTimerRef.current) {
        clearTimeout(downloadStartedTimerRef.current);
      }
    };
  }, []);

  const accessBase = resolveMasterDeliveryClientAccess(current);
  const access = {
    ...accessBase,
    canDownload: allowDownload && accessBase.canDownload,
  };
  const previewAsset = current?.mediaAssetId
    ? assetById[current.mediaAssetId] ?? null
    : null;
  const fileName =
    previewAsset?.fileName?.trim() ||
    current?.mediaAsset?.fileName?.trim() ||
    current?.mediaAssetId ||
    null;
  const active = hasActiveMasterDelivery(current);
  const previewable = fileName ? isMediaFilePreviewable(fileName) : false;
  const canPreviewCurrent =
    Boolean(onViewInPlayer) &&
    access.status === "available" &&
    active &&
    previewable &&
    Boolean(current?.mediaAssetId);
  const isPreviewActive =
    Boolean(current?.mediaAssetId) &&
    activePreviewAssetId === current.mediaAssetId;

  const galleryItems: DeliveryGalleryItem[] = useMemo(() => {
    return uniqueDeliveryEvents.map((event) => {
      const mediaAssetId = event.mediaAssetId.trim();
      const asset = assetById[mediaAssetId] ?? null;
      return {
        mediaAssetId,
        fileName:
          asset?.fileName?.trim() ||
          event.mediaAsset?.fileName?.trim() ||
          mediaAssetId,
        event,
        isCurrent: current?.mediaAssetId === mediaAssetId,
        asset,
      };
    });
  }, [uniqueDeliveryEvents, assetById, current?.mediaAssetId]);

  const handleDownload = async () => {
    if (
      !current?.mediaAssetId ||
      !access.canDownload ||
      downloadPhase === "preparing"
    ) {
      return;
    }

    setDownloadPhase("preparing");
    setDownloadError(null);

    try {
      await triggerMasterDeliveryDownload(current.mediaAssetId);
      setDownloadPhase("started");
      if (downloadStartedTimerRef.current) {
        clearTimeout(downloadStartedTimerRef.current);
      }
      downloadStartedTimerRef.current = setTimeout(() => {
        setDownloadPhase("idle");
        downloadStartedTimerRef.current = null;
      }, 4000);
    } catch (err) {
      setDownloadPhase("idle");
      setDownloadError(
        err instanceof Error ? err.message : "Download failed",
      );
    }
  };

  const handleViewInPlayer = async (mediaAssetId: string) => {
    if (!onViewInPlayer || access.status === "expired" || previewingId) return;

    const item = galleryItems.find((entry) => entry.mediaAssetId === mediaAssetId);
    const name = item?.fileName ?? "";
    if (!isMediaFilePreviewable(name)) {
      setPreviewError("Preview unavailable for this file type");
      return;
    }

    if (access.status !== "available" || !active) {
      setPreviewError("Player preview unavailable — delivery access has ended");
      return;
    }

    setPreviewingId(mediaAssetId);
    setPreviewError(null);
    try {
      await onViewInPlayer(mediaAssetId);
    } catch (err) {
      setPreviewError(
        err instanceof Error ? err.message : "Failed to open preview",
      );
    } finally {
      setPreviewingId(null);
    }
  };

  const downloadLabel =
    downloadPhase === "preparing"
      ? "Preparing download…"
      : downloadPhase === "started"
        ? "Download started"
        : "Download Master";

  const statusText =
    access.status === "available"
      ? "Available"
      : getMasterDeliveryStatusLabel(current) === "Expired" ||
          access.status === "expired"
        ? "Expired"
        : getMasterDeliveryStatusLabel(current);

  const renderGalleryItem = (item: DeliveryGalleryItem) => {
    const canView =
      Boolean(onViewInPlayer) &&
      access.status === "available" &&
      active &&
      isMediaFilePreviewable(item.fileName);
    const canDownloadItem =
      item.isCurrent && access.canDownload && active;
    const playing = activePreviewAssetId === item.mediaAssetId;
    const playbackUrl = item.asset ? getMediaPlaybackUrl(item.asset) : "";
    const thumbnailUrl = item.asset
      ? resolveGalleryThumbnail(item.asset, playbackUrl)
      : null;
    const isVideo = isMediaFilePreviewable(item.fileName)
      ? item.fileName.match(/\.(mp4|webm|ogg|mov|mxf|mkv|avi)$/i) != null
      : false;

    if (viewMode === "list") {
      return (
        <div
          key={item.mediaAssetId}
          className={`flex flex-wrap items-center gap-3 rounded-md border bg-[#121217] p-3 min-w-0 ${
            playing
              ? "border-emerald-500/50"
              : item.isCurrent
                ? "border-emerald-500/25"
                : "border-white/5"
          }`}
        >
          <button
            type="button"
            disabled={!canView || previewingId === item.mediaAssetId}
            onClick={() => void handleViewInPlayer(item.mediaAssetId)}
            className="shrink-0 rounded disabled:opacity-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/50"
            title={canView ? "View in Player" : undefined}
          >
            <DeliveryAssetThumbnail
              asset={item.asset}
              fileName={item.fileName}
              selected={playing}
            />
          </button>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-xs text-gray-200"
              title={item.fileName}
            >
              {item.fileName}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-gray-500">
              {item.isCurrent ? (
                <span className="uppercase tracking-widest text-emerald-300">
                  Current
                </span>
              ) : (
                <span>{eventTypeLabel(item.event.eventType)}</span>
              )}
              {showCardInfo ? (
                <span>
                  · {formatMasterDeliveryDate(item.event.createdAt)}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {canView ? (
              <button
                type="button"
                disabled={previewingId === item.mediaAssetId}
                onClick={() => void handleViewInPlayer(item.mediaAssetId)}
                className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-300 hover:border-[#d4af37]/40 hover:text-[#d4af37] disabled:opacity-50"
              >
                {playing ? "Playing" : "View"}
              </button>
            ) : null}
            {canDownloadItem ? (
              <button
                type="button"
                disabled={downloadPhase === "preparing"}
                onClick={() => void handleDownload()}
                className="rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
              >
                {downloadLabel}
              </button>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div
        key={item.mediaAssetId}
        className={`group overflow-hidden rounded-lg border bg-[#121217] transition-all min-w-0 ${
          playing
            ? "border-emerald-500/50"
            : item.isCurrent
              ? "border-emerald-500/25"
              : "border-white/5 hover:border-[#d4af37]/30"
        }`}
      >
        <button
          type="button"
          disabled={!canView || previewingId === item.mediaAssetId}
          onClick={() => void handleViewInPlayer(item.mediaAssetId)}
          className={`relative w-full overflow-hidden bg-[#0a0a0f] flex items-center justify-center disabled:opacity-60 ${aspectClass}`}
          title={item.fileName}
        >
          <AssetGridMedia
            thumbnailUrl={thumbnailUrl}
            playbackUrl={
              isVideo || item.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                ? playbackUrl
                : null
            }
            alt={item.fileName}
            isVideo={isVideo}
            fileName={item.fileName}
            className={objectFitClass}
          />
          {item.isCurrent ? (
            <span className="absolute left-2 top-2 z-10 rounded border border-emerald-500/40 bg-black/70 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-emerald-300">
              Current
            </span>
          ) : null}
        </button>
        <div className="p-2.5 space-y-1.5 min-w-0">
          <p
            className={`truncate text-gray-200 ${
              viewMode === "grid-sm" ? "text-[10px]" : "text-xs"
            }`}
            title={item.fileName}
          >
            {item.fileName}
          </p>
          {showCardInfo ? (
            <p className="text-[9px] text-gray-500">
              {eventTypeLabel(item.event.eventType)} ·{" "}
              {formatMasterDeliveryDate(item.event.createdAt)}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {canView ? (
              <button
                type="button"
                disabled={previewingId === item.mediaAssetId}
                onClick={() => void handleViewInPlayer(item.mediaAssetId)}
                className="rounded border border-[#d4af37]/30 bg-[#d4af37]/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#d4af37] disabled:opacity-50"
              >
                {playing ? "Playing" : "View"}
              </button>
            ) : null}
            {canDownloadItem ? (
              <button
                type="button"
                disabled={downloadPhase === "preparing"}
                onClick={() => void handleDownload()}
                className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-200 disabled:opacity-50"
              >
                Download
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="mb-4 overflow-hidden rounded border border-emerald-500/20 bg-black/30">
      <div className="border-b border-white/5 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-300/90">
          Master Delivery
        </p>
        <p className="mt-1 text-[11px] text-text-gray">
          Final delivery package for this project · view follows gallery layout
          ({viewMode === "list" ? "List" : viewMode === "grid-sm" ? "Small Grid" : "Large Grid"})
        </p>
      </div>

      <div className="px-4 py-3 space-y-3">
        {loading ? (
          <p className="text-[11px] text-text-gray/70">Loading delivery…</p>
        ) : error ? (
          <p className="text-[11px] text-red-400/90">{error}</p>
        ) : !current || access.status === "waiting" ? (
          <p className="text-[11px] text-text-gray">
            Status:{" "}
            <span className="text-sky-300/90">Waiting on Delivery</span>
          </p>
        ) : (
          <>
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-text-gray">
                Current Delivery
              </p>
              <p
                className="text-sm font-medium text-text-white truncate"
                title={fileName ?? undefined}
              >
                {fileName}
              </p>
              <p className="text-[11px] text-text-gray">
                <span
                  className={
                    access.status === "available"
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }
                >
                  {statusText}
                </span>
                {access.status === "available" &&
                access.daysRemaining != null ? (
                  <span className="text-text-gray/80">
                    {" "}
                    · {access.daysRemaining} day
                    {access.daysRemaining === 1 ? "" : "s"} remaining
                  </span>
                ) : null}
              </p>
            </div>

            <div className="grid gap-1 text-[11px] text-text-gray sm:grid-cols-2">
              <p>
                Delivered:{" "}
                <span className="text-text-white">
                  {formatMasterDeliveryDate(current.createdAt)}
                </span>
              </p>
              <p
                className="truncate"
                title={formatMasterDeliveryActor(current.actor)}
              >
                Delivered by:{" "}
                <span className="text-text-white">
                  {formatMasterDeliveryActor(current.actor)}
                </span>
              </p>

              {access.status === "available" && access.expiresAt ? (
                <>
                  <p>
                    Available Until:{" "}
                    <span className="text-text-white">
                      {formatMasterDeliveryDate(access.expiresAt)}
                    </span>
                  </p>
                  <p>
                    Days Remaining:{" "}
                    <span className="text-emerald-300 tabular-nums">
                      {access.daysRemaining}
                    </span>
                  </p>
                </>
              ) : null}

              {access.status === "expired" && access.expiredOn ? (
                <p className="sm:col-span-2">
                  Expired on:{" "}
                  <span className="text-amber-300">
                    {formatMasterDeliveryDate(access.expiredOn)}
                  </span>
                </p>
              ) : null}

              {current.sourceReviewAsset?.fileName ? (
                <p
                  className="sm:col-span-2 truncate"
                  title={current.sourceReviewAsset.fileName}
                >
                  Source Review:{" "}
                  <span className="text-text-white">
                    {current.sourceReviewAsset.fileName}
                  </span>
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {canPreviewCurrent ? (
                <button
                  type="button"
                  onClick={() =>
                    void handleViewInPlayer(current.mediaAssetId)
                  }
                  disabled={previewingId === current.mediaAssetId}
                  className="inline-flex items-center justify-center rounded border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#d4af37] transition-colors hover:bg-[#d4af37]/20 disabled:opacity-50"
                >
                  {previewingId === current.mediaAssetId
                    ? "Opening…"
                    : isPreviewActive
                      ? "Playing in Player"
                      : "View in Player"}
                </button>
              ) : null}

              {access.canDownload && active ? (
                <button
                  type="button"
                  onClick={() => void handleDownload()}
                  disabled={downloadPhase === "preparing"}
                  className="inline-flex items-center justify-center rounded border border-emerald-500/50 bg-emerald-500/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-100 transition-colors hover:bg-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {downloadLabel}
                </button>
              ) : null}
            </div>

            {access.status === "expired" ? (
              <p className="text-[11px] text-amber-400/90">
                Player preview and download unavailable — delivery access has
                ended.
              </p>
            ) : null}

            {previewError ? (
              <p className="text-[11px] text-red-400/90">{previewError}</p>
            ) : null}

            {downloadError ? (
              <p className="text-[11px] text-red-400/90">{downloadError}</p>
            ) : null}

            {galleryItems.length > 0 ? (
              <div className="border-t border-white/5 pt-3 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-text-gray">
                  Delivery assets
                </p>
                <div className={containerClass} style={gridStyle}>
                  {galleryItems.map((item) => renderGalleryItem(item))}
                </div>
              </div>
            ) : null}
          </>
        )}

        {history.length > 0 ? (
          <div className="border-t border-white/5 pt-2">
            <button
              type="button"
              onClick={() => setHistoryOpen((open) => !open)}
              className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-emerald-300 transition-colors"
            >
              Event log {historyOpen ? "▲" : "▼"} ({history.length})
            </button>
            {historyOpen ? (
              <ul className="mt-2 space-y-2">
                {history.map((event) => (
                  <li
                    key={event.id}
                    className="text-[11px] leading-snug text-text-gray"
                  >
                    <p>
                      <span className="text-text-white">
                        {eventTypeLabel(event.eventType)}
                      </span>
                      {event.mediaAsset?.fileName ? (
                        <>
                          {" — "}
                          <span
                            className="inline-block max-w-[16rem] truncate align-bottom"
                            title={event.mediaAsset.fileName}
                          >
                            {event.mediaAsset.fileName}
                          </span>
                        </>
                      ) : null}
                    </p>
                    <p className="text-[10px] text-text-gray/60">
                      {formatMasterDeliveryActor(event.actor)} ·{" "}
                      {formatMasterDeliveryTimestamp(event.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
