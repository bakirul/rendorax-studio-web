import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Archive & Restore | Admin Guide | Rendorax Studio",
};

export default function AdminArchiveRestoreGuidePage() {
  return (
    <GuideArticle
      eyebrow="Admin · Archive"
      title="Archive and Restore Projects."
      description="Archive removes a Project from active workspaces without deleting history or files."
      nextHref="/guide/faq"
      nextLabel="FAQ"
    >
      <GuideSteps
        steps={[
          "Confirm the Project should leave active operations.",
          "Use Archive on the Project in Admin HQ (with confirmation).",
          "Find it later under Archived Projects.",
          "Use Restore when the Project must become an active workspace again.",
        ]}
      />
      <GuideNote>
        After Archive: active lists and Operations Queue hide the Project; known-ID
        active APIs reject it. Assets, comments, Review Decisions, Picture Lock,
        and Master Delivery history remain preserved. Restore re-enables existing
        APIs automatically.
      </GuideNote>
    </GuideArticle>
  );
}
