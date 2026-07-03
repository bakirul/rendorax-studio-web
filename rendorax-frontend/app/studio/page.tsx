"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

export default function StudioPage() {
  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      <section className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-24 lg:pb-32 flex-grow">
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-start">
          <div className="order-2 lg:order-1 space-y-6">
            <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block">
              About Rendorax
            </span>

            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white font-display leading-tight">
              Shaped by the Rigor of Live Broadcast.
            </h1>

            <p className="text-gray-300 leading-relaxed">
              The foundation of Rendorax is built upon over 16 years of
              relentless experience in the high-pressure broadcast industry,
              anchored by a current 9-year ongoing tenure at a leading national
              television channel. Operating entirely as a self-educated
              professional—unbound by traditional degrees—the focus has always
              been strictly on raw skill, exceptional speed, and uncompromising
              broadcast standards.
            </p>

            <p className="text-gray-300 leading-relaxed">
              From orchestrating dynamic environments as a Live Action
              Co-ordinator to overseeing complex cinematic documentary timelines,
              the journey is defined by versatility. Serving across multiple
              lead roles—including Assistant Director, Co-Script Writer, Video
              Editor, and Post-Production Designer—every production is
              engineered with absolute precision.
            </p>

            <p className="text-zinc-400 leading-relaxed">
              This battle-tested expertise has been trusted by virtually every
              major international development organization operating in
              Bangladesh. With an extensive portfolio spanning the World Bank,
              ILO, IOM, and prominent multi-donor initiatives like KATALYST,
              every project is driven by a deep-rooted understanding of strict
              editorial compliance, narrative pacing, and audience psychology.
            </p>

            <div className="pt-4 space-y-4 border-t border-white/10">
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-display">
                Next-Generation Workflow & Automation
              </h2>

              <p className="text-zinc-400 leading-relaxed">
                To meet the rigorous demands of global distributors, Rendorax
                Studio integrates advanced AI-driven workflows into its core
                infrastructure. By harmonizing human editorial mastery with
                cutting-edge generative models, synthetic audio processing, and
                video automation pipelines, we deliver multi-layered
                post-production services at unprecedented speed and scale,
                without ever compromising broadcast compliance.
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2 w-full lg:sticky lg:top-32">
            <div className="relative aspect-[4/5] w-full max-w-md mx-auto lg:max-w-none rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60">
              <Zoom zoomMargin={45}>
                <Image
                  src="/assets/rendorax-broadcast-post-production-studio.png"
                  alt="Rendorax Studio high-end broadcast post-production and AI automation control room in Dhaka"
                  width={800}
                  height={800}
                  className="rounded-2xl object-cover w-full h-full shadow-2xl"
                  priority
                />
              </Zoom>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-gold-primary/5 pointer-events-none rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

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
