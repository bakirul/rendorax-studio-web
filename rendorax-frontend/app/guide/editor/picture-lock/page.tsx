import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Picture Lock | Editor Guide | Rendorax Studio",
};

export default function EditorPictureLockGuidePage() {
  return (
    <GuideArticle
      eyebrow="Editor · Work"
      title="Record Picture Lock."
      description="Picture Lock marks that picture is locked for the Review context before final Delivery packaging."
      nextHref="/guide/editor/master-delivery"
      nextLabel="Master Delivery"
    >
      <GuideSteps
        steps={[
          "Open the approved (or Admin-directed) Review Version.",
          "Use the Picture Lock control on that asset.",
          "Confirm lock / unlock events as directed by production.",
          "Proceed to Master Delivery when the Project is Ready for Final Delivery.",
        ]}
      />
      <GuideNote>
        Picture Lock does not remove comments or Review Decisions. History stays
        available for Ops review.
      </GuideNote>
    </GuideArticle>
  );
}
