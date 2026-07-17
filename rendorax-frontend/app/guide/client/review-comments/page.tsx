import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Review, Comments & Real-Time Collaboration | Rendorax Guide",
  description:
    "Learn how clients review versions, give timeline-based direction, collaborate across languages, and manage revisions in Rendorax Studio.",
};

const COLLABORATION_PILLARS = [
  {
    title: "Live Timeline Direction",
    body: "Give precise direction directly on the timeline instead of relying on long email threads or disconnected feedback documents.",
  },
  {
    title: "Instant Correction Loop",
    body: "Editors receive feedback and respond inside the same workflow, reducing delays between review and revision.",
  },
  {
    title: "Cross-Language Collaboration",
    body: "Text chat and written direction can be translated automatically, helping clients and editors communicate across languages while keeping feedback connected to the work.",
  },
] as const;

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

      <section className="space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-primary mb-2">
            Real-Time Collaboration
          </p>
          <h2 className="font-display text-xl text-white mb-2">
            Stay inside the edit.
          </h2>
          <p>
            Review cuts, direct editors, and resolve feedback without waiting for
            emails, meetings, or language barriers.
          </p>
        </div>
        <ul className="space-y-3">
          {COLLABORATION_PILLARS.map((pillar) => (
            <li
              key={pillar.title}
              className="border border-white/5 bg-[#121418] px-4 py-3"
            >
              <h3 className="text-white font-medium mb-1">{pillar.title}</h3>
              <p className="text-sm text-text-gray leading-relaxed">
                {pillar.body}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </GuideArticle>
  );
}
