"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchMediaAssets,
} from "@/utils/mediaAssets";
import {
  fetchMasterDelivery,
  type MasterDeliveryEvent,
} from "@/utils/masterDelivery";
import { fetchReviewDecisions } from "@/utils/reviewDecisions";
import {
  fetchProjectFeedbackSummaries,
  type ProjectFeedbackSummaryMap,
} from "@/utils/projectFeedbackSummary";
import {
  buildOperationsQueueItem,
  countOperationsQueueItems,
  emptyOperationsQueueBuckets,
  groupOperationsQueueItems,
  mapWithConcurrency,
  OPERATIONS_QUEUE_BUCKET_LABELS,
  OPERATIONS_QUEUE_BUCKET_ORDER,
  pickOpenFeedbackOldestAtFromSummary,
  QUEUE_FETCH_CONCURRENCY,
  rankPhraseForBucket,
  type OperationsQueueBucketId,
  type OperationsQueueBuckets,
  type OperationsQueueItem,
  type OperationsQueueProjectLike,
} from "@/utils/operationsQueue";
import {
  pickActiveReviewVersionAsset,
  type OperationalTaskLike,
  type ProjectOperationalStatusKind,
} from "@/utils/projectOperationalStatus";

type QueueTask = OperationalTaskLike & {
  projectId?: string | null;
  project?: { id?: string | null } | null;
};

interface OperationsQueueProps {
  projects: OperationsQueueProjectLike[];
  tasks: QueueTask[];
  projectsLoading?: boolean;
  tasksLoading?: boolean;
  onNavigate: (item: OperationsQueueItem) => void;
}

function tasksForProject(tasks: QueueTask[], projectId: string): QueueTask[] {
  return tasks.filter(
    (task) => task.projectId === projectId || task.project?.id === projectId,
  );
}

function statusBadgeClass(status: ProjectOperationalStatusKind): string {
  switch (status) {
    case "blocked":
      return "text-red-400/90";
    case "overdue":
      return "text-amber-400";
    case "waiting_on_editor":
      return "text-gold-primary";
    case "waiting_on_client":
    case "waiting_on_delivery":
      return "text-sky-300/90";
    case "delivered":
      return "text-emerald-400";
    default:
      return "text-text-gray";
  }
}

async function evaluateProject(
  project: OperationsQueueProjectLike,
  projectTasks: QueueTask[],
  feedbackMap: ProjectFeedbackSummaryMap,
): Promise<{ item: OperationsQueueItem | null; error: string | null }> {
  try {
    const assets = await fetchMediaAssets({ agencyProjectId: project.id });
    let deliveryCurrent: MasterDeliveryEvent | null = null;
    try {
      const deliveryPayload = await fetchMasterDelivery(project.id);
      deliveryCurrent = deliveryPayload.current ?? null;
    } catch {
      deliveryCurrent = null;
    }

    const active = pickActiveReviewVersionAsset(assets);
    let activeDecision = null;
    if (active) {
      try {
        const decisions = await fetchReviewDecisions(active.id);
        activeDecision = decisions.latest ?? null;
      } catch {
        activeDecision = null;
      }
    }

    const feedback = feedbackMap[project.id];
    const openFeedbackCount = feedback?.open ?? 0;

    const item = buildOperationsQueueItem({
      project,
      tasks: projectTasks,
      assets,
      activeDecision,
      openFeedbackCount,
      openFeedbackOldestAt: pickOpenFeedbackOldestAtFromSummary(feedback),
      masterDeliveryCurrent: deliveryCurrent,
    });

    return { item, error: null };
  } catch (error) {
    return {
      item: null,
      error:
        error instanceof Error
          ? error.message
          : `Failed to evaluate ${project.title || project.id}`,
    };
  }
}

export default function OperationsQueue({
  projects,
  tasks,
  projectsLoading = false,
  tasksLoading = false,
  onNavigate,
}: OperationsQueueProps) {
  const [loading, setLoading] = useState(false);
  const [buckets, setBuckets] = useState<OperationsQueueBuckets>(
    emptyOperationsQueueBuckets,
  );
  const [failedCount, setFailedCount] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const loadGenerationRef = useRef(0);
  const userToggledRef = useRef(false);

  useEffect(() => {
    if (projectsLoading || tasksLoading) return;

    const generation = ++loadGenerationRef.current;
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      if (projects.length === 0) {
        if (cancelled || generation !== loadGenerationRef.current) return;
        setBuckets(emptyOperationsQueueBuckets());
        setFailedCount(0);
        setLoading(false);
        return;
      }

      const projectIds = projects.map((project) => project.id);

      let feedbackMap: ProjectFeedbackSummaryMap = {};
      try {
        feedbackMap = await fetchProjectFeedbackSummaries(projectIds);
      } catch {
        feedbackMap = {};
      }

      if (cancelled || generation !== loadGenerationRef.current) return;

      const results = await mapWithConcurrency(
        projects,
        QUEUE_FETCH_CONCURRENCY,
        async (project) =>
          evaluateProject(project, tasksForProject(tasks, project.id), feedbackMap),
      );

      if (cancelled || generation !== loadGenerationRef.current) return;

      const items: OperationsQueueItem[] = [];
      let failures = 0;
      for (const result of results) {
        if (result.error) failures += 1;
        if (result.item) items.push(result.item);
      }

      const nextBuckets = groupOperationsQueueItems(items);
      setBuckets(nextBuckets);
      setFailedCount(failures);

      if (!userToggledRef.current) {
        setExpanded(countOperationsQueueItems(nextBuckets) > 0);
      }

      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [projects, tasks, projectsLoading, tasksLoading]);

  const total = countOperationsQueueItems(buckets);
  const bootstrapLoading = projectsLoading || tasksLoading || loading;
  const showEmptyCompact = !bootstrapLoading && total === 0;

  return (
    <section
      id="admin-operations-queue"
      className="bg-bg-panel border border-white/5 p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm uppercase tracking-widest text-gold-primary">
            Operations Queue
          </h3>
          <p className="mt-1 text-[11px] text-text-gray">
            {bootstrapLoading
              ? "Evaluating studio projects…"
              : total === 0
                ? "No projects need attention"
                : `${total} project${total === 1 ? "" : "s"} need attention`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            userToggledRef.current = true;
            setExpanded((prev) => !prev);
          }}
          className="shrink-0 text-[10px] uppercase tracking-widest px-3 py-1.5 border border-white/10 text-text-gray hover:text-white hover:border-white/30 transition-colors"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {failedCount > 0 ? (
        <p className="mb-3 text-[11px] text-amber-400/90">
          {failedCount} project{failedCount === 1 ? "" : "s"} could not be
          evaluated
        </p>
      ) : null}

      {!expanded ? (
        showEmptyCompact ? (
          <p className="text-[11px] text-text-gray/70 italic">
            Queue is clear.
          </p>
        ) : (
          <p className="text-[11px] text-text-gray">
            {bootstrapLoading
              ? "Loading…"
              : `${total} actionable project${total === 1 ? "" : "s"} — expand to review`}
          </p>
        )
      ) : bootstrapLoading ? (
        <div className="space-y-2 py-2" aria-busy="true">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="h-14 border border-white/5 bg-black/20 animate-pulse"
            />
          ))}
        </div>
      ) : showEmptyCompact ? (
        <p className="text-[11px] text-text-gray/70 italic py-2">
          No overdue, blocked, waiting, or recently delivered projects.
        </p>
      ) : (
        <div className="space-y-5">
          {OPERATIONS_QUEUE_BUCKET_ORDER.map((bucketId) => (
            <QueueBucket
              key={bucketId}
              bucketId={bucketId}
              items={buckets[bucketId]}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function QueueBucket({
  bucketId,
  items,
  onNavigate,
}: {
  bucketId: OperationsQueueBucketId;
  items: OperationsQueueItem[];
  onNavigate: (item: OperationsQueueItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-text-gray mb-2">
        {OPERATIONS_QUEUE_BUCKET_LABELS[bucketId]}{" "}
        <span className="text-text-white/80">({items.length})</span>
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.projectId}>
            <button
              type="button"
              onClick={() => onNavigate(item)}
              className="w-full text-left border border-white/5 bg-bg-body hover:border-gold-primary/30 transition-colors p-3"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
                <span
                  className="text-sm font-medium text-text-white truncate max-w-[min(100%,16rem)]"
                  title={item.clientLabel}
                >
                  {item.clientLabel}
                </span>
                <span className="text-text-gray/50">·</span>
                <span
                  className="text-sm text-gold-primary truncate max-w-[min(100%,20rem)]"
                  title={item.projectTitle}
                >
                  {item.projectTitle}
                </span>
              </div>
              <p
                className={`mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${statusBadgeClass(item.status)}`}
              >
                {item.statusLabel}
              </p>
              <p
                className="mt-1 text-[11px] text-text-gray truncate"
                title={item.reason}
              >
                {item.reason}
              </p>
              <p
                className="mt-0.5 text-[10px] text-text-gray/80 truncate"
                title={item.assignedTeamLabel}
              >
                {item.assignedTeamLabel}
              </p>
              {item.warnings.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.warnings.map((warning) => (
                    <span
                      key={warning.label}
                      className="inline-flex items-center gap-1 rounded border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-amber-300/95"
                      title={warning.label}
                    >
                      <span aria-hidden="true">⚠</span>
                      {warning.label}
                    </span>
                  ))}
                </div>
              ) : null}
              {rankPhraseForBucket(item.bucket, item.rankAt) ? (
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-text-gray/70">
                  {rankPhraseForBucket(item.bucket, item.rankAt)}
                </p>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
