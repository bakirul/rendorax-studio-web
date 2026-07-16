import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Review Versions | Editor Guide | Rendorax Studio",
};

export default function EditorReviewVersionsGuidePage() {
  return (
    <GuideArticle
      eyebrow="Editor · Work / Feedback"
      title="Upload Review Versions."
      description="Clients review assets in 03_REVIEW. Keep versions Project-linked and clearly named."
      nextHref="/guide/editor/picture-lock"
      nextLabel="Picture Lock"
    >
      <GuideSteps
        steps={[
          "Select the active Project.",
          "Use Upload Review Version (or upload into 03_REVIEW).",
          "Confirm the asset is linked to the Project.",
          "Submit for review when ready; respond to Client comments with a new Review Version as needed.",
        ]}
      />
      <GuideNote>
        Review Versions are for Feedback. Master Delivery is a separate Delivery
        package under 05_MASTER_DELIVERY.
      </GuideNote>
    </GuideArticle>
  );
}
