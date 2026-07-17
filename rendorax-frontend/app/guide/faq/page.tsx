import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import GuideArticle, { GuideNote } from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "FAQ | Guide | Rendorax Studio",
};

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: "What is Real-Time Collaboration?",
    a: (
      <>
        Rendorax keeps review, feedback, direction, and revision activity
        connected to the timeline and project workflow instead of spreading
        communication across email, messaging apps, and separate review tools.
        Written text chat and direction can be translated automatically.
        Automatic translation of video calls, spoken language, or voice is not
        yet verified. See{" "}
        <Link
          href="/guide/client/review-comments"
          className="text-gold-primary hover:text-white"
        >
          Review &amp; Comments
        </Link>{" "}
        for how clients leave timeline-based feedback.
      </>
    ),
  },
  {
    q: "What is a Review Version?",
    a: (
      <>
        A Review Version is a Project-linked video (or related asset) placed in the{" "}
        <strong className="text-white">03_REVIEW</strong> folder for Client
        feedback. Clients comment and decide (approve / revision) on that
        version — not on the final Master Delivery package.
      </>
    ),
  },
  {
    q: "What is Picture Lock?",
    a: (
      <>
        Picture Lock records that picture edit is locked for that Review
        context. Editors/Admins set it from the Picture Lock control on a Review
        Version. It is an operational checkpoint before Master Delivery — it
        does not delete history or files.
      </>
    ),
  },
  {
    q: "What is Master Delivery?",
    a: (
      <>
        Master Delivery is the final deliverable registered under{" "}
        <strong className="text-white">05_MASTER_DELIVERY</strong>. Editors/Admins
        upload and register events (delivered, replaced, restored, expired).
        Clients use the Master Delivery panel to access the current active
        package.
      </>
    ),
  },
  {
    q: "What is Access Granted?",
    a: (
      <>
        Access Granted means Studio issued a secure download URL for the current
        Master Delivery. It is an audit event for access being granted — not
        proof that the full download finished on the Client machine.
      </>
    ),
  },
  {
    q: "What is Operations Queue?",
    a: (
      <>
        Operations Queue is the Admin HQ list that groups active Projects by
        operational need (for example overdue, waiting on Editor/Client/Delivery,
        blocked, recently delivered). Archived Projects are excluded.
      </>
    ),
  },
  {
    q: "What happens when a project is archived?",
    a: (
      <>
        Admin Archive soft-archives the Project (<code className="text-gold-primary/90">archivedAt</code>
        ). It leaves active Project lists, task feeds, and Operations Queue. Active
        workspace APIs reject known IDs with a clear archived message. Assets,
        comments, Review Decisions, Picture Lock, and Master Delivery history stay
        preserved. Admin can Restore to make it an active workspace again.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <GuideArticle
      eyebrow="FAQ"
      title="Studio terms, answered."
      description="Short answers using the same names you see in Dashboard and Admin HQ."
      nextHref="/guide"
      nextLabel="Guide Center"
    >
      <div className="space-y-6">
        {FAQS.map((item) => (
          <section
            key={item.q}
            className="border border-white/5 bg-[#0e0e12] px-5 py-4"
          >
            <h2 className="text-white font-display text-lg mb-2">{item.q}</h2>
            <p className="text-text-gray leading-relaxed">{item.a}</p>
          </section>
        ))}
      </div>

      <GuideNote>
        Still stuck? Start from{" "}
        <Link href="/guide/workflow" className="text-gold-primary hover:text-white">
          Workflow Guide
        </Link>{" "}
        or sign in at{" "}
        <Link href="/access" className="text-gold-primary hover:text-white">
          /access
        </Link>
        .
      </GuideNote>
    </GuideArticle>
  );
}
