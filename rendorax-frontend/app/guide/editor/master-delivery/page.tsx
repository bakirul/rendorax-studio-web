import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Master Delivery | Editor Guide | Rendorax Studio",
};

export default function EditorMasterDeliveryGuidePage() {
  return (
    <GuideArticle
      eyebrow="Editor · Delivery"
      title="Create Master Delivery."
      description="Register the final package under 05_MASTER_DELIVERY so Clients can download securely."
      nextHref="/guide/admin/clients-projects"
      nextLabel="Admin · Clients & Projects"
    >
      <GuideSteps
        steps={[
          "Select an active Project.",
          "Use Upload Master Delivery (requires a selected Project).",
          "Place / link the asset under 05_MASTER_DELIVERY and register the Delivery event.",
          "Optionally link a source Review Version. Confirm Clients can see the active package.",
        ]}
      />
      <GuideNote>
        Replaced or restored Master Delivery events keep history. Expired packages
        stop Client download. Archived Projects block active Delivery APIs.
      </GuideNote>
    </GuideArticle>
  );
}
