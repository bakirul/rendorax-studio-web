"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CareerPage() {
  const openings = [
    {
      id: 1,
      role: "Senior Video Editor",
      type: "Full-Time / Dhaka Studio",
      dept: "Broadcast & Documentaries",
      desc: "We are seeking an editor with absolute mastery over pacing, multichannel audio structure, and strict broadcast timeline compliance. Experience in handling long-form cinematic formats is highly prioritized.",
      formLink: "", // <-- ফর্ম বানানোর পর আসল লিংকটি এখানে ইনভার্টেড কমার ভেতরে বসাবেন
    },
    {
      id: 2,
      role: "Sound Designer & Audio Mixer",
      type: "Contract / Remote Friendly",
      dept: "Audio Mastering",
      desc: "Expertise in broadcast-safe loudness tracking, dialogue cleaning, and strict LUFS-compliant mixing (-23 LUFS target). Must know how to survive rigorous network compliance checks.",
      formLink: "", // <-- ফর্ম বানানোর পর আসল লিংকটি এখানে ইনভার্টেড কমার ভেতরে বসাবেন
    },
  ];

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      {/* 1. HERO SECTION */}
      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-6">
          Join the Collective
        </span>
        <h1 className="text-5xl md:text-7xl font-display leading-[1.1] max-w-[900px] mb-8 text-white">
          Cultivating{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-primary to-[#fff]">
            Judgment & Discipline.
          </span>
        </h1>
        <p className="text-sm md:text-base max-w-[650px] font-light text-text-gray leading-relaxed">
          At Kachna Media, we don't just cut video—we respect broadcast
          standards, embrace technical optimization, and master advanced
          automated workflows. If you possess raw discipline, we want you in our
          bays.
        </p>
      </header>

      {/* 2. THE STUDIO PHILOSOPHY */}
      <section className="w-full max-w-5xl mx-auto px-6 mb-24 border-y border-white/5 py-16 text-center bg-black/30">
        <p className="font-display text-xl md:text-2xl italic text-white max-w-3xl mx-auto leading-relaxed">
          "Long-term work in this industry builds more than technical muscle—it
          builds a deep respect for format architectures. We look for talent
          that values execution over shortcuts."
        </p>
      </section>

      {/* 3. OPEN POSITIONS LIST */}
      <section className="w-full max-w-4xl mx-auto px-6 pb-32 flex-grow">
        <h3 className="text-xs uppercase tracking-widest text-gold-primary mb-12 border-b border-white/10 pb-4">
          Open Enlistments
        </h3>

        <div className="space-y-8">
          {openings.map((job) => (
            <div
              key={job.id}
              className="bg-bg-panel border border-white/5 p-8 md:p-10 hover:border-gold-primary/30 transition-all group relative"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gold-primary/60 block mb-1">
                    {job.dept}
                  </span>
                  <h4 className="text-2xl font-display text-white group-hover:text-gold-primary transition-colors">
                    {job.role}
                  </h4>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-text-gray/50 border border-white/10 px-3 py-1 bg-black">
                  {job.type}
                </span>
              </div>

              <p className="text-sm text-text-gray font-light leading-relaxed mb-6 max-w-3xl">
                {job.desc}
              </p>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                {/* Smart Link Integration */}
                <a
                  href={job.formLink || "#"}
                  target={job.formLink ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!job.formLink) {
                      e.preventDefault();
                      alert(
                        "The application form is not linked yet. Please check back later or email us directly!",
                      );
                    }
                  }}
                  className="bg-transparent text-white text-xs uppercase tracking-widest border border-white/20 px-6 py-3 hover:bg-gold-primary hover:text-black hover:border-gold-primary transition-all font-bold flex items-center gap-2"
                >
                  Apply via Form <span>↗</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {openings.length === 0 && (
          <div className="text-center py-20 text-text-gray text-sm uppercase tracking-widest font-mono">
            All bays are currently full. Follow our journal for future
            enlistments.
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
