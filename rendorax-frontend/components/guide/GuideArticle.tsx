import Link from "next/link";
import type { ReactNode } from "react";

type GuideArticleProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  nextHref?: string;
  nextLabel?: string;
};

export default function GuideArticle({
  eyebrow,
  title,
  description,
  children,
  nextHref,
  nextLabel,
}: GuideArticleProps) {
  return (
    <article>
      <header className="mb-10">
        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-4">
          {eyebrow}
        </span>
        <h1 className="text-3xl md:text-4xl font-display text-white leading-tight mb-4">
          {title}
        </h1>
        <p className="text-sm md:text-base text-text-gray font-light leading-relaxed max-w-2xl">
          {description}
        </p>
      </header>

      <div className="space-y-8 text-sm md:text-[15px] text-text-gray leading-relaxed">
        {children}
      </div>

      {nextHref && nextLabel ? (
        <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center gap-4">
          <Link
            href="/guide"
            className="text-[11px] uppercase tracking-[0.2em] text-text-gray hover:text-gold-primary transition-colors"
          >
            Guide Center
          </Link>
          <Link
            href={nextHref}
            className="text-[11px] uppercase tracking-[0.2em] text-gold-primary hover:text-white transition-colors"
          >
            Next: {nextLabel} →
          </Link>
        </div>
      ) : null}
    </article>
  );
}

export function GuideSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-3 list-none counter-reset">
      {steps.map((step, index) => (
        <li
          key={step}
          className="flex gap-3 items-start bg-[#121418] border border-white/5 px-4 py-3"
        >
          <span className="font-mono text-[10px] text-gold-primary shrink-0 mt-0.5">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-white/90">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function GuideNote({ children }: { children: ReactNode }) {
  return (
    <aside className="border border-gold-primary/25 bg-gold-primary/5 px-4 py-3 text-sm text-gray-300">
      {children}
    </aside>
  );
}
