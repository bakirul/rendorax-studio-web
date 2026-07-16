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
      description="Before production starts, send your brief through Project Requests. Admin reviews it — submitting does not create an Agency Project."
      nextHref="/guide/client/proposal"
      nextLabel="Review and Approve Proposal"
    >
      <GuideSteps
        steps={[
          "Sign in at /access and open /dashboard.",
          "Open the Project Requests section near the top of the workspace.",
          "Click New Project Request and fill title, type, brief, deliverables, deadline, and references.",
          "Submit. Status starts as Submitted.",
          "Watch status: Under Review → Quoted → Approved → Project Created (after Admin converts).",
        ]}
      />
      <GuideNote>
        You cannot create an Agency Project yourself. After you approve a
        Proposal, Admin converts the request into production.
      </GuideNote>
    </GuideArticle>
  );
}
