import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  SERVICES,
  buildServiceJsonLd,
  getService,
  type ServiceSlug,
} from "@/utils/servicesContent";

export default function ServicePage({ slug }: { slug: ServiceSlug }) {
  const service = getService(slug);

  if (!service) {
    notFound();
  }

  const jsonLd = buildServiceJsonLd(slug);

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 sm:pb-24 flex-grow">
        <div className="absolute top-24 right-0 w-[min(90vw,400px)] h-[min(90vw,400px)] bg-gold-primary blur-[140px] sm:blur-[180px] opacity-10 -z-10 rounded-full pointer-events-none" />

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-8 sm:mb-10">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-text-gray">
            <li>
              <Link href="/" className="hover:text-gold-primary transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden className="text-white/25">
              /
            </li>
            <li>
              <Link
                href="/services"
                className="hover:text-gold-primary transition-colors"
              >
                Services
              </Link>
            </li>
            <li aria-hidden className="text-white/25">
              /
            </li>
            <li className="text-gold-primary" aria-current="page">
              {service.breadcrumbLabel}
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="mb-14 sm:mb-20 max-w-4xl">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-5">
            Rendorax Studio · Services
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-white leading-[1.12] mb-6 break-words">
            {service.h1}
          </h1>
          <p className="text-sm sm:text-base text-text-gray/90 font-light leading-relaxed max-w-2xl mb-8">
            {service.heroValueProp}
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            <Link
              href={`/contact?service=${service.slug}`}
              className="inline-flex justify-center items-center text-[11px] uppercase tracking-[0.2em] font-bold bg-gold-primary text-black px-7 py-4 hover:bg-[#b8952b] transition-colors min-h-[44px]"
            >
              Discuss Your Project
            </Link>
            <Link
              href={service.secondaryCtaHref}
              className="inline-flex justify-center items-center text-[11px] uppercase tracking-[0.2em] border border-white/15 text-white px-7 py-4 hover:border-gold-primary/50 hover:text-gold-primary transition-colors min-h-[44px]"
            >
              {service.secondaryCtaLabel}
            </Link>
          </div>
        </header>

        {/* Overview */}
        <section className="mb-14 sm:mb-20 max-w-4xl">
          <h2 className="text-xl sm:text-2xl font-display text-white mb-5">
            {service.overview.heading}
          </h2>
          <div className="space-y-4 text-sm sm:text-base leading-relaxed text-text-gray/90 font-light">
            {service.overview.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="mt-8 border-t border-white/10 pt-6">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-white font-bold mb-4">
              Who it is for
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {service.overview.audience.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-gold-primary mt-1 shrink-0" aria-hidden>
                    ▹
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Capabilities */}
        <section className="mb-14 sm:mb-20">
          <h2 className="text-xl sm:text-2xl font-display text-white mb-8">
            Capabilities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {service.capabilities.map((cap, i) => (
              <div
                key={i}
                className="bg-bg-panel border border-white/5 p-6 hover:border-gold-primary/30 transition-colors"
              >
                <h3 className="text-base font-display text-white mb-2.5">
                  {cap.title}
                </h3>
                <p className="text-sm text-text-gray leading-relaxed">
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow */}
        <section className="mb-14 sm:mb-20 max-w-4xl">
          <h2 className="text-xl sm:text-2xl font-display text-white mb-3">
            Where it fits in your workflow
          </h2>
          <p className="text-sm text-text-gray font-light mb-8 leading-relaxed">
            Request → Proposal → Approval → Production → Review → Picture Lock →
            Delivery → Archive. This service focuses on the stages below.
          </p>
          <ol className="space-y-4">
            {service.workflow.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span
                  className="shrink-0 font-mono text-[11px] text-gold-primary border border-gold-primary/30 rounded-full w-8 h-8 flex items-center justify-center"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white mb-1">
                    {step.stage}
                  </h3>
                  <p className="text-sm text-text-gray leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Deliverables */}
        <section className="mb-14 sm:mb-20 max-w-4xl">
          <h2 className="text-xl sm:text-2xl font-display text-white mb-8">
            Deliverables
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {service.deliverables.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm border-l-2 border-gold-primary/40 pl-4 py-1"
              >
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Why Rendorax */}
        <section className="mb-14 sm:mb-20">
          <h2 className="text-xl sm:text-2xl font-display text-white mb-8">
            Why Rendorax Studio
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {service.whyPoints.map((point, i) => (
              <div
                key={i}
                className="bg-bg-panel/60 border border-white/5 p-6"
              >
                <h3 className="text-base font-display text-white mb-2.5">
                  {point.title}
                </h3>
                <p className="text-sm text-text-gray leading-relaxed">
                  {point.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Services */}
        <section className="mb-14 sm:mb-20">
          <h2 className="text-xl sm:text-2xl font-display text-white mb-8">
            Related services
          </h2>
          <div className="flex flex-wrap gap-3">
            {service.related.map((relatedSlug) => {
              const related = SERVICES[relatedSlug];
              return (
                <Link
                  key={relatedSlug}
                  href={`/services/${relatedSlug}`}
                  className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] border border-white/10 text-text-gray px-4 py-3 hover:border-gold-primary/50 hover:text-gold-primary transition-colors min-h-[44px]"
                >
                  {related.navLabel}
                  <span aria-hidden className="text-gold-primary/70">
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-14 sm:mb-20 max-w-4xl">
          <h2 className="text-xl sm:text-2xl font-display text-white mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {service.faqs.map((faq, i) => (
              <details
                key={i}
                className="group border border-white/10 bg-bg-panel/50 open:border-gold-primary/30 transition-colors"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-white marker:content-[''] [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-primary/60">
                  <span>{faq.question}</span>
                  <span
                    aria-hidden
                    className="shrink-0 text-gold-primary transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 -mt-1 text-sm text-text-gray leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border border-white/10 bg-gradient-to-br from-bg-panel to-[#0a0a0f] p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-display text-white mb-4 max-w-2xl mx-auto leading-snug">
            {service.finalCtaHeading}
          </h2>
          <p className="text-sm text-text-gray font-light max-w-xl mx-auto mb-8 leading-relaxed">
            {service.finalCtaText}
          </p>
          <Link
            href={`/contact?service=${service.slug}`}
            className="inline-flex justify-center items-center text-[11px] uppercase tracking-[0.2em] font-bold bg-gold-primary text-black px-8 py-4 hover:bg-[#b8952b] transition-colors min-h-[44px]"
          >
            Discuss Your Project
          </Link>
        </section>
      </div>

      <Footer />
    </main>
  );
}
