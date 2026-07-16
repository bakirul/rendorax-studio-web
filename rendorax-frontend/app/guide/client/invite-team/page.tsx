import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Invite Reviewers and Approvers | Client Guide | Rendorax Studio",
};

export default function ClientInviteTeamGuidePage() {
  return (
    <GuideArticle
      eyebrow="Client · Organization"
      title="Invite reviewers and approvers."
      description="Primary Contacts invite their own organization team into the existing Client Dashboard. No public signup and no anonymous review links."
      nextHref="/guide/client/member-roles"
      nextLabel="Member Roles and Permissions"
    >
      <GuideSteps
        steps={[
          "Sign in at /access and open /dashboard.",
          "Expand Organization Team near Project Requests.",
          "Enter email, optional display name, and role (Reviewer, Stakeholder, Approver, or Observer).",
          "Send Invite. If email delivery is not configured, copy the invite link shown and share it securely.",
          "The invitee opens /access/invite, sets a password, and joins as Auth role client.",
        ]}
      />
      <GuideNote>
        Only Primary Contact (or Admin support) can invite. You cannot invite
        Admin or Editor accounts into a client organization.
      </GuideNote>
    </GuideArticle>
  );
}
