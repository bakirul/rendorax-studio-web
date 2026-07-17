"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import Image from "next/image";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import Footer from "@/components/Footer";
import {
  Tv,
  MonitorPlay,
  Briefcase,
  Clapperboard,
  Radio,
  Package,
  Languages,
  ShieldCheck,
  Eye,
  LayoutDashboard,
  SlidersHorizontal,
  ArrowRight,
  Crosshair,
  RefreshCw,
} from "lucide-react";

const ICP_CARDS = [
  {
    title: "Broadcast Networks",
    body: "Network schedules leave no room for delivery failures. We run post with broadcast discipline from brief to master.",
    icon: Tv,
  },
  {
    title: "OTT Platforms",
    body: "Series and streaming slates need pace without breaking specs. We keep volume moving inside one controlled path.",
    icon: MonitorPlay,
  },
  {
    title: "Agencies",
    body: "You need a reliable post backend—not another vendor to manage. We extend your production capacity with full visibility.",
    icon: Briefcase,
  },
  {
    title: "Commercial Productions",
    body: "Campaigns and branded films need clean scope and clean finish. We take one project from request through delivery.",
    icon: Clapperboard,
  },
] as const;

const JOURNEY_ACTS = [
  {
    act: "Align",
    stages: [
      { name: "Request", line: "You submit the brief and requirements." },
      { name: "Proposal", line: "We return scope, timeline, and cost." },
      { name: "Approval", line: "You approve before production begins." },
    ],
  },
  {
    act: "Make",
    stages: [
      { name: "Project", line: "Approved work becomes an active project." },
      { name: "Production", line: "Specialists execute under clear assignment." },
      { name: "Review", line: "You give precise feedback on versions." },
      { name: "Picture Lock", line: "Picture is locked before final masters." },
    ],
  },
  {
    act: "Finish",
    stages: [
      { name: "Delivery", line: "Masters and deliverables are released." },
      {
        name: "Archive",
        line: "Finished work is preserved. Active noise is cleared.",
      },
    ],
  },
] as const;

const JOURNEY_FLAT = JOURNEY_ACTS.flatMap((act) =>
  act.stages.map((stage) => ({ ...stage, act: act.act })),
);

const STANDARDS_CARDS = [
  {
    title: "Broadcast Delivery",
    body: 'Masters prepared for network technical expectations—not "good enough" exports.',
    icon: Radio,
  },
  {
    title: "OTT Readiness",
    body: "Packaging and delivery habits built for streaming platforms and series pipelines.",
    icon: Package,
  },
  {
    title: "Localization",
    body: "Textless plates and multi-channel audio prepared for international versions.",
    icon: Languages,
  },
  {
    title: "Compliance",
    body: "Frame rates, loudness, and delivery specs treated as non-negotiable.",
    icon: ShieldCheck,
  },
] as const;

const VAULT_PILLARS = [
  {
    title: "Transparency",
    body: "See project status without waiting on email threads.",
    icon: Eye,
  },
  {
    title: "Visibility",
    body: "Review versions, feedback, and deliverables live in one place.",
    icon: LayoutDashboard,
  },
  {
    title: "Control",
    body: "Approve, revise, and access delivery on your side of the path.",
    icon: SlidersHorizontal,
  },
] as const;

const COLLABORATION_CARDS = [
  {
    title: "Live Timeline Direction",
    body: "Give precise direction directly on the timeline.",
    icon: Crosshair,
  },
  {
    title: "Instant Correction Loop",
    body: "Editors receive feedback and respond in the same workflow.",
    icon: RefreshCw,
  },
  {
    title: "Cross-Language Collaboration",
    body: "Clients and editors can collaborate even when they do not share the same language.",
    icon: Languages,
  },
] as const;

const BEFORE_ITEMS = [
  "Email Chains",
  "WhatsApp Messages",
  "Shared Drives",
  "Spreadsheets",
  "Review Links",
] as const;

const AFTER_ITEMS = [
  "Request",
  "Proposal",
  "Approval",
  "Project",
  "Production",
  "Review",
  "Picture Lock",
  "Delivery",
] as const;

const LANDING = "/assets/landing_page-image" as const;

function SectionImage({
  src,
  alt,
  title,
  priority = false,
  caption,
}: {
  src: string;
  alt: string;
  title: string;
  priority?: boolean;
  caption?: string;
}) {
  return (
    <figure className="w-full mb-8 sm:mb-10">
      <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#0e0e12] shadow-2xl">
        <Image
          src={src}
          alt={alt}
          title={title}
          width={1672}
          height={941}
          className="w-full h-auto object-cover"
          priority={priority}
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center text-[11px] uppercase tracking-[0.18em] text-gold-primary/70">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

const ENGAGEMENT_MODELS = [
  {
    title: "Project Based",
    forLabel: "For",
    forText:
      "Single documentaries, films, or targeted campaigns.",
    promise: "Clear scope. Clear finish. One project run end to end.",
    cta: "Start a Project Conversation",
    featured: false,
  },
  {
    title: "Retainer",
    forLabel: "For",
    forText: "OTT series, ongoing channels, and continuous slates.",
    promise:
      "Reserved capacity and a steady production rhythm under one path.",
    cta: "Partner on Ongoing Production",
    featured: true,
  },
  {
    title: "Agency Backend",
    forLabel: "For",
    forText:
      "Agencies and production houses that need a post backbone.",
    promise:
      "We become your post-production backend—with client visibility built in.",
    cta: "Discuss Backend Partnership",
    featured: false,
  },
] as const;

export default function HomePageClient() {
  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media (min-width: 1024px) {
            .hero-dashboard-mockup {
              transform: rotateY(-15deg) rotateX(5deg);
              box-shadow: -20px 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(212,175,55,0.1) !important;
            }
          }
          .hero-dashboard-mockup [data-rmiz-content="found"] {
            display: block;
            width: 100%;
          }
          @keyframes heroSubEnter {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .hero-sub-enter {
            opacity: 0;
            animation: heroSubEnter 0.7s ease-out 0.15s forwards;
          }
          @media (prefers-reduced-motion: reduce) {
            .hero-sub-enter {
              opacity: 1;
              transform: none;
              animation: none;
            }
          }
        `,
        }}
      />

      <Navbar />

      {/* 1. Hero */}
      <header className="relative w-full max-w-7xl mx-auto px-6 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-44 lg:pb-28 flex flex-col lg:flex-row items-center gap-10 lg:gap-12 overflow-visible">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none" />

        <div className="w-full lg:w-1/2 flex flex-col items-start text-left z-10">
          <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary mb-4">
            Broadcast Post-Production Operations
          </span>
          <h1 className="text-[clamp(2.4rem,5.5vw,4.5rem)] font-display leading-[1.08] mb-6 bg-gradient-to-b from-white to-[#aaa] bg-clip-text text-transparent">
            One accountable path for post-production.
          </h1>
          <p className="hero-sub-enter text-base sm:text-lg text-gray-300 font-light leading-relaxed max-w-lg mb-10">
            We are a broadcast post-production partner. Request to archive runs
            on our platform—for agencies, networks, OTT, and commercial teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-stretch sm:items-center w-full sm:w-auto">
            <Link
              href="/contact"
              className="w-full sm:w-auto text-center bg-transparent text-gold-primary px-8 sm:px-10 py-4 text-[0.8rem] uppercase tracking-[0.15em] border border-gold-primary transition-all duration-400 hover:bg-gold-primary hover:text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              Book a Strategy Call
            </Link>
            <Link
              href="#journey"
              className="w-full sm:w-auto text-center text-text-white text-[0.85rem] uppercase tracking-[0.1em] border-b border-transparent py-3 sm:py-0 hover:text-gold-primary hover:border-gold-primary transition-all duration-400"
            >
              See the Operating Path
            </Link>
          </div>
        </div>

        <div className="w-full lg:w-1/2 relative z-10 lg:perspective-[1200px]">
          <div className="absolute inset-0 bg-gold-primary/20 blur-[100px] rounded-full scale-75" />
          <div className="relative w-full rounded-xl border border-white/10 shadow-2xl bg-[#0e0e12] overflow-hidden transform transition-transform duration-700 hover:rotate-y-0 hover:rotate-x-0 hero-dashboard-mockup">
            <Zoom zoomMargin={45}>
              <Image
                src="/assets/rendorax-post-production-client-vault-dashboard.png"
                alt="Rendorax Studio client view of the post-production operating path"
                title="Rendorax Studio Operating Path Client View"
                width={1200}
                height={675}
                className="rounded-xl shadow-2xl border border-gray-800 object-cover w-full h-auto"
                priority
              />
            </Zoom>
            <div className="absolute top-0 left-0 w-full h-8 bg-[#13131a] border-b border-white/5 flex items-center px-4 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
          </div>
          <p className="mt-4 text-center text-[11px] uppercase tracking-[0.2em] text-gold-primary/70">
            Your view into the operating path.
          </p>
        </div>
      </header>

      {/* 2. Who It's For */}
      <section className="w-full max-w-7xl mx-auto px-6 py-16 sm:py-20 lg:py-24">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-white leading-tight mb-4">
            Built for delivery-critical teams.
          </h2>
          <p className="text-sm md:text-base text-text-gray font-light leading-relaxed">
            If your work faces real deadlines and real delivery standards, you
            are in the right place.
          </p>
        </div>
        <SectionImage
          src={`${LANDING}/Global-post-production-operations-in-action.jpg`}
          alt="Rendorax Studio global post-production operations center with teams managing active productions across time zones"
          title="Global Post-Production Operations"
          caption="Built for delivery-critical teams worldwide."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          {ICP_CARDS.map(({ title, body, icon: Icon }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 transition-all duration-300 hover:border-gold-primary/30 hover:bg-white/[0.05]"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold-primary/20 bg-gold-primary/10 text-gold-primary">
                <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-display text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Before → After Transformation */}
      <section className="w-full max-w-7xl mx-auto px-6 py-14 sm:py-16 lg:py-20">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display text-white leading-tight mb-3">
            One accountable path instead of scattered tools.
          </h2>
        </div>

        <SectionImage
          src={`${LANDING}/From-chaos-to-streamlined-control.jpg`}
          alt="Before and after comparison of chaotic email and drive workflows versus Rendorax Studio unified post-production operating path"
          title="From Chaos to Streamlined Control"
          caption="Scattered tools on the left. One accountable path on the right."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 relative">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.25em] text-text-gray mb-5">
              Before
            </p>
            <ul className="space-y-3">
              {BEFORE_ITEMS.map((item) => (
                <li
                  key={item}
                  className="text-sm sm:text-base text-gray-400 leading-relaxed border-b border-white/5 pb-3 last:border-0 last:pb-0"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border border-gold-primary/40 bg-[#0e0e12] text-gold-primary text-xs"
            aria-hidden="true"
          >
            →
          </div>

          <div className="flex lg:hidden justify-center py-1" aria-hidden="true">
            <span className="text-gold-primary text-sm tracking-widest">↓</span>
          </div>

          <div className="rounded-2xl border border-gold-primary/30 bg-gold-primary/[0.04] p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold-primary mb-5">
              After
            </p>
            <ul className="space-y-3">
              {AFTER_ITEMS.map((item) => (
                <li
                  key={item}
                  className="text-sm sm:text-base text-white leading-relaxed border-b border-gold-primary/10 pb-3 last:border-0 last:pb-0"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Broken Stack */}
      <section className="w-full border-y border-gold-primary/15 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-white leading-tight mb-6">
              Too many tools. No single path.
            </h2>
            <p className="text-base text-gray-300 font-light leading-relaxed mb-4">
              Most post work is split across file shares, email threads,
              freelancers, and review links. Status disappears, revisions
              multiply, and delivery risk lands on you.
            </p>
            <p className="text-base text-white/90 font-light leading-relaxed border-l-2 border-gold-primary pl-5">
              Rendorax replaces that scatter with one accountable operating
              path—from first request to archive.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Operating Journey */}
      <section
        id="journey"
        className="w-full max-w-7xl mx-auto px-6 py-16 sm:py-20 lg:py-28 scroll-mt-24"
      >
        <div className="max-w-2xl mb-10 sm:mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-white leading-tight mb-4">
            One path from request to archive.
          </h2>
          <p className="text-sm md:text-base text-text-gray font-light leading-relaxed">
            Every engagement follows the same stages. You always know where the
            work stands.
          </p>
        </div>

        <SectionImage
          src={`${LANDING}/Post-production-studio-dashboard-overview.jpg`}
          alt="Rendorax Studio post-production operating path dashboard showing request through delivery stages with live project status"
          title="Post-Production Operating Path Dashboard"
          caption="Request to delivery—visible as one operating path."
        />

        {/* Mobile: vertical by act */}
        <div className="lg:hidden space-y-10">
          {JOURNEY_ACTS.map((act) => (
            <div key={act.act}>
              <p className="text-[11px] uppercase tracking-[0.25em] text-gold-primary mb-4">
                {act.act}
              </p>
              <ol className="relative space-y-0 border-l border-gold-primary/30 ml-2">
                {act.stages.map((stage, index) => (
                  <li key={stage.name} className="relative pl-6 pb-8 last:pb-0">
                    <span className="absolute left-0 top-1.5 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-gold-primary" />
                    <p className="text-[10px] font-mono text-gold-primary/70 mb-1">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3 className="text-lg font-display text-white mb-1">
                      {stage.name}
                    </h3>
                    <p className="text-sm text-text-gray leading-relaxed">
                      {stage.line}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* Desktop: horizontal timeline */}
        <div className="hidden lg:block overflow-x-auto pb-2">
          <div className="min-w-[960px]">
            <div className="grid grid-cols-9 gap-2 mb-3">
              {JOURNEY_ACTS.map((act) => (
                <div
                  key={act.act}
                  className="text-center"
                  style={{ gridColumn: `span ${act.stages.length}` }}
                >
                  <span className="text-[10px] uppercase tracking-[0.25em] text-gold-primary/80">
                    {act.act}
                  </span>
                </div>
              ))}
            </div>
            <div className="relative">
              <div className="absolute top-4 left-4 right-4 h-px bg-gold-primary/25" />
              <ol className="relative grid grid-cols-9 gap-2">
                {JOURNEY_FLAT.map((stage, index) => (
                  <li key={stage.name} className="flex flex-col items-center text-center px-1">
                    <span className="relative z-10 mb-4 flex h-8 w-8 items-center justify-center rounded-full border border-gold-primary/50 bg-[#0e0e12] text-[10px] font-mono text-gold-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-sm font-display text-white mb-2 leading-snug">
                      {stage.name}
                    </h3>
                    <p className="text-[11px] text-text-gray leading-relaxed">
                      {stage.line}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <div className="mt-10 sm:mt-12">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-primary hover:text-white transition-colors"
          >
            Discuss This Path
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* 6. Real-Time Collaboration */}
      <section className="w-full border-y border-gold-primary/15 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 py-14 sm:py-16 lg:py-20">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-4">
              Real-Time Collaboration
            </span>
            <h2 className="text-3xl md:text-4xl font-display text-white leading-tight mb-4">
              Stay inside the edit.
            </h2>
            <p className="text-sm md:text-base text-text-gray font-light leading-relaxed">
              Review cuts, direct editors, and resolve feedback without waiting
              for emails, meetings, or language barriers.
            </p>
          </div>
          <SectionImage
            src={`${LANDING}/Collaboration-in-Rendorax-studio-interface.jpg`}
            alt="Rendorax Studio real-time collaboration interface with timeline direction, live session, and cross-language feedback"
            title="Real-Time Collaboration in Rendorax Studio"
            caption="Stay inside the edit—across languages and time zones."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {COLLABORATION_CARDS.map(({ title, body, icon: Icon }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold-primary/20 bg-gold-primary/10 text-gold-primary">
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-lg font-display text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Standards & Delivery */}
      <section className="w-full max-w-7xl mx-auto px-6 py-16 sm:py-20 lg:py-24">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-white leading-tight mb-4">
            Delivery standards that protect the work.
          </h2>
          <p className="text-sm md:text-base text-text-gray font-light leading-relaxed">
            The same discipline that serves broadcast and OTT also protects
            smaller projects from messy handoffs.
          </p>
        </div>
        <SectionImage
          src={`${LANDING}/Professional-post-production-color-grading-studio.jpg`}
          alt="Rendorax Studio broadcast quality control suite with HDR scopes and OTT delivery standards checklist"
          title="Broadcast Quality Control and Delivery Standards"
          caption="QC and delivery standards that protect every master."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          {STANDARDS_CARDS.map(({ title, body, icon: Icon }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 transition-all duration-300 hover:border-gold-primary/30 hover:bg-white/[0.05]"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold-primary/20 bg-gold-primary/10 text-gold-primary">
                <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-display text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Client Vault */}
      <section className="w-full border-y border-gold-primary/15 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20 lg:py-28">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="w-full lg:w-1/2 order-1 lg:order-2">
              <Zoom zoomMargin={45}>
                <Image
                  src="/assets/rendorax-client-vault-portal.png"
                  alt="Rendorax Studio Client Vault portal showing project status, review versions, and delivery access"
                  title="Rendorax Client Vault"
                  width={1200}
                  height={675}
                  className="w-full h-auto rounded-xl shadow-2xl border border-white/10 object-cover"
                />
              </Zoom>
            </div>
            <div className="w-full lg:w-1/2 order-2 lg:order-1">
              <h2 className="text-3xl md:text-4xl font-display text-white leading-tight mb-5">
                Transparency without chasing updates.
              </h2>
              <p className="text-base text-gray-300 font-light leading-relaxed mb-8">
                Client Vault is how you stay inside our process—status, review,
                and delivery—not another place to store files.
              </p>
              <div className="grid grid-cols-1 gap-4">
                {VAULT_PILLARS.map(({ title, body, icon: Icon }) => (
                  <div
                    key={title}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-5 flex gap-4"
                  >
                    <div className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gold-primary/20 bg-gold-primary/10 text-gold-primary">
                      <Icon
                        className="h-5 w-5"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-display text-white mb-1">
                        {title}
                      </h3>
                      <p className="text-sm text-text-gray leading-relaxed">
                        {body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[11px] uppercase tracking-[0.15em] text-text-gray/80">
                Access is provided after onboarding. There is no public signup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Engagement Models */}
      <section className="w-full max-w-7xl mx-auto px-6 py-16 sm:py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-white leading-tight mb-4">
            Choose how we work together.
          </h2>
          <p className="text-sm md:text-base text-text-gray font-light leading-relaxed">
            Same operating path. Different commercial shape.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch">
          {ENGAGEMENT_MODELS.map((model) => (
            <div
              key={model.title}
              className={`p-7 sm:p-8 flex flex-col transition-all ${
                model.featured
                  ? "bg-gradient-to-b from-bg-panel to-[#1a1710] border border-gold-primary shadow-[0_0_30px_rgba(212,175,55,0.1)] md:-translate-y-2"
                  : "bg-bg-panel border border-white/10 hover:border-gold-primary/40"
              }`}
            >
              <h3 className="text-xl font-display text-white mb-4">
                {model.title}
              </h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold-primary/80 mb-1">
                {model.forLabel}
              </p>
              <p className="text-sm text-text-gray mb-4 leading-relaxed">
                {model.forText}
              </p>
              <p className="text-sm text-gray-300 mb-8 leading-relaxed flex-1">
                {model.promise}
              </p>
              <Link
                href="/contact"
                className={`w-full text-center py-3.5 text-[11px] uppercase tracking-widest transition-all mt-auto min-h-[48px] flex items-center justify-center ${
                  model.featured
                    ? "bg-gold-primary text-black hover:bg-white"
                    : "border border-white/20 hover:border-gold-primary hover:text-gold-primary"
                }`}
              >
                {model.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 10. Credibility */}
      <section
        className="w-full py-16 sm:py-24 md:py-32 text-center border-y border-gold-primary/15"
        style={{
          background: "radial-gradient(circle, #0f0f0f 0%, #050505 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 mb-10 sm:mb-12">
          <SectionImage
            src={`${LANDING}/Post-production-control-room-in-action.jpg`}
            alt="Rendorax Studio post-production control room with colorist workstation, QC scopes, and broadcast delivery readiness"
            title="Post-Production Control Room in Action"
            caption="Broadcast-grade craft behind every delivery."
          />
        </div>
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display text-white mb-6">
            Judgment behind every frame.
          </h2>
          <p className="text-base md:text-lg text-gray-300 font-light leading-relaxed mb-10">
            Built under broadcast leadership with more than sixteen years in the
            field, our teams bring judgment and delivery discipline to every
            project.
          </p>
          <ul className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-8 text-[11px] uppercase tracking-[0.18em] text-gold-primary/80">
            <li>Broadcast veterans on the work</li>
            <li>Dedicated specialists by craft</li>
            <li>Delivery discipline before release</li>
          </ul>
        </div>
      </section>

      {/* 11. Final CTA */}
      <section className="w-full py-16 sm:py-24 lg:py-32 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display text-white mb-6 leading-tight">
            Ready to run post properly?
          </h2>
          <p className="text-text-gray text-base sm:text-lg mb-4 leading-relaxed">
            If you need accountable post-production operations—and a clear path
            from request to archive—let&apos;s talk strategy.
          </p>
          <p className="text-sm text-gray-400 mb-10 leading-relaxed">
            Agency leads, production managers, and content owners responsible
            for delivery.
          </p>
          <Link
            href="/contact"
            className="inline-block w-full sm:w-auto bg-transparent text-gold-primary px-10 py-4 text-[0.8rem] uppercase tracking-[0.15em] border border-gold-primary transition-all duration-400 hover:bg-gold-primary hover:text-black min-h-[48px]"
          >
            Book a Strategy Call
          </Link>
          <p className="mt-8 text-[11px] uppercase tracking-[0.15em] text-text-gray/70">
            Clients are onboarded manually. No public signup. No free trial.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
