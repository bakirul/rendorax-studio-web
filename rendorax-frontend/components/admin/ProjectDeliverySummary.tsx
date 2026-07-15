"use client";

import DeliveryAssetThumbnail from "@/components/dashboard/DeliveryAssetThumbnail";
import type { MediaAssetRecord } from "@/utils/mediaAssets";
import {
  formatMasterDeliveryActor,
  formatMasterDeliveryTimestamp,
  getMasterDeliveryStatusLabel,
  hasActiveMasterDelivery,
  type MasterDeliveryEvent,
} from "@/utils/masterDelivery";

interface ProjectDeliverySummaryProps {
  current: MasterDeliveryEvent | null;
  historyCount: number;
  /** Full MediaAsset for the current delivery (from project assets). */
  currentAsset?: MediaAssetRecord | null;
  loading?: boolean;
  error?: string | null;
  onPreviewCurrent?: (asset: MediaAssetRecord) => void;
}

export default function ProjectDeliverySummary({
  current,
  historyCount,
  currentAsset = null,
  loading = false,
  error = null,
  onPreviewCurrent,
}: ProjectDeliverySummaryProps) {
  const active = hasActiveMasterDelivery(current);
  const statusLabel = !current
    ? "Waiting on Delivery"
    : getMasterDeliveryStatusLabel(current);

  const fileName =
    currentAsset?.fileName?.trim() ||
    current?.mediaAsset?.fileName?.trim() ||
    current?.mediaAssetId ||
    null;

  const canPreview = Boolean(currentAsset && onPreviewCurrent);

  const openPreview = () => {
    if (!currentAsset || !onPreviewCurrent) return;
    onPreviewCurrent(currentAsset);
  };

  return (
    <div className="border-t border-white/5 px-4 py-2.5 bg-black/10">
      <p className="text-[10px] uppercase tracking-widest text-text-gray mb-1.5">
        Delivery Status
      </p>

      {loading ? (
        <p className="text-[11px] text-text-gray/70">Loading delivery…</p>
      ) : error ? (
        <p className="text-[11px] text-red-400/90">{error}</p>
      ) : !current ? (
        <p className="text-[11px] text-text-gray">
          Status:{" "}
          <span className="text-sky-300/90">Waiting on Delivery</span>
        </p>
      ) : (
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {canPreview ? (
              <button
                type="button"
                onClick={openPreview}
                className="shrink-0 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-gold-primary/50"
                title="View current delivery"
              >
                <DeliveryAssetThumbnail
                  asset={currentAsset}
                  fileName={fileName}
                />
              </button>
            ) : (
              <DeliveryAssetThumbnail
                asset={currentAsset}
                fileName={fileName}
              />
            )}

            <div className="min-w-0 flex-1">
              {canPreview ? (
                <button
                  type="button"
                  onClick={openPreview}
                  className="block w-full text-left min-w-0"
                  title={fileName ?? undefined}
                >
                  <p className="text-[11px] text-text-white truncate hover:text-gold-primary transition-colors">
                    {fileName}
                  </p>
                </button>
              ) : (
                <p
                  className="text-[11px] text-text-white truncate"
                  title={fileName ?? undefined}
                >
                  {fileName}
                </p>
              )}
              <p className="mt-0.5 text-[10px] text-text-gray truncate">
                <span
                  className={
                    statusLabel === "Expired"
                      ? "text-amber-400"
                      : active
                        ? "text-emerald-400"
                        : "text-text-white"
                  }
                >
                  {statusLabel}
                </span>
                {" · "}
                {formatMasterDeliveryActor(current.actor)}
                {" · "}
                {formatMasterDeliveryTimestamp(current.createdAt)}
              </p>
            </div>

            {canPreview ? (
              <button
                type="button"
                onClick={openPreview}
                className="shrink-0 rounded border border-gold-primary/30 bg-gold-primary/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-widest text-gold-primary hover:bg-gold-primary/20 transition-colors"
              >
                View
              </button>
            ) : null}
          </div>

          <p className="text-[11px] text-text-gray">
            History:{" "}
            <span className="text-text-white tabular-nums">
              {historyCount} deliver{historyCount === 1 ? "y" : "ies"}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
