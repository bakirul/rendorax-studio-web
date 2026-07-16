import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Review Project Requests | Admin Guide | Rendorax Studio",
};

export default function AdminProjectRequestsGuidePage() {
  return (
    <GuideArticle
      eyebrow="Admin · Request Inbox"
      title="Review Project Requests."
      description="Request Inbox is the pre-project intake layer. Review briefs, ask for clarification, approve or reject — without creating Agency Projects yet."
      nextHref="/guide/admin/clients-projects"
      nextLabel="Clients & Projects"
    >
      <GuideSteps
        steps={[
          "Open /admin and find Request Inbox (below Operations Queue).",
          "Open a request to read organization, submitter, brief, deliverables, and deadline.",
          "Start Review, Request Clarification (note required), Approve, or Reject (note required).",
          "Approved requests wait for Proposal / conversion in the next phase — no Agency Project is created here.",
        ]}
      />
      <GuideNote>
        Editors cannot access Project Requests in Phase 1. Existing Create Project
        and production workflow remain unchanged.
      </GuideNote>
    </GuideArticle>
  );
}
