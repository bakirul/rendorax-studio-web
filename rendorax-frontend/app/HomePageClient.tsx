"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import Image from "next/image";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import Footer from "@/components/Footer";
import {
  Layers,
  AudioWaveform,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function HomePageClient() {
  const [loopKey, setLoopKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoopKey((prev) => prev + 1);
    }, 14000);
    return () => clearInterval(interval);
  }, []);

  const heroText =
    "Upload broadcast files, manage timelines, get frame-precise feedback, and organize assets — all in one secure vault built for post-production teams and clients.";
  const words = heroText.split(" ");

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes colorShift {
            0%, 100% { 
              color: #9ca3af; 
              text-shadow: 0 0 0px rgba(255,255,255,0);
            }
            50% { 
              color: #ffffff; 
              text-shadow: 0 0 15px rgba(255,255,255,0.1);
            }
          }
          .color-shift-text {
            animation: colorShift 5s ease-in-out infinite;
          }
          @keyframes wordCutIn {
            0% { opacity: 0; transform: translateY(5px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .word-cut {
            opacity: 0;
            animation: wordCutIn 0.2s forwards ease-out; 
          }
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
        `,
        }}
      />

      <Navbar />

      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-20 lg:pt-48 lg:pb-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-8 overflow-visible">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

        <div className="w-full lg:w-1/2 flex flex-col items-start text-left z-10">
          <h1 className="text-[clamp(3rem,6vw,5rem)] font-display leading-[1.05] mb-6 bg-gradient-to-b from-white to-[#aaa] bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(255,255,255,0.05)]">
            One platform for your entire post-production.
          </h1>

          <div className="min-h-[80px] flex items-start justify-start mb-10">
            <p
              key={loopKey}
              className="text-lg md:text-xl text-gray-300 font-light leading-relaxed max-w-lg"
            >
              {words.map((word, i) => (
                <span
                  key={i}
                  className="inline-block word-cut"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {word}&nbsp;
                </span>
              ))}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 items-center w-full sm:w-auto">
            <Link
              href="/contact"
              className="w-full sm:w-auto text-center bg-transparent text-gold-primary px-10 py-4 text-[0.8rem] uppercase tracking-[0.15em] border border-gold-primary transition-all duration-400 hover:bg-gold-primary hover:text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              Book a Strategy Call
            </Link>
            <Link
              href="#workflow"
              className="w-full sm:w-auto text-center text-text-white text-[0.85rem] uppercase tracking-[0.1em] border-b border-transparent hover:text-gold-primary hover:border-gold-primary transition-all duration-400"
            >
              Explore Our Workflow
            </Link>
          </div>
        </div>

        <div className="w-full lg:w-1/2 relative mt-12 lg:mt-0 z-10 lg:perspective-[1200px]">
          <div className="absolute inset-0 bg-gold-primary/20 blur-[100px] rounded-full scale-75"></div>
          <div className="relative w-full rounded-xl border border-white/10 shadow-2xl bg-[#0e0e12] overflow-hidden transform transition-transform duration-700 hover:rotate-y-0 hover:rotate-x-0 hero-dashboard-mockup">
            <Zoom zoomMargin={45}>
              <Image
                src="/assets/rendorax-post-production-client-vault-dashboard.png"
                alt="Rendorax Studio client vault dashboard showing timeline management, frame-precise feedback, and secure asset organization"
                width={1200}
                height={675}
                className="rounded-xl shadow-2xl border border-gray-800 object-cover w-full h-auto"
                priority
              />
            </Zoom>
            <div className="absolute top-0 left-0 w-full h-8 bg-[#13131a] border-b border-white/5 flex items-center px-4 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
            </div>
          </div>
        </div>
      </header>

      <section className="w-full max-w-7xl mx-auto px-6 py-20 lg:py-28">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-4">
            International Standards
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display text-white leading-tight mb-5">
            Global Localization & Distribution Mastering
          </h2>
          <p className="text-sm md:text-base text-text-gray font-light leading-relaxed">
            Production-ready asset packaging strictly compliant with international
            broadcast and OTT distributor standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <div className="group rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 md:p-8 transition-all duration-300 hover:border-gold-primary/30 hover:bg-white/[0.05] hover:shadow-[0_0_40px_rgba(212,175,55,0.06)]">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gold-primary/20 bg-gold-primary/10 text-gold-primary transition-colors group-hover:border-gold-primary/40 group-hover:bg-gold-primary/15">
              <Layers className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
              <span className="block text-white font-medium mb-2">
                Textless Mastering
              </span>
              Clean background plates and localized graphical assets ready for
              international dubbing.
            </p>
          </div>

          <div className="group rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 md:p-8 transition-all duration-300 hover:border-gold-primary/30 hover:bg-white/[0.05] hover:shadow-[0_0_40px_rgba(212,175,55,0.06)]">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gold-primary/20 bg-gold-primary/10 text-gold-primary transition-colors group-hover:border-gold-primary/40 group-hover:bg-gold-primary/15">
              <AudioWaveform
                className="h-6 w-6"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
              <span className="block text-white font-medium mb-2">
                Multi-Channel Audio
              </span>
              Precise M&E stem separation, 5.1/7.1 surround prep, and dialogue
              isolation.
            </p>
          </div>

          <div className="group rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 md:p-8 transition-all duration-300 hover:border-gold-primary/30 hover:bg-white/[0.05] hover:shadow-[0_0_40px_rgba(212,175,55,0.06)]">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gold-primary/20 bg-gold-primary/10 text-gold-primary transition-colors group-hover:border-gold-primary/40 group-hover:bg-gold-primary/15">
              <CheckCircle2
                className="h-6 w-6"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
              <span className="block text-white font-medium mb-2">
                Distributor Compliance
              </span>
              Strict adherence to global delivery specs, frame rates, and
              broadcast loudness standards.
            </p>
          </div>

          <div className="group rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 md:p-8 transition-all duration-300 hover:border-gold-primary/30 hover:bg-white/[0.05] hover:shadow-[0_0_40px_rgba(212,175,55,0.06)]">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gold-primary/20 bg-gold-primary/10 text-gold-primary transition-colors group-hover:border-gold-primary/40 group-hover:bg-gold-primary/15">
              <ShieldCheck
                className="h-6 w-6"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
              <span className="block text-white font-medium mb-2">
                Strict Confidentiality
              </span>
              Enterprise-grade data handling and strict NDA compliance for
              unreleased premium IPs.
            </p>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 border border-gold-primary/50 bg-gold-primary/5 px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-primary transition-all duration-300 hover:bg-gold-primary hover:text-black hover:shadow-[0_0_25px_rgba(212,175,55,0.25)]"
          >
            Explore Full Capabilities
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="w-full py-8 border-y border-gold-primary/15 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex justify-center gap-6 md:gap-16 flex-wrap text-[10px] sm:text-xs uppercase tracking-[0.2em] text-gold-primary/80 font-main font-bold text-center">
          <span className="relative after:content-['+'] after:absolute after:-right-4 md:after:-right-9 after:text-gold-primary/15 hidden sm:block">
            Led by 16+ Yrs Veteran Exp
          </span>
          <span className="sm:hidden block">16+ YRS LEADERSHIP</span>
          <span className="relative after:content-['+'] after:absolute after:-right-4 md:after:-right-9 after:text-gold-primary/15 hidden sm:block">
            Min 5 Yrs Broadcast Exp / Artist
          </span>
          <span className="sm:hidden block">5+ YRS EXP / ARTIST</span>
          <span className="relative after:content-['+'] after:absolute after:-right-4 md:after:-right-9 after:text-gold-primary/15 hidden sm:block">
            5-10 Experts Per Sector
          </span>
          <span className="sm:hidden block">DEDICATED TEAMS</span>
          <span>Zero QC Failures</span>
        </div>
      </div>

      <section id="workflow" className="w-full max-w-7xl mx-auto px-6 py-32 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 border-l-2 border-gold-primary pl-6">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-gold-primary block mb-4">
              Core Capabilities
            </span>
            <h2 className="text-4xl md:text-5xl font-display text-white leading-none">
              How We Solve It.
            </h2>
          </div>
        </div>

        <div className="flex flex-col gap-32">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <span className="text-[10px] uppercase tracking-widest text-gold-primary/60 border border-gold-primary/20 px-3 py-1 rounded-full mb-6 inline-block">
                Client Vault Integration
              </span>
              <h3 className="text-3xl font-display text-white mb-6">Seamless Project Management</h3>
              <p className="text-base text-text-gray leading-relaxed mb-6">
                Producers shouldn&apos;t have to chase editors for updates. Through our dedicated Client Access portal, you can track project status, access centralized assets, and monitor deliverables without endless email threads.
              </p>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex gap-3"><span className="text-gold-primary">Γ£ô</span> Real-time status updates</li>
                <li className="flex gap-3"><span className="text-gold-primary">Γ£ô</span> Centralized asset organization</li>
              </ul>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2 w-full">
              <Zoom zoomMargin={45}>
                <Image
                  src="/assets/rendorax-client-vault-portal.png"
                  alt="Rendorax Studio Client Vault Dashboard Mockup"
                  width={1200}
                  height={675}
                  className="w-full h-auto rounded-xl shadow-2xl border border-white/10 object-cover"
                />
              </Zoom>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2 w-full">
              <Zoom zoomMargin={45}>
                <Image
                  src="/assets/broadcast-ready-video-editing-timeline.png"
                  alt="Broadcast-Ready Production Timeline"
                  width={1200}
                  height={675}
                  className="w-full h-auto rounded-xl shadow-2xl border border-white/10 object-cover"
                />
              </Zoom>
            </div>
            <div className="lg:w-1/2">
              <span className="text-[10px] uppercase tracking-widest text-gold-primary/60 border border-gold-primary/20 px-3 py-1 rounded-full mb-6 inline-block">Zero QC Failures</span>
              <h3 className="text-3xl font-display text-white mb-6">Broadcast-Ready Delivery</h3>
              <p className="text-base text-text-gray leading-relaxed mb-6">
                Whether it&apos;s network television or high-end OTT streaming, our specialized teams guarantee technical perfection with strict picture lock protocols and flawless master generation.
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <span className="text-[10px] uppercase tracking-widest text-gold-primary/60 border border-gold-primary/20 px-3 py-1 rounded-full mb-6 inline-block">All-In-One Studio</span>
              <h3 className="text-3xl font-display text-white mb-6">Centralized Post-Production</h3>
              <p className="text-base text-text-gray leading-relaxed mb-6">
                Stop juggling multiple freelancers. Your entire post-pipeline is managed under one roof with dedicated departments for editing, sound, color, and motion graphics.
              </p>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2 w-full">
              <Zoom zoomMargin={45}>
                <Image
                  src="/assets/Centralize%20Dashboard.png"
                  alt="Centralized Post-Production Pipeline Manager Dashboard"
                  width={1200}
                  height={675}
                  className="w-full h-auto rounded-xl shadow-2xl border border-white/10 object-cover"
                />
              </Zoom>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2 w-full">
              <Zoom zoomMargin={45}>
                <Image
                  src="/assets/ai-automated-video-production-workflow.png"
                  alt="AI and Automation Node Workflow Dashboard"
                  width={1200}
                  height={675}
                  className="w-full h-auto rounded-xl shadow-2xl border border-white/10 object-cover"
                />
              </Zoom>
            </div>
            <div className="lg:w-1/2">
              <span className="text-[10px] uppercase tracking-widest text-gold-primary/60 border border-gold-primary/20 px-3 py-1 rounded-full mb-6 inline-block">Next-Gen Efficiency</span>
              <h3 className="text-3xl font-display text-white mb-6">AI & Automation Powered</h3>
              <p className="text-base text-text-gray leading-relaxed mb-6">
                We build custom ComfyUI, n8n, and Docker workflows to accelerate production pipelines without losing broadcast quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-32 bg-[#050505] border-y border-gold-primary/15 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] uppercase tracking-[0.2em] text-gold-primary block mb-4">Engagement Models</span>
            <h2 className="text-3xl md:text-5xl font-display text-white">Choose Your Production Scale.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-bg-panel border border-white/10 p-8 hover:border-gold-primary/40 transition-all flex flex-col">
              <h3 className="text-xl font-display text-white mb-2">Project-Based</h3>
              <p className="text-xs text-text-gray mb-8">For single documentaries, short films, or targeted campaigns.</p>
              <Link href="/contact" className="w-full text-center py-3 text-xs uppercase tracking-widest border border-white/20 hover:border-gold-primary hover:text-gold-primary transition-all mt-auto">Select Model</Link>
            </div>
            <div className="bg-gradient-to-b from-bg-panel to-[#1a1710] border border-gold-primary p-8 transform md:-translate-y-4 shadow-[0_0_30px_rgba(212,175,55,0.1)] flex flex-col">
              <h3 className="text-xl font-display text-white mb-2">Long-form Retainer</h3>
              <p className="text-xs text-text-gray mb-8">Monthly partnerships for OTT series and major YouTube channels.</p>
              <Link href="/contact" className="w-full text-center py-3 text-xs uppercase tracking-widest bg-gold-primary text-black hover:bg-white transition-all mt-auto">Partner With Us</Link>
            </div>
            <div className="bg-bg-panel border border-white/10 p-8 hover:border-gold-primary/40 transition-all flex flex-col">
              <h3 className="text-xl font-display text-white mb-2">Agency Backend</h3>
              <p className="text-xs text-text-gray mb-8">Exclusive post-production backend for established production houses.</p>
              <Link href="/contact" className="w-full text-center py-3 text-xs uppercase tracking-widest border border-white/20 hover:border-gold-primary hover:text-gold-primary transition-all mt-auto">Let&apos;s Discuss</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-32 md:py-40 text-center border-b border-gold-primary/15" style={{ background: "radial-gradient(circle, #0f0f0f 0%, #050505 100%)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-display text-[clamp(1.8rem,3vw,2.5rem)] italic leading-snug text-white">
            &quot;Guided by 16+ years of leadership, our teams of specialized broadcast veterans bring <span className="text-gold-primary">judgment</span>, <span className="text-gold-primary">discipline</span>, and respect for standards to every frame.&quot;
          </p>
        </div>
      </section>

      <section className="w-full py-32 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-display text-white mb-6">
            Ready to Scale Your Production?
          </h2>
          <p className="text-text-gray text-lg mb-12">
            If your project demands a dedicated team of broadcast experts and a secure workflow, let&apos;s talk strategy.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-transparent text-gold-primary px-10 py-4 text-[0.8rem] uppercase tracking-[0.15em] border border-gold-primary transition-all duration-400 hover:bg-gold-primary hover:text-black"
          >
            Book a Strategy Call
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
