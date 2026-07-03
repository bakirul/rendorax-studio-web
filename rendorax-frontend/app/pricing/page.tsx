import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-16 flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

        {/* Pulse Animation Added Here */}
        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-6 animate-pulse">
          Investment
        </span>
        <h1 className="text-5xl md:text-7xl font-display leading-[1.1] max-w-[800px] mb-8 text-white">
          Transparent{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-primary to-[#fff]">
            Rates.
          </span>
        </h1>
        <p className="text-sm md:text-base max-w-[600px] font-light leading-relaxed">
          We operate on clear, structured pricing models designed for serious
          productions. No hidden fees, just premium broadcast-grade execution.
        </p>
      </header>

      <section className="w-full max-w-7xl mx-auto px-6 pb-24 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Tier 1: Day Rate */}
          <div className="bg-bg-panel border border-white/5 p-10 hover:border-gold-primary/30 hover:-translate-y-2 transition-all duration-500 flex flex-col h-full group">
            <h3 className="text-xl font-display text-white mb-2 group-hover:text-gold-primary transition-colors">
              Editorial Day Rate
            </h3>
            <p className="text-sm text-text-gray mb-6">
              For short-term or ongoing post-production support.
            </p>
            <div className="text-3xl font-display text-gold-primary mb-8">
              Custom
              <span className="text-sm text-text-gray font-main"> / day</span>
            </div>
            <ul className="space-y-4 text-sm mb-10 flex-grow">
              <li className="flex items-start gap-3">
                <span className="text-gold-primary">✓</span> Dedicated Senior
                Editor
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold-primary">✓</span> Priority Revisions
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold-primary">✓</span> Same-Day Rough Cuts
              </li>
            </ul>
            <Link
              href="/contact"
              className="block text-center border border-white/20 text-white px-6 py-3 text-xs uppercase tracking-widest hover:border-gold-primary hover:text-gold-primary transition-colors"
            >
              Inquire Rate
            </Link>
          </div>

          {/* Tier 2: Project Based (Highlighted) */}
          <div className="bg-bg-panel border border-gold-primary p-10 relative flex flex-col transform lg:scale-105 shadow-[0_0_30px_rgba(212,175,55,0.15)] z-10 lg:h-[105%] h-full group">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gold-primary text-black text-[9px] font-bold uppercase tracking-widest px-4 py-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span>
              Most Common
            </div>
            <h3 className="text-2xl font-display text-white mb-2 mt-4">
              Project-Based
            </h3>
            <p className="text-sm text-text-gray mb-6">
              End-to-end post-production for commercials & docs.
            </p>
            <div className="text-4xl font-display text-gold-primary mb-8">
              Flat Fee
            </div>
            <ul className="space-y-4 text-sm mb-10 flex-grow text-white">
              <li className="flex items-start gap-3">
                <span className="text-gold-primary">✓</span> Offline to Online
                Edit
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold-primary">✓</span> Cinematic Color
                Grading
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold-primary">✓</span> LUFS Audio
                Mastering
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold-primary">✓</span> Secure Client Vault
                Access
              </li>
            </ul>
            <Link
              href="/contact"
              className="block text-center bg-gold-primary text-black px-6 py-4 text-xs font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]"
            >
              Get an Estimate
            </Link>
          </div>

          {/* Tier 3: Retainer */}
          <div className="bg-bg-panel border border-white/5 p-10 hover:border-gold-primary/30 hover:-translate-y-2 transition-all duration-500 flex flex-col h-full group">
            <h3 className="text-xl font-display text-white mb-2 group-hover:text-gold-primary transition-colors">
              Agency Retainer
            </h3>
            <p className="text-sm text-text-gray mb-6">
              For brands needing continuous monthly video output.
            </p>
            <div className="text-3xl font-display text-gold-primary mb-8">
              Contract
            </div>
            <ul className="space-y-4 text-sm mb-10 flex-grow">
              <li className="flex items-start gap-3">
                <span className="text-gold-primary">✓</span> Guaranteed Monthly
                Hours
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold-primary">✓</span> Automated AI
                Workflows
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold-primary">✓</span> White-label
                Delivery
              </li>
            </ul>
            <Link
              href="/contact"
              className="block text-center border border-white/20 text-white px-6 py-3 text-xs uppercase tracking-widest hover:border-gold-primary hover:text-gold-primary transition-colors"
            >
              Discuss Terms
            </Link>
          </div>
        </div>

        {/* Terms & Policies */}
        <div className="mt-20 border-t border-white/5 pt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-text-gray">
          <div className="hover:bg-white/[0.02] p-6 transition-colors border border-transparent hover:border-white/5 rounded-sm">
            <h4 className="text-white font-display mb-3 text-lg flex items-center gap-2">
              <span className="text-gold-primary">▹</span> Payment Terms
            </h4>
            <p className="leading-relaxed pl-5">
              A standard 50% advance is required to initiate any project and
              lock studio time. The remaining 50% is due upon final approval,
              prior to the release of high-resolution, watermark-free masters.
            </p>
          </div>
          <div className="hover:bg-white/[0.02] p-6 transition-colors border border-transparent hover:border-white/5 rounded-sm">
            <h4 className="text-white font-display mb-3 text-lg flex items-center gap-2">
              <span className="text-gold-primary">▹</span> Revision Policy
            </h4>
            <p className="leading-relaxed pl-5">
              All project-based quotes include two (2) rounds of consolidated
              revisions. Additional revisions beyond the agreed scope are billed
              at our standard hourly editorial rate.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
