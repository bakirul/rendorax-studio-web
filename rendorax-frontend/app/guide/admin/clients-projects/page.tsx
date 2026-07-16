import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Clients & Projects | Admin Guide | Rendorax Studio",
};

export default function AdminClientsProjectsGuidePage() {
  return (
    <GuideArticle
      eyebrow="Admin · Client / Project"
      title="Create Clients and Projects."
      description="Admin HQ provisions who can work and which Agency Project they belong to."
      nextHref="/guide/admin/operations-queue"
      nextLabel="Operations Queue"
    >
      <GuideSteps
        steps={[
          "Sign in as Admin and open /admin.",
          "Create a Client user when needed.",
          "Create an Agency Project with title, client, ownership, and brief fields.",
          "Assign Editors by creating Tasks on that Project.",
          "Set Project Phase as production progresses.",
        ]}
      />
      <GuideNote>
        Clients are onboarded manually. Studio is not a public self-serve SaaS
        signup product.
      </GuideNote>
    </GuideArticle>
  );
}
