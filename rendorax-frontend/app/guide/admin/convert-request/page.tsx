import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Convert Request to Project | Admin Guide | Rendorax Studio",
};

export default function AdminConvertRequestGuidePage() {
  return (
    <GuideArticle
      eyebrow="Admin · Project Creation"
      title="Convert an approved request to a project."
      description="After the Client approves a Proposal, Admin creates the production Agency Project from Request Inbox. One conversion only."
      nextHref="/guide/admin/clients-projects"
      nextLabel="Clients & Projects"
    >
      <GuideSteps
        steps={[
          "Open Admin HQ → Request Inbox and select a request with status Approved.",
          "Confirm an approved Proposal exists on the request.",
          "Click Convert To Project.",
          "Status becomes Project Created. The Agency Project starts at Awaiting Assets.",
          "Open the project from Admin HQ, assign Editors via Tasks, and continue the existing production workflow.",
        ]}
      />
      <GuideNote>
        A second conversion attempt returns Already converted (409). Clients and
        Editors cannot convert requests.
      </GuideNote>
    </GuideArticle>
  );
}
