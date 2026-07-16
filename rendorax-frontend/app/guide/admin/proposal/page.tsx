import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Create and Send Proposal | Admin Guide | Rendorax Studio",
};

export default function AdminProposalGuidePage() {
  return (
    <GuideArticle
      eyebrow="Admin · Proposal"
      title="Create and send a proposal."
      description="Proposals sit on Project Requests. Send a quote to the Client; their approval becomes the source of truth for request approval."
      nextHref="/guide/admin/convert-request"
      nextLabel="Convert Request to Project"
    >
      <GuideSteps
        steps={[
          "Open Request Inbox and select a request under review.",
          "Create Proposal with cost, timeline, deliverables, notes, and terms.",
          "Send Proposal — content locks and request status becomes Quoted.",
          "If the Client requests changes, create a revision (V2+) and send again.",
          "After Client approval, use Convert To Project to create the Agency Project.",
        ]}
      />
      <GuideNote>
        Sent proposals are immutable; revisions create a new version. Do not use
        a direct Approve on the request — Client proposal approval sets Approved.
      </GuideNote>
    </GuideArticle>
  );
}
