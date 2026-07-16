import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Review and Approve Proposal | Client Guide | Rendorax Studio",
};

export default function ClientProposalGuidePage() {
  return (
    <GuideArticle
      eyebrow="Client · Proposal"
      title="Review and approve a proposal."
      description="After Admin sends a Proposal, open your Project Request to see cost, timeline, and deliverables. Your approval marks the request Approved."
      nextHref="/guide/client/upload"
      nextLabel="Upload Assets"
    >
      <GuideSteps
        steps={[
          "Open Project Requests on /dashboard and select the request marked Quoted.",
          "Review Proposal version, estimated cost, timeline, deliverables, notes, and terms.",
          "Approve Proposal — or Request Changes / Reject with a required note.",
          "After Admin converts the request, status becomes Project Created — open the project from the request detail or Dashboard project list.",
        ]}
      />
      <GuideNote>
        Approving a proposal does not create the Agency Project by itself. Admin
        converts Approved → Project. You cannot create projects yourself.
      </GuideNote>
    </GuideArticle>
  );
}
