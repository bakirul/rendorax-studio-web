import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Review & Comments | Client Guide | Rendorax Studio",
};

export default function ClientReviewCommentsGuidePage() {
  return (
    <GuideArticle
      eyebrow="Client · Feedback"
      title="Review Versions and leave comments."
      description="Feedback happens on Review Versions. Timed comments drive the revision loop."
      nextHref="/guide/client/approve-revision"
      nextLabel="Approve / Revision"
    >
      <GuideSteps
        steps={[
          "Open your Project on /dashboard.",
          "Select a Review Version (assets in 03_REVIEW).",
          "Play the video in the preview panel.",
          "Add timestamped comments in Comments. Jump markers follow your notes.",
        ]}
      />
      <GuideNote>
        Prefer commenting on the Review Version the Editor submitted — not on
        Master Delivery packages unless Admin instructs otherwise.
      </GuideNote>
    </GuideArticle>
  );
}
