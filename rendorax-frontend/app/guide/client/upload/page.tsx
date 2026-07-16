import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Upload Assets | Client Guide | Rendorax Studio",
};

export default function ClientUploadGuidePage() {
  return (
    <GuideArticle
      eyebrow="Client · Upload"
      title="Upload assets to your Project."
      description="Clients upload into the Vault for the selected Agency Project so Editors can begin Work."
      nextHref="/guide/client/review-comments"
      nextLabel="Review & Comments"
    >
      <GuideSteps
        steps={[
          "Sign in at /access and open /dashboard.",
          "Select your active Project in the workspace.",
          "Use Upload Asset (or the upload controls in the header) to add files.",
          "Confirm the assets appear under Project assets for that Project.",
        ]}
      />
      <GuideNote>
        Archived Projects cannot be used as an active workspace. If upload fails
        with an archived message, contact Admin to Restore the Project.
      </GuideNote>
    </GuideArticle>
  );
}
