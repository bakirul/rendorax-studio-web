"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";

// সম্পূর্ণ সার্ভিসের ডাইনামিক ডেটাবেস (mediaUrl যুক্ত করা হয়েছে)
const serviceData = {
  "broadcast-editing": {
    title: "Broadcast Editing",
    subtitle: "Precision timeline architecture for television & digital.",
    content:
      "Built on over 16 years of hands-on experience in high-pressure broadcast television environments. We don't just cut footage; we build robust timeline architectures. From multi-camera synchronization to adhering to strict network delivery compliance, every sequence is engineered for flawless broadcast execution.",
    features: [
      "Multi-Camera Synchronization",
      "Strict Network Delivery Compliance",
      "Offline to Online Workflows",
      "Live Action Co-ordination integration",
    ],
    mediaUrl: "/assets/broadcast-ready-video-editing-timeline.png",
  },
  "web-series-drama": {
    title: "Web-Series & Drama Editing",
    subtitle: "Narrative structuring and emotional pacing for OTT platforms.",
    content:
      "Multi-episode narrative structuring, emotional pacing, dialogue editing, and continuity management tailored for OTT platforms and serial dramas. We ensure character arcs and story loops are flawlessly maintained across the entire season for maximum viewer retention.",
    features: [
      "Multi-Episode Structuring",
      "Emotional Pacing & Dialogue",
      "Continuity Management",
      "OTT Platform Compliance",
    ],
    mediaUrl: "/assets/rendorax-broadcast-post-production-studio.png",
  },
  "corporate-commercial": {
    title: "Corporate & Commercial Video Editing",
    subtitle: "High-end brand storytelling and dynamic campaigns.",
    content:
      "High-end corporate profiles, dynamic brand commercials, and social campaigns optimized for maximum engagement and brand consistency. We deliver polished, agency-level edits that align perfectly with your corporate identity and marketing goals.",
    features: [
      "Dynamic Brand Commercials",
      "Corporate Profiles & Interviews",
      "Social Media Campaigns",
      "Brand Consistency & Guidelines",
    ],
    mediaUrl: "/assets/Linkedin%20Banner%201.png",
  },
  "animation-dub": {
    title: "Animation & Dub",
    subtitle: "Flawless character localization and sync.",
    content:
      "Audio and visual alignment requires microscopic precision. Our dubbing workflows ensure frame-by-frame dialogue syncing and accurate character lip-matching, providing a seamless viewing experience for international localization and premium animated content.",
    features: [
      "Frame-by-Frame Dialogue Sync",
      "Character Lip-Matching",
      "International Localization",
      "M&E Track Integration",
    ],
    mediaUrl: "/assets/ai-automated-video-production-workflow.png",
  },
  "audio-mastering": {
    title: "Audio Mastering",
    subtitle: "Broadcast-safe soundscapes for every platform.",
    content:
      "Audio clipping or phase issues can ruin a masterpiece. We implement strict LUFS-compliant mixing and broadcast-safe loudness tracking. Whether it's for an OTT platform, traditional television, or digital release, your mix will translate perfectly with pristine clarity and dynamic range.",
    features: [
      "Strict LUFS Compliance",
      "Broadcast-Safe Loudness Tracking",
      "Noise Reduction & Dialogue Isolation",
      "Multi-Stem Deliverables",
    ],
    mediaUrl: "/assets/Visual%20diagram%20(Master%20Export%20Workflow%20graphic).png",
  },
  "color-grading": {
    title: "Color Grading",
    subtitle: "Cinematic look development and visual consistency.",
    content:
      "Transform flat footage into visual poetry. Our color pipelines are built on advanced look development, ensuring precise skin-tone preservation and perfect shot-to-shot matching. We handle complex Rec.709 and HDR conversions for premium digital and television distribution.",
    features: [
      "Advanced Look Development",
      "Skin-Tone Preservation",
      "Rec.709 & HDR Conversions",
      "Shot-to-Shot Matching",
    ],
    mediaUrl: "/assets/rendorax-post-production-client-vault-dashboard.png",
  },
  "motion-vfx": {
    title: "Motion & VFX",
    subtitle: "High-impact visual enhancements and clean plating.",
    content:
      "From dynamic lower-thirds that elevate a documentary to high-impact broadcast titles that hook the audience in the first five seconds. Our motion graphics and VFX pipelines also include meticulous clean plate design and object removal for a distraction-free narrative.",
    features: [
      "High-Impact Broadcast Titles",
      "Dynamic Lower-Thirds",
      "Clean Plate Design",
      "Object Tracking & Removal",
    ],
    mediaUrl: "/assets/Centralize%20Dashboard.png",
  },
  "archival-restoration": {
    title: "Archival Restoration",
    subtitle: "Breathing new life into legacy footage.",
    content:
      "History deserves to be seen clearly. We utilize cutting-edge AI upscaling, advanced tape denoise protocols, and meticulous preservation workflows to digitize and restore legacy footage, bringing classic media into the modern high-definition era.",
    features: [
      "Legacy Footage Digitizing",
      "AI Upscaling & Enhancement",
      "Advanced Tape Denoise",
      "Preservation Workflows",
    ],
    mediaUrl: "/assets/rendorax-client-vault-portal.png",
  },
  "podcast-editing": {
    title: "Podcast Editing",
    subtitle: "Premium cinematic mastering for audio and video podcasts.",
    content:
      "Elevate your conversational content. We manage complex multi-microphone leveling, deep audio restoration, and strict synchronization for video podcasts. The result is a premium, cinematic listening and viewing experience that retains audience retention.",
    features: [
      "Multi-Microphone Leveling",
      "Deep Audio Restoration",
      "Cinematic Video Switching",
      "Platform-Ready Export",
    ],
    mediaUrl: "/assets/Linkedin%20Banner%202.png",
  },
};

export default function ServiceDetail({ params }) {
  const { slug } = params;
  const service = serviceData[slug];

  // যদি কেউ ভুল লিংকে যায়, তাহলে Next.js স্বয়ংক্রিয়ভাবে 404 পেজ দেখাবে
  if (!service) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      {/* Hero Section for Specific Service */}
      <header className="relative w-full max-w-5xl mx-auto px-6 pt-32 pb-16 flex flex-col items-start">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gold-primary blur-[150px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

        <Link
          href="/services"
          className="text-[10px] uppercase tracking-[0.2em] text-gold-primary mb-8 hover:text-white transition-colors flex items-center gap-2 animate-pulse hover:animate-none"
        >
          <span>←</span> Back to Capabilities
        </Link>

        <h1 className="text-4xl md:text-6xl font-display text-white mb-6">
          {service.title}
        </h1>
        <h2 className="text-xl md:text-2xl text-white/70 font-light max-w-2xl border-l-2 border-gold-primary pl-6 py-2">
          {service.subtitle}
        </h2>
      </header>

      {/* Main Content & Features */}
      <section className="w-full max-w-5xl mx-auto px-6 pb-32 flex-grow grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Left Column: Description & Media */}
        <div className="md:col-span-2 space-y-8">
          {/* 🌟 New GIF/Loop Video Section */}
          <div className="w-full aspect-video bg-[#0a0a0f] border border-white/10 rounded-lg overflow-hidden relative shadow-[0_0_50px_rgba(255,255,255,0.03)] group">
            <img
              src={service.mediaUrl}
              alt={service.title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
            />
          </div>

          <p className="text-base md:text-lg leading-relaxed text-text-gray/90 font-light">
            {service.content}
          </p>

          <div className="pt-8 border-t border-white/10">
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-6 font-bold">
              Workflow Protocols
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {service.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="text-gold-primary mt-1">▹</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: CTA / Sticky Panel */}
        <div className="md:col-span-1">
          <div className="bg-bg-panel border border-white/5 p-8 sticky top-32">
            <h3 className="text-lg font-display text-white mb-4">
              Start a Project
            </h3>
            <p className="text-xs text-text-gray mb-8 leading-relaxed">
              Require broadcast-grade execution for your next production? Let's
              discuss your technical requirements and timeline.
            </p>
            <Link
              href="/contact"
              className="block w-full py-3 text-center bg-gold-primary/10 border border-gold-primary/30 text-gold-primary text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-gold-primary hover:text-black transition-all"
            >
              Initiate Contact
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
