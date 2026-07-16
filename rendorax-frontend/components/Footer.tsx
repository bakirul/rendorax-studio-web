import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-black border-t border-white/5 py-12 mt-20 relative z-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Left Side: Brand & Copyright */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-gold-primary flex items-center justify-center">
              <span className="text-gold-primary text-[10px] font-display font-bold" aria-hidden="true">
                R
              </span>
            </div>
            <span className="text-sm font-display tracking-widest uppercase text-white">
              Rendorax
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-text-gray mt-1">
            © {new Date().getFullYear()} Rendorax Limited. All rights
            reserved.
          </p>
        </div>

        {/* Center Side: Public & Legal Links */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-[11px] uppercase tracking-[0.2em] font-medium">
          <Link
            href="/guide"
            className="text-text-gray hover:text-gold-primary transition-colors"
          >
            Guide
          </Link>
          <Link
            href="/career"
            className="text-text-gray hover:text-gold-primary transition-colors"
          >
            Career
          </Link>
          <Link
            href="/affiliate"
            className="text-text-gray hover:text-gold-primary transition-colors"
          >
            Affiliate
          </Link>
          <Link
            href="/terms"
            className="text-text-gray hover:text-gold-primary transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/refund"
            className="text-text-gray hover:text-gold-primary transition-colors"
          >
            Refund
          </Link>
          <Link
            href="/privacy"
            className="text-text-gray hover:text-gold-primary transition-colors"
          >
            Privacy
          </Link>
        </div>

        {/* Right Side: Location */}
        <div className="text-right text-[10px] uppercase tracking-widest text-text-gray hidden md:block">
          <p className="font-mono">Dhaka, Bangladesh</p>
        </div>
      </div>
    </footer>
  );
}
