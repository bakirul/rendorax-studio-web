"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function Home() {
  const [loopKey, setLoopKey] = useState(0);

  // ১৪ সেকেন্ড পর পর অ্যানিমেশন রিসেট
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
      {/* 🌟 Custom Keyframes */}
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
        `,
        }}
      />

      {/* Navigation */}
      <Navbar />

      {/* 1. HERO SECTION (Frame.io Layout with Original Buttons) */}
      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-20 lg:pt-48 lg:pb-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-8 overflow-visible">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

        {/* Left Content Area */}
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

          {/* Original Buttons Kept Exact Same */}
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

        {/* Right Dashboard Mockup Area (3D Perspective) */}
        <div className="w-full lg:w-1/2 relative mt-12 lg:mt-0 z-10 lg:perspective-[1200px]">
          {/* Subtle glow behind the image */}
          <div className="absolute inset-0 bg-gold-primary/20 blur-[100px] rounded-full scale-75"></div>

          {/* 3D Rotated Image Container */}
          <div
            className="relative w-full rounded-xl border border-white/10 shadow-2xl bg-[#0e0e12] overflow-hidden transform transition-transform duration-700 hover:rotate-y-0 hover:rotate-x-0 hero-dashboard-mockup"
          >
            <img
              src="/dashboard-mockup.png"
              alt="Kachna Media Dashboard"
              className="w-full h-auto object-cover opacity-90"
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?auto=format&fit=crop&w=1200&q=80";
              }}
            />

            {/* Fake Dashboard UI Overlay */}
            <div className="absolute top-0 left-0 w-full h-8 bg-[#13131a] border-b border-white/5 flex items-center px-4 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. TEAM & DATA-DRIVEN TRUST STRIP */}
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

      {/* 3. THE WORKFLOW SOLUTION */}
      <section
        id="workflow"
        className="w-full max-w-7xl mx-auto px-6 py-32 overflow-hidden"
      >
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
          {/* Feature 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <span className="text-[10px] uppercase tracking-widest text-gold-primary/60 border border-gold-primary/20 px-3 py-1 rounded-full mb-6 inline-block">
                Client Vault Integration
              </span>
              <h3 className="text-3xl font-display text-white mb-6">
                Seamless Project Management
              </h3>
              <p className="text-base text-text-gray leading-relaxed mb-6">
                Producers shouldn't have to chase editors for updates. Through
                our dedicated Client Access portal, you can track project
                status, access centralized assets, and monitor deliverables
                without endless email threads.
              </p>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> Real-time status
                  updates
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> Centralized asset
                  organization
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2 w-full aspect-video bg-[#0a0a0a] border border-white/10 rounded-lg relative overflow-hidden group shadow-[0_0_50px_rgba(255,255,255,0.03)] hover:shadow-[0_0_50px_rgba(212,175,55,0.1)] transition-all">
              <img
                src="/project-management.gif"
                alt="Project Management Dashboard Demo"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2 w-full aspect-video bg-[#0a0a0a] border border-white/10 rounded-lg relative overflow-hidden group shadow-[0_0_50px_rgba(255,255,255,0.03)] hover:shadow-[0_0_50px_rgba(212,175,55,0.1)] transition-all">
              <img
                src="/broadcast-delivery.gif"
                alt="Broadcast Delivery Timeline Demo"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="lg:w-1/2">
              <span className="text-[10px] uppercase tracking-widest text-gold-primary/60 border border-gold-primary/20 px-3 py-1 rounded-full mb-6 inline-block">
                Zero QC Failures
              </span>
              <h3 className="text-3xl font-display text-white mb-6">
                Broadcast-Ready Delivery
              </h3>
              <p className="text-base text-text-gray leading-relaxed mb-6">
                Whether it's network television or high-end OTT streaming, our
                specialized teams guarantee technical perfection. We employ
                strict picture lock protocols, precise LUFS audio metering, and
                flawless textless master generation.
              </p>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> Stict LUFS audio
                  compliance
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> Rec.709/HDR color
                  safe limits
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <span className="text-[10px] uppercase tracking-widest text-gold-primary/60 border border-gold-primary/20 px-3 py-1 rounded-full mb-6 inline-block">
                All-In-One Studio
              </span>
              <h3 className="text-3xl font-display text-white mb-6">
                Centralized Post-Production
              </h3>
              <p className="text-base text-text-gray leading-relaxed mb-6">
                Stop juggling multiple freelancers. With dedicated departments
                featuring 5-10 experts in video editing, multi-channel sound
                design, color grading, and dynamic motion graphics—your entire
                post-pipeline is managed under one roof.
              </p>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> Seamless
                  department hand-offs
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> Unified creative
                  direction
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2 w-full aspect-video bg-[#0a0a0a] border border-white/10 rounded-lg relative overflow-hidden group shadow-[0_0_50px_rgba(255,255,255,0.03)] hover:shadow-[0_0_50px_rgba(212,175,55,0.1)] transition-all">
              <img
                src="/centralized-post.gif"
                alt="Multi-department workflow demo"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2 w-full aspect-video bg-[#0a0a0a] border border-white/10 rounded-lg relative overflow-hidden group shadow-[0_0_50px_rgba(255,255,255,0.03)] hover:shadow-[0_0_50px_rgba(212,175,55,0.1)] transition-all">
              <img
                src="/automation-ai.gif"
                alt="AI Automation nodes demo"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="lg:w-1/2">
              <span className="text-[10px] uppercase tracking-widest text-gold-primary/60 border border-gold-primary/20 px-3 py-1 rounded-full mb-6 inline-block">
                Next-Gen Efficiency
              </span>
              <h3 className="text-3xl font-display text-white mb-6">
                AI & Automation Powered
              </h3>
              <p className="text-base text-text-gray leading-relaxed mb-6">
                We build custom ComfyUI, n8n, and Docker workflows to accelerate
                production pipelines. From intelligent archival restoration to
                automated content structuring, we scale speed without losing
                broadcast quality.
              </p>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> Custom rendering
                  node pipelines
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> AI-assisted
                  archival restoration
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ENGAGEMENT MODELS */}
      <section className="w-full py-32 bg-[#050505] border-y border-gold-primary/15 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] uppercase tracking-[0.2em] text-gold-primary block mb-4">
              Engagement Models
            </span>
            <h2 className="text-3xl md:text-5xl font-display text-white">
              Choose Your Production Scale.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1 */}
            <div className="bg-bg-panel border border-white/10 p-8 hover:border-gold-primary/40 transition-all flex flex-col">
              <h3 className="text-xl font-display text-white mb-2">
                Project-Based
              </h3>
              <p className="text-xs text-text-gray mb-8">
                For single documentaries, short films, or targeted campaigns.
              </p>
              <ul className="space-y-4 mb-10 flex-grow text-sm text-white/80">
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> Expert Artist
                  Assigned
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> Standard 2
                  Revision Rounds
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> Broadcast-Safe
                  Delivery
                </li>
              </ul>
              <Link
                href="/contact"
                className="w-full text-center py-3 text-xs uppercase tracking-widest border border-white/20 hover:border-gold-primary hover:text-gold-primary transition-all"
              >
                Select Model
              </Link>
            </div>

            {/* Tier 2 */}
            <div className="bg-gradient-to-b from-bg-panel to-[#1a1710] border border-gold-primary p-8 transform md:-translate-y-4 shadow-[0_0_30px_rgba(212,175,55,0.1)] flex flex-col relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gold-primary text-black text-[9px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-display text-white mb-2">
                Long-form Retainer
              </h3>
              <p className="text-xs text-text-gray mb-8">
                Monthly partnerships for OTT series and major YouTube channels.
              </p>
              <ul className="space-y-4 mb-10 flex-grow text-sm text-white/80">
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> Dedicated
                  Department Focus
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> Priority Batch
                  Processing
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> Automated
                  Pipeline Integration
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> Frame-Accurate
                  Sync Reviews
                </li>
              </ul>
              <Link
                href="/contact"
                className="w-full text-center py-3 text-xs uppercase tracking-widest bg-gold-primary text-black hover:bg-white transition-all"
              >
                Partner With Us
              </Link>
            </div>

            {/* Tier 3 */}
            <div className="bg-bg-panel border border-white/10 p-8 hover:border-gold-primary/40 transition-all flex flex-col">
              <h3 className="text-xl font-display text-white mb-2">
                Agency Backend
              </h3>
              <p className="text-xs text-text-gray mb-8">
                Exclusive post-production backend for established production
                houses.
              </p>
              <ul className="space-y-4 mb-10 flex-grow text-sm text-white/80">
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> Full Team
                  Deployment
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> White-label
                  Services
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-primary">✓</span> API & System
                  Integrations
                </li>
              </ul>
              <Link
                href="/contact"
                className="w-full text-center py-3 text-xs uppercase tracking-widest border border-white/20 hover:border-gold-primary hover:text-gold-primary transition-all"
              >
                Let's Discuss
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TEAM EXPERIENCE STATEMENT */}
      <section
        className="w-full py-32 md:py-40 text-center border-b border-gold-primary/15"
        style={{
          background: "radial-gradient(circle, #0f0f0f 0%, #050505 100%)",
        }}
      >
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-display text-[clamp(1.8rem,3vw,2.5rem)] italic leading-snug text-white">
            "Guided by 16+ years of leadership, our teams of specialized
            broadcast veterans bring{" "}
            <span className="text-gold-primary">judgment</span>,{" "}
            <span className="text-gold-primary">discipline</span>, and respect
            for standards to every frame."
          </p>
        </div>
      </section>

      {/* 6. SOCIAL PROOF (Testimonials & Trustpilot) */}
      <section className="w-full py-32 bg-black/40 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-gold-primary blur-[150px] opacity-5 -z-10 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-l-2 border-gold-primary pl-6">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-gold-primary block mb-4">
                Social Proof
              </span>
              <h2 className="text-4xl md:text-5xl font-display text-white leading-none">
                Industry Trust.
              </h2>
            </div>

            <div className="mt-8 md:mt-0 flex flex-col items-start md:items-end">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className="w-6 h-6 bg-[#00b67a] flex items-center justify-center"
                  >
                    <span className="text-white text-sm">★</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-gray font-mono uppercase tracking-widest">
                Rated <span className="text-white font-bold">4.9/5</span> on
                Trustpilot
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative aspect-[4/5] md:aspect-auto md:h-full bg-black border border-white/5 overflow-hidden group cursor-pointer hover:border-gold-primary/50 transition-all duration-500 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop"
                alt="Client Video Testimonial"
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-16 h-16 rounded-full bg-gold-primary/90 text-black flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-20">
                <div className="flex gap-1 text-gold-primary mb-3 text-xs">
                  ★★★★★
                </div>
                <p className="text-white text-sm font-display italic mb-4 leading-snug">
                  "The most secure and technically precise edit bay we've ever
                  worked with."
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80"
                    alt="Marcus T."
                    className="w-10 h-10 rounded-full border border-gold-primary/30 object-cover"
                  />
                  <div>
                    <h4 className="text-white text-xs font-bold uppercase tracking-wider">
                      Marcus T.
                    </h4>
                    <p className="text-[9px] text-text-gray uppercase tracking-widest">
                      Agency Head, NYC
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bg-panel p-8 border border-white/5 hover:border-gold-primary/30 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-gold-primary mb-6 text-sm">
                  ★★★★★
                </div>
                <p className="text-sm text-text-gray leading-relaxed mb-8 italic">
                  "Kachna Media's team saved our broadcast deadline. Their
                  mastery over LUFS audio compliance and textless master
                  delivery is unmatched. Finding a team that understands the
                  strict pacing required for network television is incredibly
                  rare."
                </p>
              </div>
              <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop"
                  alt="Sarah Jenkins"
                  className="w-12 h-12 rounded-full border border-white/10 object-cover filter grayscale hover:grayscale-0 transition-all"
                />
                <div>
                  <h4 className="text-white text-sm font-bold uppercase tracking-wider">
                    Sarah Jenkins
                  </h4>
                  <p className="text-[10px] text-text-gray uppercase tracking-widest">
                    Executive Producer
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-bg-panel p-8 border border-white/5 hover:border-gold-primary/30 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-gold-primary mb-6 text-sm">
                  ★★★★★
                </div>
                <p className="text-sm text-text-gray leading-relaxed mb-8 italic">
                  "Their secure Client Vault and automated AI pipelines made
                  reviewing daily cuts incredibly smooth. The entire department
                  delivered flawlessly across our 26-episode animation series."
                </p>
              </div>
              <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                <img
                  src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1974&auto=format&fit=crop"
                  alt="David R."
                  className="w-12 h-12 rounded-full border border-white/10 object-cover filter grayscale hover:grayscale-0 transition-all"
                />
                <div>
                  <h4 className="text-white text-sm font-bold uppercase tracking-wider">
                    David R.
                  </h4>
                  <p className="text-[10px] text-text-gray uppercase tracking-widest">
                    Animation Director
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="w-full py-32 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-display text-white mb-6">
            Ready to Scale Your Production?
          </h2>
          <p className="text-text-gray text-lg mb-12">
            If your project demands a dedicated team of broadcast experts and a
            secure workflow, let's talk strategy.
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
