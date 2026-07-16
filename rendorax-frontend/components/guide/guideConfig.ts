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
      { href: "/guide/demo", label: "Demo Workspace" },
      { href: "/guide/workflow", label: "Workflow Guide" },
      { href: "/guide/faq", label: "FAQ" },
    ],
  },
  {
    title: "Client",
    items: [
      { href: "/guide/client/project-request", label: "Submit a Project Request" },
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
      { href: "/guide/admin/clients-projects", label: "Clients & Projects" },
      { href: "/guide/admin/operations-queue", label: "Operations Queue" },
      { href: "/guide/admin/delivery-tracking", label: "Delivery Tracking" },
      { href: "/guide/admin/archive-restore", label: "Archive & Restore" },
    ],
  },
];

export const WORKFLOW_STEPS = [
  "Project Request",
  "Admin Review",
  "Approval",
  "Project",
  "Assignment",
  "Work",
  "Feedback",
  "Delivery",
  "Archive",
] as const;
