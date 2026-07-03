import Link from "next/link";
import Footer from "@/components/Footer";
import AffiliateApplicationForm from "@/components/affiliate/AffiliateApplicationForm";

export default function AffiliatePage() {
  return (
    <main className="min-h-screen bg-black text-text-white selection:bg-gold-primary selection:text-black flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gold-primary blur-[200px] opacity-5 -z-10 pointer-events-none"></div>

      <div className="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center relative z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-text-gray group-hover:text-gold-primary transition-colors text-xs uppercase tracking-widest">
            ← Back to HQ
          </span>
        </Link>
        <span className="text-[10px] uppercase tracking-widest text-gold-primary border border-gold-primary/20 px-3 py-1 font-mono">
          Strictly B2B Network
        </span>
      </div>

      <div className="w-full max-w-5xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start relative z-10">
        <div className="space-y-8">
          <div>
            <span className="text-gold-primary text-xs font-bold uppercase tracking-[0.3em] mb-3 block">
              Exclusive Partner Network
            </span>
            <h1 className="text-4xl md:text-5xl font-display leading-tight text-white">
              Apply for Access.
              <br />
              Earn Premium Rev-Share.
            </h1>
            <p className="text-text-gray text-sm mt-4 leading-relaxed">
              The Rendorax Partner Network is an invite-only program
              reserved for top-tier agency owners, independent producers, and
              elite B2B connectors. We hold our broadcast standards high, and
              our vetting process for partners reflects that exact commitment.
            </p>
          </div>

          <div className="space-y-4 border-t border-white/5 pt-6">
            <div className="flex gap-4">
              <div className="text-gold-primary font-mono text-sm shrink-0">
                01 /
              </div>
              <div>
                <h4 className="text-white text-sm uppercase tracking-wider font-semibold">
                  Authority Approval Required
                </h4>
                <p className="text-text-gray text-xs mt-1 leading-relaxed">
                  Access is not guaranteed. Every application is manually
                  reviewed by our HQ. You must demonstrate a proven track record
                  and an established network within the media, corporate, or
                  broadcast sectors.
                </p>
              </div>
            </div>

            <div className="flex gap-4 border-t border-white/5 pt-4">
              <div className="text-gold-primary font-mono text-sm shrink-0">
                02 /
              </div>
              <div>
                <h4 className="text-white text-sm uppercase tracking-wider font-semibold">
                  10% - 15% High-Ticket Commissions
                </h4>
                <p className="text-text-gray text-xs mt-1 leading-relaxed">
                  Once authorized, you earn a flat 10-15% commission on closed
                  deals. With our high-ticket cinematic and broadcast
                  post-production services, a single conversion yields
                  substantial returns.
                </p>
              </div>
            </div>

            <div className="flex gap-4 border-t border-white/5 pt-4">
              <div className="text-gold-primary font-mono text-sm shrink-0">
                03 /
              </div>
              <div>
                <h4 className="text-white text-sm uppercase tracking-wider font-semibold">
                  Zero Delivery Liability
                </h4>
                <p className="text-text-gray text-xs mt-1 leading-relaxed">
                  Your sole focus is bridging the connection. Our specialized
                  post-production roster handles all technical execution,
                  quality control, and final broadcast delivery.
                </p>
              </div>
            </div>
          </div>
        </div>

        <AffiliateApplicationForm />
      </div>

      <Footer />
    </main>
  );
}
