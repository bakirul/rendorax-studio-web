import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Delivery Tracking | Admin Guide | Rendorax Studio",
};

export default function AdminDeliveryTrackingGuidePage() {
  return (
    <GuideArticle
      eyebrow="Admin · Delivery"
      title="Track Master Delivery and Access Granted."
      description="Admin sees Delivery history and download access summaries on the Project."
      nextHref="/guide/admin/archive-restore"
      nextLabel="Archive & Restore"
    >
      <GuideSteps
        steps={[
          "Select the Client and Project in Admin HQ.",
          "Review Project workflow / Delivery summary for Master Delivery events.",
          "Check Access Granted stats to see when download URLs were issued.",
          "Use Admin Review Viewer when you need to inspect a Review Version and comments.",
        ]}
      />
      <GuideNote>
        Access Granted is issuance of secure download access — not confirmation
        that the Client finished downloading.
      </GuideNote>
    </GuideArticle>
  );
}
