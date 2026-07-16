import type { Metadata } from "next";
import Link from "next/link";
import GuideArticle from "@/components/guide/GuideArticle";
import { WORKFLOW_STEPS } from "@/components/guide/guideConfig";

export const metadata: Metadata = {
  title: "Workflow Guide | Guide | Rendorax Studio",
};

const STEP_DETAIL: Record<(typeof WORKFLOW_STEPS)[number], string> = {
  "Project Request":
    "Authenticated Clients submit a brief (title, type, deliverables, deadline, references) from the Dashboard. This is pre-project — no Agency Project is created yet.",
  "Admin Review":
    "Admin opens Request Inbox, reviews the brief, starts review, or asks for clarification with a note.",
  Approval:
    "Admin approves or rejects the request. Proposal / Client approval and conversion to Agency Project come in later phases.",
  Project:
    "Admin creates an Agency Project (today manually; later from an approved request), sets brief fields, phase, client, and owners.",
  Assignment: "Admin assigns Editors via Tasks on the Project.",
  Work: "Editors upload and organize Project assets and Review Versions (03_REVIEW).",
  Feedback:
    "Clients leave timed comments and Approve or request Revision on Review Versions.",
  Delivery:
    "After Picture Lock when needed, Editors create Master Delivery (05_MASTER_DELIVERY). Clients download; Access Granted is recorded.",
  Archive:
    "Admin archives finished Projects. Active lists and workspace APIs exclude them; Restore brings them back.",
};

export default function WorkflowGuidePage() {
  return (
    <GuideArticle
      eyebrow="Workflow Guide"
      title="One path from Request to Archive."
      description="Intake starts with Project Request; production still runs on Agency Project → Assignment → Work → Feedback → Delivery → Archive."
      nextHref="/guide/faq"
      nextLabel="FAQ"
    >
      <ol className="space-y-4">
        {WORKFLOW_STEPS.map((step, index) => (
          <li
            key={step}
            className="border border-white/5 bg-[#0e0e12] px-5 py-4"
          >
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-mono text-[10px] text-gold-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="font-display text-xl text-white">{step}</h2>
            </div>
            <p>{STEP_DETAIL[step]}</p>
            {index < WORKFLOW_STEPS.length - 1 ? (
              <p className="mt-3 text-gold-primary/70 text-xs uppercase tracking-widest">
                ↓
              </p>
            ) : null}
          </li>
        ))}
      </ol>

      <section>
        <h2 className="text-white font-display text-xl mb-3">Continue by role</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/guide/demo" className="text-gold-primary hover:text-white">
            Try Demo Workspace →
          </Link>
          <Link
            href="/guide/client/project-request"
            className="text-gold-primary hover:text-white"
          >
            Client Guide →
          </Link>
          <Link href="/guide/editor/tasks" className="text-gold-primary hover:text-white">
            Editor Guide →
          </Link>
          <Link
            href="/guide/admin/project-requests"
            className="text-gold-primary hover:text-white"
          >
            Admin Guide →
          </Link>
        </div>
      </section>
    </GuideArticle>
  );
}
