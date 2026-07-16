import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Download Delivery | Client Guide | Rendorax Studio",
};

export default function ClientDownloadDeliveryGuidePage() {
  return (
    <GuideArticle
      eyebrow="Client · Delivery"
      title="Download Master Delivery."
      description="When Editors register Master Delivery, Clients download from the Master Delivery panel."
      nextHref="/guide/editor/tasks"
      nextLabel="Editor · Tasks"
    >
      <GuideSteps
        steps={[
          "Open your Project on /dashboard.",
          "Open the Master Delivery panel for that Project.",
          "Confirm the current active Master Delivery package.",
          "Download via the secure link. Studio records Access Granted when access is issued.",
        ]}
      />
      <GuideNote>
        Access Granted means a download URL was issued — not that your device
        finished saving the file. Expired or archived Projects block active
        download through workspace APIs.
      </GuideNote>
    </GuideArticle>
  );
}
