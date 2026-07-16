import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Support Client Organization Membership | Admin Guide | Rendorax Studio",
};

export default function AdminOrgMembershipGuidePage() {
  return (
    <GuideArticle
      eyebrow="Admin · Support"
      title="Support client organization membership."
      description="From Request detail, Admin can view Primary Contact and Approvers, invite members, resend or revoke invites, and remove members when the client needs help."
      nextHref="/guide/admin/project-requests"
      nextLabel="Review Project Requests"
    >
      <GuideSteps
        steps={[
          "Open Admin HQ → Request Inbox and select a request.",
          "Expand Organization Team under the request detail.",
          "Invite, resend, revoke, change role, or remove as needed.",
          "Share the copyable invite link if email delivery is not configured.",
        ]}
      />
      <GuideNote>
        Do not change Primary Contact through this UI. Clients still cannot create
        editors or Agency Projects.
      </GuideNote>
    </GuideArticle>
  );
}
