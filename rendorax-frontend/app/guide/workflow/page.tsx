import type { Metadata } from "next";
import Link from "next/link";
import GuideArticle from "@/components/guide/GuideArticle";
import { WORKFLOW_STEPS } from "@/components/guide/guideConfig";

export const metadata: Metadata = {
  title: "Workflow Guide | Guide | Rendorax Studio",
};

const STEP_DETAIL: Record<(typeof WORKFLOW_STEPS)[number], string> = {
  "Client Organization":
    "Each Primary Client has a Client Organization. Primary Contact is bootstrapped as an active member.",
  "Invite Review Team":
    "Primary Contact invites Reviewers, Stakeholders, Approvers, and Observers by email. Invitees accept at /access/invite and join the existing Client Dashboard.",
  "Project Request":
    "Authorized members submit a brief from the Dashboard. This is pre-project — no Agency Project yet.",
  Proposal:
    "Admin creates a versioned Proposal (cost, timeline, deliverables) and sends it. Request becomes Quoted; sent content is immutable.",
  "Client Approval":
    "Primary Contact or Approver approves, requests changes, or rejects the Proposal. Only Client approval sets the Request to Approved.",
  "Project Creation":
    "Admin converts an approved request into an Agency Project (Awaiting Assets). The request becomes Converted; the project appears in Admin HQ, Client Dashboard, and Operations Queue.",
  Assignment:
    "Admin assigns Editors via Tasks on the production project.",
  Production:
    "Editors upload Project assets and Review Versions (03_REVIEW).",
  Review:
    "Organization members leave timed comments and Approve or request Revision according to their membership role.",
  Delivery:
    "After Picture Lock when needed, Editors create Master Delivery. Primary Contact and Approver may download; Access Granted is recorded.",
  Archive:
    "Admin archives finished Projects. Active lists and workspace APIs exclude them; Restore brings them back.",
};

export default function WorkflowGuidePage() {
  return (
    <GuideArticle
      eyebrow="Workflow Guide"
      title="One path from Organization to Archive."
      description="Client Organization → Invite → Request → Proposal → Client Approval → Project Creation → Assignment → Production → Review → Delivery → Archive."
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
            {step === "Review" ? (
              <div className="mt-3 space-y-2">
                <p>
                  Feedback, direction, and revision activity stay connected to
                  the project workflow—not scattered across email or separate
                  tools.
                </p>
                <Link
                  href="/guide/client/review-comments"
                  className="inline-block text-sm text-gold-primary hover:text-white transition-colors"
                >
                  Learn about review and real-time collaboration →
                </Link>
              </div>
            ) : null}
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
          <Link
            href="/guide/client/invite-team"
            className="text-gold-primary hover:text-white"
          >
            Invite team →
          </Link>
          <Link
            href="/guide/client/project-request"
            className="text-gold-primary hover:text-white"
          >
            Client Request →
          </Link>
          <Link
            href="/guide/admin/convert-request"
            className="text-gold-primary hover:text-white"
          >
            Convert to Project →
          </Link>
        </div>
      </section>
    </GuideArticle>
  );
}
