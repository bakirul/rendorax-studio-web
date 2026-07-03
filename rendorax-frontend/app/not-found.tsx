import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg-body text-white font-main px-6 selection:bg-gold-primary selection:text-black">
      <div className="text-center max-w-lg">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-primary mb-4">
          404 — Not Found
        </p>
        <h1 className="text-4xl md:text-6xl font-display leading-tight mb-6">
          This frame doesn&apos;t exist.
        </h1>
        <p className="text-text-gray text-sm md:text-base leading-relaxed mb-10">
          The page you&apos;re looking for may have been moved, removed, or never
          made it through post-production.
        </p>
        <Link
          href="/"
          className="inline-block bg-transparent text-gold-primary px-8 py-4 text-xs font-bold uppercase tracking-[0.15em] border border-gold-primary hover:bg-gold-primary hover:text-black transition-all"
        >
          Back to Studio
        </Link>
      </div>
    </main>
  );
}
