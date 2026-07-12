import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services | Rendorax Studio",
  description:
    "Broadcast editing, OTT drama, corporate video, dubbing, audio mastering, color grading, VFX, restoration, and podcast post-production.",
};

export default function ServicesPage() {
  const services = [
    {
      title: "Broadcast Editing",
      desc: "Multi-camera synchronization, timeline architecture, and strict compliance for television.",
      href: "/services/broadcast-editing",
    },
    {
      title: "Webseries / Drama Editing",
      desc: "Multi-episode narrative structuring, emotional pacing, dialogue editing, and continuity management tailored for OTT platforms.",
      href: "/services/web-series-drama",
    },
    {
      title: "Corporate / Commercial Video Editing",
      desc: "High-end corporate profiles, dynamic brand commercials, and social campaigns optimized for maximum engagement.",
      href: "/services/corporate-commercial",
    },
    {
      title: "Animation & Dub",
      desc: "Precise frame-by-frame dialogue syncing, character lip-matching, and international localization.",
      href: "/services/animation-dub",
    },
    {
      title: "Audio Mastering",
      desc: "Broadcast-safe loudness tracking and strict LUFS-compliant mixing for all platforms.",
      href: "/services/audio-mastering",
    },
    {
      title: "Color Grading",
      desc: "Advanced look development, skin-tone preservation, and Rec.709/HDR conversions.",
      href: "/services/color-grading",
    },
    {
      title: "Motion & VFX",
      desc: "High-impact broadcast titles, dynamic lower-thirds, and clean plate design.",
      href: "/services/motion-vfx",
    },
    {
      title: "Archival Restoration",
      desc: "Legacy footage digitizing, AI upscaling, tape denoise, and preservation workflows.",
      href: "/services/archival-restoration",
    },
    {
      title: "Podcast Editing",
      desc: "Multi-microphone leveling, audio restoration, and premium cinematic podcast mastering.",
      href: "/services/podcast-editing",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>
        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-6 animate-pulse">
          Our Capabilities
        </span>
        <h1 className="text-5xl md:text-7xl font-display leading-[1.1] max-w-[800px] mb-8 text-white">
          Post-Production <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-primary to-[#fff]">
            Disciplines.
          </span>
        </h1>
        <p className="text-sm md:text-base max-w-[600px] font-light leading-relaxed">
          Comprehensive post-production workflows engineered for broadcast
          networks, digital agencies, and independent filmmakers.
        </p>
      </header>

      <section className="w-full max-w-7xl mx-auto px-6 pb-32 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Link
              key={index}
              href={service.href}
              className="group flex flex-col bg-bg-panel p-10 border border-white/5 hover:border-gold-primary/50 transition-all duration-400 cursor-pointer"
            >
              <h3 className="text-2xl font-display text-white mb-4">
                {service.title}
              </h3>
              <p className="text-sm text-text-gray leading-relaxed flex-grow mb-8">
                {service.desc}
              </p>

              <div className="flex items-center text-[10px] text-gold-primary uppercase tracking-[0.2em] font-bold opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                Explore Service
                <span className="ml-2 transform transition-transform duration-300 group-hover:translate-x-2">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
