import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Operations Queue | Admin Guide | Rendorax Studio",
};

export default function AdminOperationsQueueGuidePage() {
  return (
    <GuideArticle
      eyebrow="Admin · Operations Queue"
      title="Steer work with Operations Queue."
      description="The queue groups active Projects by operational need so Admin can jump to the right Job."
      nextHref="/guide/admin/delivery-tracking"
      nextLabel="Delivery Tracking"
    >
      <GuideSteps
        steps={[
          "Open /admin and locate Operations Queue above the Project list.",
          "Scan buckets such as overdue or waiting on Editor, Client, or Delivery.",
          "Open a queue item to jump to that Project context.",
          "Act on Phase, Tasks, Review, or Delivery as needed.",
        ]}
      />
      <GuideNote>
        Archived Projects are excluded from Operations Queue. Soft-archive is
        lifecycle — not a Phase label.
      </GuideNote>
    </GuideArticle>
  );
}
