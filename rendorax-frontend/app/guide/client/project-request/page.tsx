import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Submit a Project Request | Client Guide | Rendorax Studio",
};

export default function ClientProjectRequestGuidePage() {
  return (
    <GuideArticle
      eyebrow="Client · Project Request"
      title="Submit a Project Request."
      description="Before production starts, send your brief through Project Requests. Admin reviews it — this does not create an Agency Project yet."
      nextHref="/guide/client/upload"
      nextLabel="Upload Assets"
    >
      <GuideSteps
        steps={[
          "Sign in at /access and open /dashboard.",
          "Open the Project Requests section near the top of the workspace.",
          "Click New Project Request and fill title, type, brief, deliverables, deadline, and references.",
          "Submit. Status starts as Submitted.",
          "Watch status updates: Under Review, Needs Clarification (with Admin note), Approved, or Rejected.",
        ]}
      />
      <GuideNote>
        Approval does not create a project in this phase. Project conversion comes
        after Proposal / Approval in a later release. You cannot create an Agency
        Project yourself.
      </GuideNote>
    </GuideArticle>
  );
}
