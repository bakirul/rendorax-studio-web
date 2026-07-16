import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Tasks | Editor Guide | Rendorax Studio",
};

export default function EditorTasksGuidePage() {
  return (
    <GuideArticle
      eyebrow="Editor · Assignment"
      title="Receive and advance Tasks."
      description="Assignments appear as Tasks on Agency Projects. That is how Work is scoped."
      nextHref="/guide/editor/review-versions"
      nextLabel="Review Versions"
    >
      <GuideSteps
        steps={[
          "Sign in and open /dashboard.",
          "Review assigned Tasks and their Projects.",
          "Select the Project you need to work on.",
          "Update Task status as Work progresses (todo → in progress → in review → done, per Studio rules).",
        ]}
      />
      <GuideNote>
        Tasks on archived Projects are hidden from active feeds. You cannot treat
        an archived Project as an active workspace.
      </GuideNote>
    </GuideArticle>
  );
}
