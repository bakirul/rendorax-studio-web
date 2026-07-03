import { useEffect } from "react";
import type { MediaAssetRecord } from "@/utils/mediaAssets";
import { shouldPollAssetsForProcessing } from "@/utils/mediaUploadStatus";

interface UseMediaProcessingPollOptions {
  assets: Array<{ processingStatus?: MediaAssetRecord["processingStatus"] }>;
  enabled?: boolean;
  intervalMs?: number;
  onRefresh: () => void | Promise<void>;
}

const DEFAULT_INTERVAL_MS = 8000;

export function useMediaProcessingPoll({
  assets,
  enabled = true,
  intervalMs = DEFAULT_INTERVAL_MS,
  onRefresh,
}: UseMediaProcessingPollOptions): void {
  useEffect(() => {
    if (!enabled || !shouldPollAssetsForProcessing(assets)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void onRefresh();
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [assets, enabled, intervalMs, onRefresh]);
}
