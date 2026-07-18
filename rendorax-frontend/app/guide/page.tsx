import type { Metadata } from "next";
import Link from "next/link";
import { GUIDE_NAV, WORKFLOW_STEPS } from "@/components/guide/guideConfig";

export const metadata: Metadata = {
  title: "Guide Center | Rendorax Studio",
  description:
    "Learn how Clients, Editors, and Admins use Rendorax Studio from Project through Delivery and Archive.",
  alternates: {
    canonical: "/guide",
  },
};

export default function GuideHomePage() {
  return (
    <div>
      <header className="mb-12">
        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-4">
          Rendorax Studio
        </span>
        <h1 className="text-3xl md:text-5xl font-display text-white leading-tight mb-4">
          Guide <span className="text-gold-primary">Center.</span>
        </h1>
        <p className="text-sm md:text-base text-text-gray font-light max-w-2xl leading-relaxed">
          Static help for the production workflow already in Studio — not a
          separate product. Use the same terminology you see in Dashboard and
          Admin HQ.
        </p>
      </header>

      <section className="mb-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold-primary mb-4">
          Core workflow
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {WORKFLOW_STEPS.map((step, index) => (
            <span key={step} className="flex items-center gap-2 max-w-full">
              <span className="text-white bg-white/5 border border-white/10 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm break-words">
                {step}
              </span>
              {index < WORKFLOW_STEPS.length - 1 ? (
                <span className="text-gold-primary/60 shrink-0" aria-hidden>
                  ↓
                </span>
              ) : null}
            </span>
          ))}
        </div>
        <p className="mt-4">
          <Link
            href="/guide/workflow"
            className="text-[11px] uppercase tracking-[0.2em] text-gold-primary hover:text-white transition-colors"
          >
            Open Workflow Guide →
          </Link>
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GUIDE_NAV.filter((g) => g.title !== "Start").map((group) => (
          <div
            key={group.title}
            className="border border-white/5 bg-[#0e0e12] p-5"
          >
            <h2 className="font-display text-xl text-white mb-3">
              {group.title}
            </h2>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-text-gray hover:text-gold-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="border border-white/5 bg-[#0e0e12] p-5 md:col-span-2">
          <h2 className="font-display text-xl text-white mb-3">Start here</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/guide/getting-started"
              className="text-sm text-gold-primary hover:text-white transition-colors"
            >
              Getting Started
            </Link>
            <Link
              href="/guide/demo"
              className="text-sm text-gold-primary hover:text-white transition-colors"
            >
              Demo Workspace
            </Link>
            <Link
              href="/guide/faq"
              className="text-sm text-gold-primary hover:text-white transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/access"
              className="text-sm text-text-gray hover:text-white transition-colors"
            >
              Sign in → /access
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
