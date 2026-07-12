import { notFound } from "next/navigation";
import type { ReactNode } from "react";

const portfolioMeta: Record<
  string,
  { title: string; metaDescription: string }
> = {
  "heroic-archives": {
    title: "The Heroic Archives",
    metaDescription:
      "Long-form historical documentaries with local AI archival restoration, frame upscaling, and LUFS-compliant mastering for premium YouTube delivery.",
  },
  "voiced-classics": {
    title: "Voiced Classics",
    metaDescription:
      "Classic narratives revived with AI dubbing, precise lip-sync, motion graphics, and strict timeline integration for cinematic YouTube storytelling.",
  },
  "rendorax-media-reel": {
    title: "Rendorax Broadcast Reel",
    metaDescription:
      "Broadcast showreel with unified color grading, frame-accurate editing, LUFS mastering, and a tight narrative arc for agency and network review.",
  },
  aurastream: {
    title: "AuraStream",
    metaDescription:
      "Movie streaming investor demo with high-fidelity prototype, Vercel deployment, and user-centric UI showcasing seamless video delivery architecture.",
  },
  rendoraxfit: {
    title: "RendoraxFit Platform",
    metaDescription:
      "RendoraxFit WordPress platform with Google Reader Revenue Manager, Wordfence security, and scalable monetization without disrupting premium UX.",
  },
  "pawprints-in-silence": {
    title: "PawPrints In Silence",
    metaDescription:
      "Dog training video pipeline with streamlined social editing and Amazon Associates integration—authority content with optimized passive revenue growth.",
  },
};

export function generateMetadata({ params }: { params: { slug: string } }) {
  const project = portfolioMeta[params.slug];

  if (!project) {
    notFound();
  }

  return {
    title: `${project.title} | Rendorax Portfolio`,
    description: project.metaDescription,
  };
}

export default function PortfolioDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
