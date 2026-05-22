"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function Home() {
  const [loopKey, setLoopKey] = useState(0);

  // ১৪ সেকেন্ড পর পর পুরো অ্যানিমেশনটি কোনো জার্কিং ছাড়াই স্মুথলি রিসেট হবে
  useEffect(() => {
    const interval = setInterval(() => {
      setLoopKey((prev) => prev + 1);
    }, 14000); // 14s Loop Duration
    return () => clearInterval(interval);
  }, []);

  const heroText =
    "Film, animation, and television workflows shaped inside real broadcast environments.";
  const words = heroText.split(" ");

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      {/* 🌟 Custom Keyframes for Relaxed Cut-in & Smooth Zoom */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* শব্দগুলো কাট-কাট করে আসার অ্যানিমেশন */
          @keyframes wordCutIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          
          /* পুরো বাক্য আসার পর স্মুথ জুম এবং ফেইড-আউট অ্যানিমেশন */
          @keyframes containerZoom {
            0%, 35% { 
              transform: scale(1); 
              opacity: 1; 
              color: #9ca3af; /* text-gray */
            }
            50%, 85% { 
              transform: scale(1.05); /* Smooth, comfortable slight zoom */
              opacity: 1; 
              color: #ffffff; /* Slightly brighter when zoomed */
            }
            95%, 100% { 
              transform: scale(1.05); 
              opacity: 0; /* Smooth fade out before loop restarts */
            }
          }

          .word-cut {
            opacity: 0;
            animation: wordCutIn 0.01s forwards; 
          }

          .zoom-sequence {
            animation: containerZoom 14s ease-in-out forwards;
          }
        `,
        }}
      />

      {/* Navigation */}
      <Navbar />

      {/* 1. HERO SECTION */}
      <header className="relative w-full max-w-7xl mx-auto px-6 h-[85vh] min-h-[550px] flex flex-col justify-center items-center text-center">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-primary blur-[150px] opacity-5 -z-10 rounded-full pointer-events-none"></div>

        <h1 className="text-[clamp(3rem,7vw,5.5rem)] font-display leading-[1.1] max-w-[1000px] mb-6 bg-gradient-to-b from-white to-[#aaa] bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(255,255,255,0.05)]">
          Broadcast-Grade Post-Production, <br />
          <em
            className="not-italic text-gold-primary"
            style={{ WebkitTextFillColor: "#d4af37" }}
          >
            Built on Experience
          </em>
        </h1>

        {/* 🌟 Animated Sequence Section (Relaxed Cut-in + Smooth Zoom) */}
        <div className="h-[60px] flex items-center justify-center mb-14">
          <p
            key={loopKey}
            className="text-[1.2rem] max-w-[600px] font-light leading-relaxed flex flex-wrap justify-center zoom-sequence"
          >
            {words.map((word, i) => (
              <span
                key={i}
                className="inline-block word-cut"
                style={{ animationDelay: `${i * 0.4}s` }} // প্রতিটি শব্দ ০.৪ সেকেন্ড পর পর আসবে (চোখে আরাম লাগবে)
              >
                {word}&nbsp;
              </span>
            ))}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 items-center">
          <Link
            href="/contact"
            className="bg-transparent text-gold-primary px-10 py-4 text-[0.8rem] uppercase tracking-[0.15em] border border-gold-primary transition-all duration-400 hover:bg-gold-primary hover:text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]"
          >
            Start Project
          </Link>
          <Link
            href="/access"
            className="text-text-white text-[0.85rem] uppercase tracking-[0.1em] border-b border-transparent hover:text-gold-primary hover:border-gold-primary transition-all duration-400"
          >
            Client Access
          </Link>
        </div>
      </header>

      {/* 2. TRUST STRIP */}
      <div className="w-full py-8 border-y border-gold-primary/15 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex justify-center gap-6 md:gap-16 flex-wrap text-[10px] sm:text-xs uppercase tracking-[0.2em] text-gold-primary/80 font-main font-bold">
          <span className="relative after:content-['+'] after:absolute after:-right-4 md:after:-right-9 after:text-gold-primary/15 hidden sm:block">
            16+ Years Experience
          </span>
          <span className="sm:hidden block">16+ YRS EXP</span>

          <span className="relative after:content-['+'] after:absolute after:-right-4 md:after:-right-9 after:text-gold-primary/15 hidden sm:block">
            Senior Broadcast Editor
          </span>
          <span className="sm:hidden block">Senior Editor</span>

          <span className="relative after:content-['+'] after:absolute after:-right-4 md:after:-right-9 after:text-gold-primary/15 hidden sm:block">
            Animation & Dubbing
          </span>
          <span className="sm:hidden block">Animation</span>

          <span>Broadcast-Safe Delivery</span>
        </div>
      </div>

      {/* 3. SERVICES SECTION */}
      <section className="w-full max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-l-2 border-gold-primary pl-6">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-gold-primary block mb-4">
              Our Expertise
            </span>
            <h2 className="text-4xl md:text-5xl font-display text-white leading-none">
              Studio Services
            </h2>
          </div>
        </div>

        {/* 7 Grid Layout Structure */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Link
            href="/services/video-editing"
            className="group bg-bg-panel p-10 md:p-12 border border-white/5 hover:border-gold-primary/50 hover:-translate-y-2 transition-all duration-400 block bg-gradient-to-b hover:from-bg-panel hover:to-[#141414]"
          >
            <h3 className="text-2xl font-display text-white mb-5 group-hover:text-gold-primary transition-colors">
              Essential Editing
            </h3>
            <p className="text-sm text-text-gray leading-relaxed">
              Multi-camera synchronization, timeline architecture, and sharp
              narrative pacing built for high-end cinema and broadcast networks.
            </p>
          </Link>

          <Link
            href="/services/video-editing"
            className="group bg-bg-panel p-10 md:p-12 border border-white/5 hover:border-gold-primary/50 hover:-translate-y-2 transition-all duration-400 block bg-gradient-to-b hover:from-bg-panel hover:to-[#141414]"
          >
            <h3 className="text-2xl font-display text-white mb-5 group-hover:text-gold-primary transition-colors">
              Animation & Dub
            </h3>
            <p className="text-sm text-text-gray leading-relaxed">
              Precise frame-by-frame dialogue syncing, character lip-matching,
              continuity tracking, and international-ready localization masters.
            </p>
          </Link>

          <Link
            href="/services/audio-mastering"
            className="group bg-bg-panel p-10 md:p-12 border border-white/5 hover:border-gold-primary/50 hover:-translate-y-2 transition-all duration-400 block bg-gradient-to-b hover:from-bg-panel hover:to-[#141414]"
          >
            <h3 className="text-2xl font-display text-white mb-5 group-hover:text-gold-primary transition-colors">
              Audio Mastering
            </h3>
            <p className="text-sm text-text-gray leading-relaxed">
              Broadcast-safe loudness tracking, professional multi-channel sound
              design, dialogue clean-up, and strict LUFS-compliant mixing.
            </p>
          </Link>

          <Link
            href="/services/color-grading"
            className="group bg-bg-panel p-10 md:p-12 border border-white/5 hover:border-gold-primary/50 hover:-translate-y-2 transition-all duration-400 block bg-gradient-to-b hover:from-bg-panel hover:to-[#141414]"
          >
            <h3 className="text-2xl font-display text-white mb-5 group-hover:text-gold-primary transition-colors">
              Color Grading
            </h3>
            <p className="text-sm text-text-gray leading-relaxed">
              Advanced look development, precise color balancing, skin-tone
              preservation, and industry-standard Rec.709/HDR conversions.
            </p>
          </Link>

          <Link
            href="/services/motion-graphics"
            className="group bg-bg-panel p-10 md:p-12 border border-white/5 hover:border-gold-primary/50 hover:-translate-y-2 transition-all duration-400 block bg-gradient-to-b hover:from-bg-panel hover:to-[#141414]"
          >
            <h3 className="text-2xl font-display text-white mb-5 group-hover:text-gold-primary transition-colors">
              Motion & VFX
            </h3>
            <p className="text-sm text-text-gray leading-relaxed">
              High-impact broadcast titles, dynamic lower-thirds, clean plate
              design, advanced green screen compositing, and rotoscoping.
            </p>
          </Link>

          <Link
            href="/services/restoration"
            className="group bg-bg-panel p-10 md:p-12 border border-white/5 hover:border-gold-primary/50 hover:-translate-y-2 transition-all duration-400 block bg-gradient-to-b hover:from-bg-panel hover:to-[#141414]"
          >
            <h3 className="text-2xl font-display text-white mb-5 group-hover:text-gold-primary transition-colors">
              Archival Restoration
            </h3>
            <p className="text-sm text-text-gray leading-relaxed">
              Legacy footage digitizing optimization, intelligent AI upscaling,
              tape denoise, artifact removal, and preservation workflows.
            </p>
          </Link>

          <Link
            href="/podcast"
            className="group bg-bg-panel p-10 md:p-12 border border-white/5 hover:border-gold-primary/50 hover:-translate-y-2 transition-all duration-400 block bg-gradient-to-b hover:from-bg-panel hover:to-[#141414] lg:col-start-2"
          >
            <h3 className="text-2xl font-display text-white mb-5 group-hover:text-gold-primary transition-colors">
              Podcast Editing
            </h3>
            <p className="text-sm text-text-gray leading-relaxed">
              Multi-microphone voice leveling, advanced breath & filler word
              removal, audio restoration, and premium mastering for cinematic
              video podcasts.
            </p>
          </Link>
        </div>
      </section>

      {/* 4. EXPERIENCE STATEMENT */}
      <section
        className="w-full py-32 md:py-40 text-center border-y border-gold-primary/15"
        style={{
          background: "radial-gradient(circle, #0f0f0f 0%, #050505 100%)",
        }}
      >
        <div className="max-w-4xl mx-auto px-6">
          <p className="font-display text-[clamp(1.8rem,4vw,2.8rem)] italic leading-snug text-white">
            "Long-term work inside broadcast television builds more than
            technical skill — it builds{" "}
            <span className="text-gold-primary">judgment</span>,{" "}
            <span className="text-gold-primary">discipline</span>, and respect
            for standards."
          </p>
        </div>
      </section>

      {/* 5. PROCESS LIST */}
      <section className="w-full max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-l-2 border-gold-primary pl-6">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-gold-primary block mb-4">
              Workflow
            </span>
            <h2 className="text-4xl md:text-5xl font-display text-white leading-none">
              The Process
            </h2>
          </div>
        </div>

        <ul className="max-w-4xl mx-auto">
          <li className="flex gap-6 md:gap-10 items-baseline py-10 border-b border-white/10 hover:pl-5 transition-all duration-300">
            <span className="font-display text-2xl md:text-3xl text-gold-primary/50">
              01
            </span>
            <span className="text-xl md:text-2xl text-white font-light">
              Understanding format, audience, and delivery requirements.
            </span>
          </li>
          <li className="flex gap-6 md:gap-10 items-baseline py-10 border-b border-white/10 hover:pl-5 transition-all duration-300">
            <span className="font-display text-2xl md:text-3xl text-gold-primary/50">
              02
            </span>
            <span className="text-xl md:text-2xl text-white font-light">
              Editorial decisions shaped by strict broadcast timelines.
            </span>
          </li>
          <li className="flex gap-6 md:gap-10 items-baseline py-10 border-b border-white/10 hover:pl-5 transition-all duration-300">
            <span className="font-display text-2xl md:text-3xl text-gold-primary/50">
              03
            </span>
            <span className="text-xl md:text-2xl text-white font-light">
              Structured mastering for multi-platform distribution.
            </span>
          </li>
        </ul>
      </section>

      {/* 5.5 CLIENT TESTIMONIALS & TRUSTPILOT */}
      <section className="w-full py-32 bg-black/40 border-y border-white/5 relative overflow-hidden">
        {/* Subtle Background Glow */}
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

            {/* Trustpilot Badge */}
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

          {/* Testimonial Grid */}
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
                  "Kachna Media saved our broadcast deadline. Their mastery over
                  LUFS audio compliance and textless master delivery is
                  unmatched. Finding an editor who understands the strict pacing
                  required for network television is incredibly rare."
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
                  reviewing daily cuts incredibly smooth. H M Bakirul Islam and
                  his team delivered flawlessly across our entire 26-episode
                  animation series."
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

      {/* 6. FINAL CTA */}
      <section className="w-full py-32 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-display text-white mb-6">
            Reliability is a Choice.
          </h2>
          <p className="text-text-gray text-lg mb-12">
            If your project demands senior editorial judgment, we should talk.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-transparent text-gold-primary px-10 py-4 text-[0.8rem] uppercase tracking-[0.15em] border border-gold-primary transition-all duration-400 hover:bg-gold-primary hover:text-black"
          >
            Discuss Your Project
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
