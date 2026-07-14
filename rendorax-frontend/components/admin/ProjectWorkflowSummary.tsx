"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  fetchMediaAssets,
  type MediaAssetRecord,
} from "@/utils/mediaAssets";
import {
  fetchReviewDecisions,
  type ReviewDecision,
} from "@/utils/reviewDecisions";
import {
  fetchPictureLock,
  type PictureLockEvent,
} from "@/utils/pictureLock";
import {
  countProjectWorkflowAssets,
  formatWorkflowActivityDate,
  getProjectPictureLockLabel,
  getProjectReviewStatusLabel,
  isProjectReviewVersionFolder,
  pickLatestWorkflowActivity,
  resolveWorkflowActorLabel,
  type ProjectWorkflowCounts,
  type ProjectWorkflowLockStatusLabel,
  type ProjectWorkflowReviewStatusLabel,
} from "@/utils/projectWorkflowSummary";
import {
  buildPictureLockActivityEvents,
  buildReviewDecisionActivityEvents,
  buildUploadActivityEvents,
  getProjectActivityLabel,
  mergeProjectActivityEvents,
  type ProjectActivityEvent,
} from "@/utils/projectActivityFeed";
import {
  resolveAssignedTeamSummary,
  resolveProjectOperationalStatus,
  type OperationalTaskLike,
} from "@/utils/projectOperationalStatus";
import ProjectOperationalStatus from "@/components/admin/ProjectOperationalStatus";

type AgencyUserLookup = {
  id: string;
  email?: string;
  displayName?: string | null;
};

interface ProjectWorkflowSummaryProps {
  projectId: string;
  clientId?: string | null;
  agencyUsers: AgencyUserLookup[];
  tasks?: OperationalTaskLike[];
  openFeedbackCount?: number;
  /** Rendered between the status strip and Recent Activity (e.g. Feedback). */
  children?: ReactNode;
}

type SummaryState = {
  counts: ProjectWorkflowCounts;
  reviewStatus: ProjectWorkflowReviewStatusLabel;
  pictureLock: ProjectWorkflowLockStatusLabel;
  lastActivity: { actorLabel: string; at: string } | null;
  recentActivity: ProjectActivityEvent[];
  assets: MediaAssetRecord[];
  latestDecisionByAssetId: Record<string, ReviewDecision | null>;
};

const EMPTY_COUNTS: ProjectWorkflowCounts = {
  clientMaterials: 0,
  workingFiles: 0,
  reviewVersions: 0,
};

const EMPTY_SUMMARY: SummaryState = {
  counts: EMPTY_COUNTS,
  reviewStatus: "Pending Review",
  pictureLock: "Unlocked",
  lastActivity: null,
  recentActivity: [],
  assets: [],
  latestDecisionByAssetId: {},
};

const RECENT_ACTIVITY_LIMIT = 8;
const ACTIVITY_PREVIEW_COUNT = 3;

function reviewStatusClass(status: ProjectWorkflowReviewStatusLabel): string {
  if (status === "Approved") return "text-emerald-400";
  if (status === "Revision Requested") return "text-amber-400";
  if (status === "Submitted For Review") return "text-gold-primary";
  return "text-text-white";
}

function pictureLockClass(status: ProjectWorkflowLockStatusLabel): string {
  if (status === "Locked") return "text-amber-400";
  return "text-text-white";
}

export default function ProjectWorkflowSummary({
  projectId,
  clientId,
  agencyUsers,
  tasks = [],
  openFeedbackCount = 0,
  children,
}: ProjectWorkflowSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryState>(EMPTY_SUMMARY);
  const [activityExpanded, setActivityExpanded] = useState(false);

  const loadGenerationRef = useRef(0);

  useEffect(() => {
    const generation = ++loadGenerationRef.current;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const assets = await fetchMediaAssets({ agencyProjectId: projectId });
        if (cancelled || generation !== loadGenerationRef.current) return;

        const counts = countProjectWorkflowAssets(assets, clientId);
        const reviewAssets = assets.filter((asset) =>
          isProjectReviewVersionFolder(asset.folder),
        );
        const assetsById = new Map(
          assets.map((asset) => [asset.id, asset] as const),
        );

        const [decisionResults, lockResults] = await Promise.all([
          Promise.all(
            reviewAssets.map(async (asset) => {
              try {
                return await fetchReviewDecisions(asset.id);
              } catch {
                return null;
              }
            }),
          ),
          Promise.all(
            reviewAssets.map(async (asset) => {
              try {
                return await fetchPictureLock(asset.id);
              } catch {
                return null;
              }
            }),
          ),
        ]);

        if (cancelled || generation !== loadGenerationRef.current) return;

        const allDecisions: ReviewDecision[] = [];
        for (const result of decisionResults) {
          if (!result?.history?.length) continue;
          allDecisions.push(...result.history);
        }

        const allLockEvents: PictureLockEvent[] = [];
        for (const result of lockResults) {
          if (!result?.history?.length) continue;
          allLockEvents.push(...result.history);
        }

        const latestDecisionByAssetId: Record<string, ReviewDecision | null> =
          {};
        reviewAssets.forEach((asset, index) => {
          latestDecisionByAssetId[asset.id] =
            decisionResults[index]?.latest ?? null;
        });

        const latestDecisions = Object.values(latestDecisionByAssetId).filter(
          (decision): decision is ReviewDecision => Boolean(decision),
        );

        const latestLocks = lockResults
          .map((result) => result?.latest ?? null)
          .filter((event): event is PictureLockEvent => Boolean(event));

        const newestDecision = latestDecisions.reduce<ReviewDecision | null>(
          (best, decision) => {
            if (!best || decision.createdAt > best.createdAt) return decision;
            return best;
          },
          null,
        );

        const newestLock = latestLocks.reduce<PictureLockEvent | null>(
          (best, event) => {
            if (!best || event.createdAt > best.createdAt) return event;
            return best;
          },
          null,
        );

        const usersById = new Map(
          agencyUsers.map((user) => [user.id, user] as const),
        );

        const assetActivities = assets.map((asset: MediaAssetRecord) => {
          const uploader = asset.userId
            ? usersById.get(asset.userId)
            : undefined;
          return {
            at: asset.createdAt,
            actorLabel: resolveWorkflowActorLabel(uploader, "Uploader"),
          };
        });

        const decisionActivities = allDecisions.map((decision) => ({
          at: decision.createdAt,
          actorLabel: resolveWorkflowActorLabel(decision.actor),
        }));

        const lockActivities = allLockEvents.map((event) => ({
          at: event.createdAt,
          actorLabel: resolveWorkflowActorLabel(event.actor),
        }));

        const lastActivity = pickLatestWorkflowActivity([
          ...assetActivities,
          ...decisionActivities,
          ...lockActivities,
        ]);

        const recentActivity = mergeProjectActivityEvents(
          [
            buildUploadActivityEvents(assets, clientId, agencyUsers),
            buildReviewDecisionActivityEvents(allDecisions, assetsById),
            buildPictureLockActivityEvents(allLockEvents, assetsById),
          ],
          RECENT_ACTIVITY_LIMIT,
        );

        setSummary({
          counts,
          reviewStatus: getProjectReviewStatusLabel(newestDecision),
          pictureLock: getProjectPictureLockLabel(newestLock),
          lastActivity,
          recentActivity,
          assets,
          latestDecisionByAssetId,
        });
      } catch (loadError) {
        if (cancelled || generation !== loadGenerationRef.current) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load workflow summary",
        );
        setSummary(EMPTY_SUMMARY);
      } finally {
        if (!cancelled && generation === loadGenerationRef.current) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [agencyUsers, clientId, projectId]);

  useEffect(() => {
    setActivityExpanded(false);
  }, [projectId]);

  const operationalStatus = (() => {
    if (loading) return null;
    const latestDecisionByAssetId = new Map(
      Object.entries(summary.latestDecisionByAssetId),
    );
    return resolveProjectOperationalStatus({
      clientId,
      tasks,
      assets: summary.assets,
      latestDecisionByAssetId,
      openFeedbackCount,
    });
  })();

  const assignment = resolveAssignedTeamSummary(tasks);

  const visibleActivity = activityExpanded
    ? summary.recentActivity
    : summary.recentActivity.slice(0, ACTIVITY_PREVIEW_COUNT);

  return (
    <>
      <ProjectOperationalStatus
        result={operationalStatus}
        assignment={assignment}
        loading={loading}
      />

      <div className="border-t border-white/5 px-4 py-2.5 bg-black/5">
        {loading ? (
          <p className="text-[11px] text-text-gray/70">Loading workflow…</p>
        ) : error ? (
          <p className="text-[11px] text-red-400">{error}</p>
        ) : (
          <div className="flex flex-col gap-1.5 text-[11px]">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-text-gray">
              <span>
                Client Materials{" "}
                <span className="tabular-nums text-text-white font-medium">
                  {summary.counts.clientMaterials}
                </span>
              </span>
              <span className="text-white/15 hidden sm:inline" aria-hidden>
                ·
              </span>
              <span>
                Working Files{" "}
                <span className="tabular-nums text-text-white font-medium">
                  {summary.counts.workingFiles}
                </span>
              </span>
              <span className="text-white/15 hidden sm:inline" aria-hidden>
                ·
              </span>
              <span>
                Review Versions{" "}
                <span className="tabular-nums text-text-white font-medium">
                  {summary.counts.reviewVersions}
                </span>
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-text-gray">
              <span>
                Review{" "}
                <span className={reviewStatusClass(summary.reviewStatus)}>
                  {summary.reviewStatus}
                </span>
              </span>
              <span className="text-white/15 hidden sm:inline" aria-hidden>
                ·
              </span>
              <span>
                Picture Lock{" "}
                <span className={pictureLockClass(summary.pictureLock)}>
                  {summary.pictureLock}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {children}

      <div className="border-t border-white/5 px-4 py-2.5 bg-black/5">
        <p className="text-[10px] uppercase tracking-widest text-text-gray mb-2">
          Recent Activity
        </p>
        {loading ? (
          <p className="text-[11px] text-text-gray/70">Loading…</p>
        ) : error ? null : summary.recentActivity.length === 0 ? (
          <p className="text-[11px] text-text-gray/60">No recent activity</p>
        ) : (
          <div className="space-y-2">
            <ul className="space-y-2">
              {visibleActivity.map((event) => (
                <li key={event.id} className="leading-snug text-[11px]">
                  <p className="text-text-white min-w-0">
                    <span className="text-gold-primary/90">
                      {event.actorLabel}
                    </span>{" "}
                    {getProjectActivityLabel(event.type).toLowerCase()}
                    {event.assetLabel ? (
                      <>
                        {" — "}
                        <span
                          className="text-text-gray inline-block max-w-[14rem] align-bottom truncate"
                          title={event.assetLabel}
                        >
                          {event.assetLabel}
                        </span>
                      </>
                    ) : null}
                  </p>
                  {event.note ? (
                    <p
                      className="text-text-gray/80 truncate"
                      title={event.note}
                    >
                      “{event.note}”
                    </p>
                  ) : null}
                  <p className="text-[10px] text-text-gray/60">
                    {formatWorkflowActivityDate(event.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
            {summary.recentActivity.length > ACTIVITY_PREVIEW_COUNT ? (
              <button
                type="button"
                onClick={() => setActivityExpanded((v) => !v)}
                className="text-[9px] uppercase tracking-widest text-zinc-500 hover:text-gold-primary transition-colors"
              >
                {activityExpanded
                  ? "Show less activity"
                  : `View all activity (${summary.recentActivity.length})`}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
