import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Accept an Invitation | Client Guide | Rendorax Studio",
};

export default function ClientAcceptInviteGuidePage() {
  return (
    <GuideArticle
      eyebrow="Client · Organization"
      title="Accept an invitation."
      description="Use the secure invite link from your Primary Contact. Set your password once, then sign in to the Client Dashboard."
      nextHref="/guide/client/project-request"
      nextLabel="Submit a Project Request"
    >
      <GuideSteps
        steps={[
          "Open the invite URL (/access/invite?token=…).",
          "Confirm organization name, your email, and assigned role.",
          "Enter display name and a strong password (confirm it).",
          "Accept. Your account is created as Auth role client (or linked if you already have a matching client account).",
          "Sign in at /access — you land on /dashboard with your organization projects and requests.",
        ]}
      />
      <GuideNote>
        Expired, revoked, or already-accepted invites cannot be reused. Ask your
        Primary Contact to resend if needed.
      </GuideNote>
    </GuideArticle>
  );
}
