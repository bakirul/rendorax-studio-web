"use client";

import ReviewDecisionBar, {
  type ReviewDecisionViewerRole,
} from "@/components/dashboard/ReviewDecisionBar";
import PictureLockBar from "@/components/dashboard/PictureLockBar";

type ReviewActionsStripProps = {
  mediaAssetId: string;
  viewerRole: ReviewDecisionViewerRole;
  clientCanApprove?: boolean;
  clientCanRequestRevision?: boolean;
};

export default function ReviewActionsStrip({
  mediaAssetId,
  viewerRole,
  clientCanApprove,
  clientCanRequestRevision,
}: ReviewActionsStripProps) {
  return (
    <div className="shrink-0 divide-y divide-white/5 border-y border-white/10 bg-[#0e0e14]">
      <ReviewDecisionBar
        key={`decision-${mediaAssetId}`}
        mediaAssetId={mediaAssetId}
        viewerRole={viewerRole}
        clientCanApprove={clientCanApprove}
        clientCanRequestRevision={clientCanRequestRevision}
        compact
      />
      <PictureLockBar
        key={`lock-${mediaAssetId}`}
        mediaAssetId={mediaAssetId}
        viewerRole={viewerRole}
        compact
      />
    </div>
  );
}
