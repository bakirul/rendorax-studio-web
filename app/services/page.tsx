import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function ServicesPage() {
  const services = [
    {
      title: "Broadcast Editing",
      desc: "Multi-camera synchronization, timeline architecture, and strict compliance for television.",
    },
    {
      title: "Animation & Dub",
      desc: "Precise frame-by-frame dialogue syncing, character lip-matching, and international localization.",
    },
    {
      title: "Audio Mastering",
      desc: "Broadcast-safe loudness tracking and strict LUFS-compliant mixing for all platforms.",
    },
    {
      title: "Color Grading",
      desc: "Advanced look development, skin-tone preservation, and Rec.709/HDR conversions.",
    },
    {
      title: "Motion & VFX",
      desc: "High-impact broadcast titles, dynamic lower-thirds, and clean plate design.",
    },
    {
      title: "Archival Restoration",
      desc: "Legacy footage digitizing, AI upscaling, tape denoise, and preservation workflows.",
    },
    {
      title: "Podcast Editing",
      desc: "Multi-microphone leveling, audio restoration, and premium cinematic podcast mastering.",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>
        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-6">
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
            <div
              key={index}
              className="bg-bg-panel p-10 border border-white/5 hover:border-gold-primary/50 transition-all duration-400"
            >
              <h3 className="text-2xl font-display text-white mb-4">
                {service.title}
              </h3>
              <p className="text-sm text-text-gray leading-relaxed">
                {service.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
