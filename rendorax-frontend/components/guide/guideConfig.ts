export type GuideNavItem = {
  href: string;
  label: string;
};

export type GuideNavGroup = {
  title: string;
  items: GuideNavItem[];
};

export const GUIDE_NAV: GuideNavGroup[] = [
  {
    title: "Start",
    items: [
      { href: "/guide", label: "Guide Center" },
      { href: "/guide/getting-started", label: "Getting Started" },
      { href: "/guide/pilot-qa", label: "Pilot QA Runbook" },
      { href: "/guide/demo", label: "Demo Workspace" },
      { href: "/guide/workflow", label: "Workflow Guide" },
      { href: "/guide/faq", label: "FAQ" },
    ],
  },
  {
    title: "Client",
    items: [
      { href: "/guide/client/invite-team", label: "Invite Reviewers & Approvers" },
      { href: "/guide/client/member-roles", label: "Member Roles & Permissions" },
      { href: "/guide/client/accept-invite", label: "Accept an Invitation" },
      { href: "/guide/client/project-request", label: "Submit a Project Request" },
      { href: "/guide/client/proposal", label: "Review and Approve Proposal" },
      { href: "/guide/client/upload", label: "Upload Assets" },
      { href: "/guide/client/review-comments", label: "Review & Comments" },
      { href: "/guide/client/approve-revision", label: "Approve / Revision" },
      { href: "/guide/client/download-delivery", label: "Download Delivery" },
    ],
  },
  {
    title: "Editor",
    items: [
      { href: "/guide/editor/tasks", label: "Tasks" },
      { href: "/guide/editor/review-versions", label: "Review Versions" },
      { href: "/guide/editor/picture-lock", label: "Picture Lock" },
      { href: "/guide/editor/master-delivery", label: "Master Delivery" },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/guide/admin/project-requests", label: "Review Project Requests" },
      { href: "/guide/admin/proposal", label: "Create and Send Proposal" },
      { href: "/guide/admin/convert-request", label: "Convert Request to Project" },
      {
        href: "/guide/admin/organization-membership",
        label: "Organization Membership Support",
      },
      { href: "/guide/admin/clients-projects", label: "Clients & Projects" },
      { href: "/guide/admin/operations-queue", label: "Operations Queue" },
      { href: "/guide/admin/delivery-tracking", label: "Delivery Tracking" },
      { href: "/guide/admin/archive-restore", label: "Archive & Restore" },
    ],
  },
];

export const WORKFLOW_STEPS = [
  "Client Organization",
  "Invite Review Team",
  "Project Request",
  "Proposal",
  "Client Approval",
  "Project Creation",
  "Assignment",
  "Production",
  "Review",
  "Delivery",
  "Archive",
] as const;
