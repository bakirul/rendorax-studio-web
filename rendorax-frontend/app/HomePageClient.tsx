"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
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

function RevealOnView({
  children,
  className = "",
  delayMs = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  as?: "div" | "li";
}) {
  const ref = useRef<HTMLDivElement | HTMLLIElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const classes = `hp-reveal ${visible ? "hp-reveal-in" : ""} ${className}`;
  const style = { "--hp-reveal-delay": `${delayMs}ms` } as CSSProperties;

  if (as === "li") {
    return (
      <li
        ref={ref as RefObject<HTMLLIElement>}
        className={classes}
        style={style}
      >
        {children}
      </li>
    );
  }

  return (
    <div
      ref={ref as RefObject<HTMLDivElement>}
      className={classes}
      style={style}
    >
      {children}
    </div>
  );
}

function SectionImage({
  src,
  alt,
  title,
  priority = false,
  caption,
  reveal = false,
}: {
  src: string;
  alt: string;
  title: string;
  priority?: boolean;
  caption?: string;
  reveal?: boolean;
}) {
  const figure = (
    <figure className="w-full mb-6 sm:mb-8 lg:mb-10">
      <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#0e0e12] shadow-2xl">
        <Image
          src={src}
          alt={alt}
          title={title}
          width={1672}
          height={941}
          className="w-full h-auto object-cover"
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 100vw, 1280px"
        />
      </div>
      {caption ? (
        <figcaption className="mt-3 px-1 text-center text-[10px] sm:text-[11px] uppercase tracking-[0.12em] sm:tracking-[0.18em] text-gold-primary/70 break-words">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );

  return reveal ? <RevealOnView>{figure}</RevealOnView> : figure;
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
          .hp-reveal {
            opacity: 0;
            transform: translateY(12px);
            transition:
              opacity 0.55s ease-out var(--hp-reveal-delay, 0ms),
              transform 0.55s ease-out var(--hp-reveal-delay, 0ms);
          }
          .hp-reveal-in {
            opacity: 1;
            transform: translateY(0);
          }
          .ba-compare .ba-before {
            transition: opacity 0.35s ease, border-color 0.35s ease;
          }
          .ba-compare .ba-after {
            transition:
              transform 0.35s ease,
              border-color 0.35s ease,
              box-shadow 0.35s ease,
              background-color 0.35s ease;
          }
          @media (hover: hover) and (pointer: fine) {
            .ba-compare:has(.ba-after:hover) .ba-before {
              opacity: 0.55;
            }
            .ba-compare .ba-after:hover {
              transform: translateY(-2px);
              border-color: rgba(212, 175, 55, 0.55);
              box-shadow: 0 10px 28px rgba(212, 175, 55, 0.08);
              background-color: rgba(212, 175, 55, 0.07);
            }
            .ba-compare:has(.ba-before:hover) .ba-after {
              opacity: 0.85;
            }
          }
          .hp-card-lift {
            transition:
              transform 0.3s ease,
              border-color 0.3s ease,
              box-shadow 0.3s ease,
              background-color 0.3s ease;
          }
          @media (hover: hover) and (pointer: fine) {
            .hp-card-lift:hover {
              transform: translateY(-3px);
              border-color: rgba(212, 175, 55, 0.35);
              box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
              background-color: rgba(255, 255, 255, 0.05);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .hero-sub-enter {
              opacity: 1;
              transform: none;
              animation: none;
            }
            .hp-reveal {
              opacity: 1;
              transform: none;
              transition: none;
            }
            .ba-compare .ba-before,
            .ba-compare .ba-after,
            .hp-card-lift {
              transition: border-color 0.2s ease, background-color 0.2s ease !important;
            }
            .ba-compare .ba-after:hover,
            .hp-card-lift:hover {
              transform: none !important;
              box-shadow: none !important;
            }
          }
        `,
        }}
      />

      <Navbar />

      {/* 1. Hero */}
      <header className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12 sm:pt-32 sm:pb-20 lg:pt-44 lg:pb-28 flex flex-col lg:flex-row items-center gap-8 sm:gap-10 lg:gap-12 overflow-hidden lg:overflow-visible">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100vw,420px)] sm:w-[600px] h-[min(100vw,420px)] sm:h-[600px] bg-gold-primary blur-[120px] sm:blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none" />

        <div className="w-full lg:w-1/2 flex flex-col items-start text-left z-10 min-w-0">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.3em] text-gold-primary mb-3 sm:mb-4">
            Broadcast Post-Production Operations
          </span>
          <h1 className="text-[clamp(1.85rem,8vw,4.5rem)] font-display leading-[1.1] mb-5 sm:mb-6 bg-gradient-to-b from-white to-[#aaa] bg-clip-text text-transparent break-words">
            One accountable path for post-production.
          </h1>
          <p className="hero-sub-enter text-[0.95rem] sm:text-base md:text-lg text-gray-300 font-light leading-relaxed max-w-lg mb-8 sm:mb-10">
            We are a broadcast post-production partner. Request to archive runs
            on our platform—for agencies, networks, OTT, and commercial teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-8 items-stretch sm:items-center w-full sm:w-auto">
            <Link
              href="/contact"
              className="w-full sm:w-auto text-center bg-transparent text-gold-primary px-6 sm:px-10 py-3.5 sm:py-4 text-[0.75rem] sm:text-[0.8rem] uppercase tracking-[0.12em] sm:tracking-[0.15em] border border-gold-primary transition-all duration-400 hover:bg-gold-primary hover:text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] min-h-[48px] flex items-center justify-center"
            >
              Book a Strategy Call
            </Link>
            <Link
              href="#journey"
              className="w-full sm:w-auto text-center text-text-white text-[0.8rem] sm:text-[0.85rem] uppercase tracking-[0.1em] border-b border-transparent py-3 sm:py-0 hover:text-gold-primary hover:border-gold-primary transition-all duration-400 min-h-[44px] flex items-center justify-center sm:justify-start"
            >
              See the Operating Path
            </Link>
          </div>
        </div>

        <div className="w-full lg:w-1/2 relative z-10 min-w-0 lg:perspective-[1200px]">
          <div className="absolute inset-0 bg-gold-primary/20 blur-[80px] sm:blur-[100px] rounded-full scale-75 pointer-events-none" />
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
          <p className="mt-3 sm:mt-4 px-1 text-center text-[10px] sm:text-[11px] uppercase tracking-[0.14em] sm:tracking-[0.2em] text-gold-primary/70 break-words">
            Your view into the operating path.
          </p>
        </div>
      </header>

      {/* 2. Who It's For */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-24">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display text-white leading-tight mb-4 break-words">
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
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display text-white leading-tight mb-3 break-words">
            One accountable path instead of scattered tools.
          </h2>
        </div>

        <SectionImage
          src={`${LANDING}/From-chaos-to-streamlined-control.jpg`}
          alt="Before and after comparison of chaotic email and drive workflows versus Rendorax Studio unified post-production operating path"
          title="From Chaos to Streamlined Control"
          caption="Scattered tools on the left. One accountable path on the right."
        />

        <div className="ba-compare grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 relative">
          <div className="ba-before rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
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

          <div className="ba-after rounded-2xl border border-gold-primary/30 bg-gold-primary/[0.04] p-6 sm:p-8">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-24">
          <div className="max-w-3xl min-w-0">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display text-white leading-tight mb-5 sm:mb-6 break-words">
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
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-28 scroll-mt-24"
      >
        <div className="max-w-2xl mb-8 sm:mb-14 min-w-0">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display text-white leading-tight mb-4 break-words">
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
                  <RevealOnView
                    key={stage.name}
                    as="li"
                    delayMs={index * 60}
                    className="relative pl-6 pb-8 last:pb-0"
                  >
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
                  </RevealOnView>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* Desktop: horizontal timeline */}
        <div className="hidden lg:block overflow-x-auto overscroll-x-contain pb-2 -mx-4 px-4 xl:mx-0 xl:px-0">
          <div className="min-w-[900px] xl:min-w-0 xl:w-full">
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
                  <RevealOnView
                    key={stage.name}
                    as="li"
                    delayMs={index * 45}
                    className="flex flex-col items-center text-center px-1"
                  >
                    <span className="relative z-10 mb-4 flex h-8 w-8 items-center justify-center rounded-full border border-gold-primary/50 bg-[#0e0e12] text-[10px] font-mono text-gold-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-sm font-display text-white mb-2 leading-snug">
                      {stage.name}
                    </h3>
                    <p className="text-[11px] text-text-gray leading-relaxed">
                      {stage.line}
                    </p>
                  </RevealOnView>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-12">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gold-primary block mb-3 sm:mb-4">
              Real-Time Collaboration
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display text-white leading-tight mb-4 break-words">
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
            {COLLABORATION_CARDS.map(({ title, body, icon: Icon }, index) => (
              <RevealOnView key={title} delayMs={index * 70}>
                <div className="hp-card-lift rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 h-full">
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
              </RevealOnView>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Standards & Delivery */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-24">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display text-white leading-tight mb-4 break-words">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-28">
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-10 lg:gap-16">
            <div className="w-full lg:w-1/2 order-1 lg:order-2 min-w-0">
              <RevealOnView>
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
              </RevealOnView>
            </div>
            <div className="w-full lg:w-1/2 order-2 lg:order-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display text-white leading-tight mb-4 sm:mb-5 break-words">
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

      {/* 9. How Onboarding Works */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <div className="max-w-2xl mb-6 sm:mb-10 min-w-0">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gold-primary block mb-3">
            How Onboarding Works
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display text-white leading-tight mb-4 break-words">
            How projects begin.
          </h2>
          <p className="text-sm md:text-base text-text-gray font-light leading-relaxed">
            Client access is provided after onboarding and project approval.
            There is no public signup.
          </p>
        </div>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-8">
          {[
            "Submit an inquiry",
            "Discuss scope and requirements",
            "Receive a proposal",
            "Approve the project",
            "Access Client Vault",
          ].map((step, index) => (
            <li
              key={step}
              className="border border-white/10 bg-white/[0.02] px-4 py-4"
            >
              <span className="font-mono text-[10px] text-gold-primary block mb-2">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-sm text-white leading-snug">{step}</p>
            </li>
          ))}
        </ol>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-primary hover:text-white transition-colors"
        >
          Discuss Your Project
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>

      {/* 10. Engagement Models */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display text-white leading-tight mb-4 break-words">
            Choose how we work together.
          </h2>
          <p className="text-sm md:text-base text-text-gray font-light leading-relaxed">
            Same operating path. Different commercial shape.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 items-stretch">
          {ENGAGEMENT_MODELS.map((model) => (
            <div
              key={model.title}
              className={`hp-card-lift p-6 sm:p-7 lg:p-8 flex flex-col min-w-0 ${
                model.featured
                  ? "bg-gradient-to-b from-bg-panel to-[#1a1710] border border-gold-primary shadow-[0_0_30px_rgba(212,175,55,0.1)] lg:-translate-y-2"
                  : "bg-bg-panel border border-white/10"
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
                className={`w-full text-center py-3.5 px-2 text-[10px] sm:text-[11px] uppercase tracking-widest transition-all mt-auto min-h-[48px] flex items-center justify-center leading-snug ${
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

      {/* 11. Credibility */}
      <section
        className="w-full py-12 sm:py-24 md:py-32 text-center border-y border-gold-primary/15"
        style={{
          background: "radial-gradient(circle, #0f0f0f 0%, #050505 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-8 sm:mb-12">
          <SectionImage
            src={`${LANDING}/Post-production-control-room-in-action.jpg`}
            alt="Rendorax Studio post-production control room with colorist workstation, QC scopes, and broadcast delivery readiness"
            title="Post-Production Control Room in Action"
            caption="Broadcast-grade craft behind every delivery."
          />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 min-w-0">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display text-white mb-5 sm:mb-6 break-words">
            Judgment behind every frame.
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-300 font-light leading-relaxed mb-8 sm:mb-10">
            Built under broadcast leadership with more than sixteen years in the
            field, our teams bring judgment and delivery discipline to every
            project.
          </p>
          <ul className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-8 text-[10px] sm:text-[11px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-gold-primary/80">
            <li>Broadcast veterans on the work</li>
            <li>Dedicated specialists by craft</li>
            <li>Delivery discipline before release</li>
          </ul>
        </div>
      </section>

      {/* 12. Final CTA */}
      <section className="w-full py-12 sm:py-24 lg:py-32 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 min-w-0">
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display text-white mb-5 sm:mb-6 leading-tight break-words">
            Ready to run post properly?
          </h2>
          <p className="text-text-gray text-base sm:text-lg mb-4 leading-relaxed">
            If you need accountable post-production operations—and a clear path
            from request to archive—let&apos;s talk strategy.
          </p>
          <p className="text-sm text-gray-400 mb-8 sm:mb-10 leading-relaxed">
            Agency leads, production managers, and content owners responsible
            for delivery.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center w-full sm:w-auto bg-transparent text-gold-primary px-8 sm:px-10 py-4 text-[0.75rem] sm:text-[0.8rem] uppercase tracking-[0.12em] sm:tracking-[0.15em] border border-gold-primary transition-all duration-400 hover:bg-gold-primary hover:text-black min-h-[48px]"
          >
            Discuss Your Project
          </Link>
          <p className="mt-6 sm:mt-8 text-[10px] sm:text-[11px] uppercase tracking-[0.12em] sm:tracking-[0.15em] text-text-gray/70 px-1 leading-relaxed">
            Clients are onboarded manually. No public signup. No free trial.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
