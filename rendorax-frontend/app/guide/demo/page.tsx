import type { Metadata } from "next";
import Link from "next/link";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Demo Workspace | Guide | Rendorax Studio",
  description:
    "Authenticated Demo Workspace for vetted prospects — walk the Rendorax Studio delivery workflow on existing screens.",
};

const DEMO_FLOW = [
  "Client Materials",
  "Review Version",
  "Comments",
  "Revision",
  "Approval",
  "Picture Lock",
  "Master Delivery",
  "Access Granted",
] as const;

export default function GuideDemoPage() {
  return (
    <GuideArticle
      eyebrow="Demo Workspace"
      title="See the delivery workflow on the real product."
      description="Rendorax Studio is not a public sandbox. Vetted prospects sign in with private Demo Client and Demo Editor accounts and use the existing Dashboard — the same screens production teams use."
      nextHref="/guide/workflow"
      nextLabel="Workflow Guide"
    >
      <section>
        <h2 className="text-white font-display text-xl mb-3">What you will see</h2>
        <p className="mb-4">
          One seeded project titled like{" "}
          <strong className="text-white">
            [DEMO] Broadcast Delivery Walkthrough
          </strong>
          . History is pre-built so the story is coherent: materials, Review
          Versions, feedback, Picture Lock, Master Delivery, and Access Granted.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {DEMO_FLOW.map((step, index) => (
            <span key={step} className="flex items-center gap-2">
              <span className="text-white bg-white/5 border border-white/10 px-3 py-1.5">
                {step}
              </span>
              {index < DEMO_FLOW.length - 1 ? (
                <span className="text-gold-primary/60" aria-hidden>
                  →
                </span>
              ) : null}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-white font-display text-xl mb-3">Two personas</h2>
        <ul className="space-y-2 list-disc pl-5">
          <li>
            <strong className="text-white">Demo Client</strong> — open the demo
            Project, play Review Versions, leave comments, approve / request
            revision, download Master Delivery.
          </li>
          <li>
            <strong className="text-white">Demo Editor</strong> — see assigned
            Tasks, Review folder, Picture Lock and Master Delivery context used
            in the walkthrough.
          </li>
        </ul>
        <p className="mt-3 text-text-gray">
          Use two browsers (or profiles) if you want both sides in one session.
          Admin credentials are never distributed for the Demo Workspace.
        </p>
      </section>

      <GuideSteps
        steps={[
          "Receive private Demo Client / Demo Editor credentials from Rendorax (not published here).",
          "Sign in at /access.",
          "Open /dashboard and select the demo Project.",
          "Walk Review → Comments → Decisions → Delivery using the live UI.",
          "Read Guide articles when you need terminology detail.",
        ]}
      />

      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <Link
          href="/access"
          className="inline-flex justify-center text-[11px] uppercase tracking-[0.2em] bg-gold-primary hover:bg-[#b8952b] text-black px-6 py-3 font-bold transition-colors"
        >
          Sign in to Demo Workspace
        </Link>
        <Link
          href="/contact"
          className="inline-flex justify-center text-[11px] uppercase tracking-[0.2em] border border-white/15 text-white hover:border-gold-primary/50 hover:text-gold-primary px-6 py-3 transition-colors"
        >
          Request Demo Access
        </Link>
      </div>

      <GuideNote>
        Shared demo state can change between tours. Rendorax can reset the
        seeded project manually. Credentials are never shown on this page.{" "}
        <Link href="/guide/faq" className="text-gold-primary hover:text-white">
          FAQ
        </Link>{" "}
        ·{" "}
        <Link href="/guide/client/review-comments" className="text-gold-primary hover:text-white">
          Client review
        </Link>{" "}
        ·{" "}
        <Link href="/guide/editor/master-delivery" className="text-gold-primary hover:text-white">
          Master Delivery
        </Link>
      </GuideNote>
    </GuideArticle>
  );
}
