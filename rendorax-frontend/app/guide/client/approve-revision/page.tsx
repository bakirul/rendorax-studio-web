import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Approve / Revision | Client Guide | Rendorax Studio",
};

export default function ClientApproveRevisionGuidePage() {
  return (
    <GuideArticle
      eyebrow="Client · Feedback"
      title="Approve or request revision."
      description="Review Decisions record your official response on a Review Version."
      nextHref="/guide/client/download-delivery"
      nextLabel="Download Delivery"
    >
      <GuideSteps
        steps={[
          "Open the Review Version under review.",
          "Use the Review Decision controls on that asset.",
          "Choose Approved when picture and notes are accepted.",
          "Choose Revision Requested when the Editor must revise; leave clear comments.",
        ]}
      />
      <GuideNote>
        Approve / Revision are Project feedback states on Review Versions. Master
        Delivery is a later Delivery stage after Work and Picture Lock as needed.
      </GuideNote>
    </GuideArticle>
  );
}
