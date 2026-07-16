import type { Metadata } from "next";
import GuideArticle, {
  GuideNote,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Member Roles and Permissions | Client Guide | Rendorax Studio",
};

const ROWS: { role: string; caps: string }[] = [
  {
    role: "Primary Contact",
    caps: "Manage team · submit requests · respond to proposals · comment · approve / revision · download Master",
  },
  {
    role: "Reviewer",
    caps: "View · comment · request revision (no proposal approve, no Master download)",
  },
  {
    role: "Stakeholder",
    caps: "View · submit requests · comment · request revision",
  },
  {
    role: "Approver",
    caps: "View · submit requests · respond to proposals · comment · approve / revision · download Master",
  },
  {
    role: "Observer",
    caps: "View only (no comment, decisions, or downloads)",
  },
];

export default function ClientMemberRolesGuidePage() {
  return (
    <GuideArticle
      eyebrow="Client · Organization"
      title="Member roles and permissions."
      description="Membership role controls what each client user can do inside the shared Client Dashboard. Auth role remains client."
      nextHref="/guide/client/accept-invite"
      nextLabel="Accept an Invitation"
    >
      <ul className="space-y-3">
        {ROWS.map((row) => (
          <li
            key={row.role}
            className="border border-white/5 bg-[#0e0e12] px-4 py-3"
          >
            <p className="text-white text-sm mb-1">{row.role}</p>
            <p className="text-[12px] text-text-gray leading-relaxed">
              {row.caps}
            </p>
          </li>
        ))}
      </ul>
      <GuideNote>
        Capabilities are enforced on the API. UI hides actions that your role
        cannot perform.
      </GuideNote>
    </GuideArticle>
  );
}
