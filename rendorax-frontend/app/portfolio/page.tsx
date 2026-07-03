import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import ProfessionalTrackRecord from "@/components/portfolio/ProfessionalTrackRecord";
import { Lock } from "lucide-react";

const internationalWorks = [
  {
    vimeoId: "628361973",
    title: "International Labour Organization (ILO)",
    agency: "AIMS Bangladesh",
    role: "Asst. Director and Video Editor",
    featured: true,
  },
  {
    vimeoId: "628282024",
    title: "The World Bank",
    agency: "AIMS Bangladesh",
    role: "Asst. Director and Video Editor",
  },
  {
    vimeoId: "629307716",
    title: "Popular Pharmaceuticals (Corporate Profile)",
    agency: "AIMS Bangladesh",
    role: "Asst. Director and Video Editor",
  },
  {
    vimeoId: "628260158",
    title:
      "UNWOMEN & Bangladesh Centre for Advanced Studies (Climate Change Initiative)",
    agency: "AIMS Bangladesh",
    role: "Asst. Director and Video Editor",
  },
  {
    vimeoId: "628371698",
    title: "KATALYST & Partners",
    agency: "AIMS Bangladesh",
    role: "Asst. Director and Video Editor",
    details:
      "Implemented by Swisscontact. Funded by UKaid, SDC, and DANIDA, in partnership with the Government of Bangladesh.",
  },
] as const;

function WorkCredits({
  agency,
  role,
}: {
  agency: string;
  role: string;
}) {
  return (
    <div className="mt-2 space-y-1">
      <p className="text-xs text-text-gray leading-relaxed">
        <span className="text-gray-500">Agency: </span>
        {agency}
      </p>
      <p className="text-xs leading-relaxed">
        <span className="text-gray-500">Role: </span>
        <span className="text-gold-primary/90">{role}</span>
      </p>
    </div>
  );
}

function getWorkKey(work: (typeof internationalWorks)[number]): string {
  if ("youtubeId" in work) {
    return String(work.youtubeId);
  }
  return work.vimeoId;
}

function WorkVideoEmbed({
  work,
}: {
  work: (typeof internationalWorks)[number];
}) {
  const wrapperClassName =
    "relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black shadow-xl shadow-black/40";

  if ("youtubeId" in work) {
    return (
      <div className={wrapperClassName}>
        <iframe
          src={`https://www.youtube.com/embed/${work.youtubeId}?rel=0`}
          title={work.title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      <iframe
        src={`https://player.vimeo.com/video/${work.vimeoId}?title=0&byline=0&portrait=0`}
        title={work.title}
        className="absolute inset-0 h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
        allowFullScreen
      />
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      <section className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none" />
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-4">
            Documentary & Corporate Production
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-white leading-tight mb-5">
            Selected International Works (2010–2016)
          </h2>
          <p className="text-sm md:text-base text-text-gray font-light leading-relaxed">
            High-end documentary and corporate production for global
            organizations, development agencies, and enterprise partners.
          </p>
        </div>

        <div className="mb-12 rounded-xl border border-gold-primary/20 bg-gold-primary/5 px-6 py-5 md:px-8 md:py-6 backdrop-blur-sm">
          <p className="text-sm md:text-base text-white/90 leading-relaxed text-center md:text-left">
            <span className="font-medium text-gold-primary">
              For the following featured projects, key responsibilities included:{" "}
            </span>
            Assistant Director, Co-Script Writer, Video Editor, and Post
            Production Design.
          </p>
        </div>

        <div className="flex flex-col gap-10">
          {internationalWorks
            .filter((work) => "featured" in work && work.featured)
            .map((work) => (
              <article
                key={getWorkKey(work)}
                className="group rounded-2xl border border-gold-primary/30 bg-white/[0.04] p-4 md:p-6 shadow-[0_0_50px_rgba(212,175,55,0.08)] transition-colors hover:border-gold-primary/50"
              >
                <WorkVideoEmbed work={work} />
                <div className="mt-5 px-1">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gold-primary mb-2">
                    Featured Project
                  </p>
                  <h3 className="text-lg md:text-xl font-display text-white">
                    {work.title}
                  </h3>
                  <WorkCredits agency={work.agency} role={work.role} />
                </div>
              </article>
            ))}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {internationalWorks
              .filter((work) => !("featured" in work && work.featured))
              .map((work) => (
                <article
                  key={getWorkKey(work)}
                  className="group flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-3 md:p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <WorkVideoEmbed work={work} />
                  <div className="mt-4 px-1 flex-1">
                    <h3 className="text-base md:text-lg font-display text-white leading-snug">
                      {work.title}
                    </h3>
                    <WorkCredits agency={work.agency} role={work.role} />
                    {"details" in work && work.details ? (
                      <p className="mt-2 text-xs text-text-gray leading-relaxed">
                        {work.details}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
          </div>
        </div>

        <div className="mt-12 flex gap-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 md:p-6">
          <div className="shrink-0 text-gold-primary/80">
            <Lock className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <p className="text-xs md:text-sm text-text-gray leading-relaxed">
            <span className="font-medium text-white/90">Note: </span>
            Recent agency and enterprise-level client works are protected under
            strict Non-Disclosure Agreements (NDAs). Private review links for
            specific technical capabilities are available upon authorized
            request.
          </p>
        </div>
      </section>

      <ProfessionalTrackRecord />

      <section className="w-full py-24 text-center border-t border-white/5 bg-black/50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display text-white mb-6">
            Ready to craft your next visual story?
          </h2>
          <Link
            href="/contact"
            className="inline-block bg-transparent border border-gold-primary text-gold-primary px-10 py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gold-primary hover:text-black transition-all duration-400 shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
          >
            Request a Quote
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
