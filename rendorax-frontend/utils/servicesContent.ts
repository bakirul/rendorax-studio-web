import type { Metadata } from "next";

export const SITE_URL = "https://www.rendorax.com";

/**
 * Markets Rendorax Studio serves. Used for Service structured data areaServed.
 * Kept as plain, accurate region names — no unsupported claims.
 */
const AREA_SERVED = [
  "United States",
  "Canada",
  "United Kingdom",
  "Europe",
  "Australia",
] as const;

export type ServiceSlug =
  | "broadcast-post-production"
  | "video-editing"
  | "color-grading"
  | "audio-post-production"
  | "quality-control"
  | "localization";

export interface ServiceCapability {
  title: string;
  desc: string;
}

export interface ServiceWorkflowStage {
  stage: string;
  detail: string;
}

export interface ServiceFAQ {
  question: string;
  answer: string;
}

export interface ServiceWhyPoint {
  title: string;
  desc: string;
}

export interface ServiceConfig {
  slug: ServiceSlug;
  /** Short label used in hub cards, footer, and related-service links. */
  navLabel: string;
  /** One-line summary for hub cards. */
  cardDesc: string;
  /** Current-page breadcrumb label. */
  breadcrumbLabel: string;
  /** Full <title>. */
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  /** schema.org Service name + serviceType. */
  serviceName: string;
  serviceType: string;
  h1: string;
  heroValueProp: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  overview: {
    heading: string;
    paragraphs: string[];
    audience: string[];
  };
  capabilities: ServiceCapability[];
  workflow: ServiceWorkflowStage[];
  deliverables: string[];
  whyPoints: ServiceWhyPoint[];
  related: ServiceSlug[];
  faqs: ServiceFAQ[];
  finalCtaHeading: string;
  finalCtaText: string;
}

export const SERVICE_SLUGS: ServiceSlug[] = [
  "broadcast-post-production",
  "video-editing",
  "color-grading",
  "audio-post-production",
  "quality-control",
  "localization",
];

export const SERVICES: Record<ServiceSlug, ServiceConfig> = {
  "broadcast-post-production": {
    slug: "broadcast-post-production",
    navLabel: "Broadcast Post-Production",
    cardDesc:
      "End-to-end finishing — editorial coordination, review versions, picture lock, QC and master delivery for episodic and program work.",
    breadcrumbLabel: "Broadcast Post-Production",
    metaTitle: "Broadcast Post-Production Services | Rendorax Studio",
    metaDescription:
      "End-to-end broadcast post-production: editorial coordination, review versions, picture lock, visual and audio finishing, quality control and master delivery for networks, OTT platforms and production companies.",
    ogTitle: "Broadcast Post-Production Services | Rendorax Studio",
    ogDescription:
      "Coordinate editorial, review, finishing, QC and master delivery for episodic and program work inside one accountable, review-driven workflow.",
    serviceName: "Broadcast Post-Production",
    serviceType: "Broadcast Post-Production",
    h1: "Broadcast Post-Production Built for Controlled Delivery",
    heroValueProp:
      "Coordinate editorial, review, finishing and master delivery for episodic and program work inside one accountable, review-driven workflow — from locked cut to broadcast and OTT masters.",
    secondaryCtaLabel: "Explore the Workflow",
    secondaryCtaHref: "/guide/workflow",
    overview: {
      heading: "A managed finishing pipeline, not a scattered handoff",
      paragraphs: [
        "Broadcast post-production at Rendorax Studio is the managed path from locked editorial to delivery-ready masters. Editorial coordination, review versions, picture lock, visual and audio finishing, quality control and master delivery are handled inside one accountable workflow rather than across disconnected tools and inboxes.",
        "Every version, comment and decision is tracked, so production companies, broadcasters, networks and agencies always know what was approved, what changed, and what is ready to ship. This structure removes the version confusion and unclear sign-offs that usually slow down delivery.",
      ],
      audience: [
        "Production companies delivering episodic series and standalone programs",
        "Broadcasters and networks with strict delivery requirements",
        "Agencies coordinating finishing for branded and long-form content",
        "Distributed teams that need one accountable review and delivery trail",
      ],
    },
    capabilities: [
      {
        title: "Editorial Coordination",
        desc: "Managed handoff from offline editorial into finishing, keeping every cut and change accounted for.",
      },
      {
        title: "Review Version Management",
        desc: "Structured Review Versions with timestamped comments so feedback maps to exact frames.",
      },
      {
        title: "Picture Lock Control",
        desc: "A clear lock point so finishing proceeds against a stable, approved version.",
      },
      {
        title: "Visual & Audio Finishing",
        desc: "Coordinated color and audio finishing aligned to your delivery specification.",
      },
      {
        title: "Broadcast & OTT Quality Control",
        desc: "Structured checks across picture, sound and deliverables before release.",
      },
      {
        title: "Master Delivery Preparation",
        desc: "Broadcast and OTT/web masters prepared, versioned and verified for delivery.",
      },
    ],
    workflow: [
      { stage: "Request", detail: "Project scope, delivery targets and timeline are defined." },
      { stage: "Proposal", detail: "A finishing plan and deliverable list are agreed before work begins." },
      { stage: "Approval", detail: "Scope and approach are confirmed to start production." },
      { stage: "Production", detail: "Editorial coordination and finishing progress against the plan." },
      { stage: "Review", detail: "Clients review versions in the Client Vault with timestamped comments." },
      { stage: "Picture Lock", detail: "Editorial is locked so finishing and QC run against a stable version." },
      { stage: "Delivery", detail: "Verified broadcast and OTT masters are delivered to specification." },
      { stage: "Archive", detail: "Approved deliverables and versions are retained for future reference." },
    ],
    deliverables: [
      "Broadcast masters prepared to your delivery specification",
      "OTT and web deliverables",
      "Review versions and versioned exports",
      "Quality-control reports",
      "Organized master delivery packages",
    ],
    whyPoints: [
      {
        title: "Structured Operations",
        desc: "A defined lifecycle from request to archive keeps complex programs on track.",
      },
      {
        title: "Professional Review Workflow",
        desc: "Timestamped comments and clear approvals replace scattered email feedback.",
      },
      {
        title: "Picture Lock Discipline",
        desc: "Finishing only proceeds against locked editorial, preventing costly re-work.",
      },
      {
        title: "Clear Delivery Lifecycle",
        desc: "Every master is versioned, verified and traceable through delivery.",
      },
    ],
    related: ["video-editing", "color-grading", "audio-post-production", "quality-control", "localization"],
    faqs: [
      {
        question: "What does end-to-end broadcast post-production include?",
        answer:
          "It covers editorial coordination, review versions, picture lock, visual and audio finishing coordination, quality control and master delivery — managed through one accountable workflow from locked editorial to final masters.",
      },
      {
        question: "Do you work on episodic and program-based projects?",
        answer:
          "Yes. The workflow is built for episodic series and standalone programs, with version tracking and review history maintained across every episode or deliverable.",
      },
      {
        question: "How do reviews and approvals work?",
        answer:
          "Clients review Review Versions in the Client Vault, leave timestamped comments, and approve or request revisions. Approved editorial then moves to Picture Lock before finishing and delivery.",
      },
      {
        question: "What is Picture Lock and why does it matter?",
        answer:
          "Picture Lock marks editorial as final so finishing — color, audio and QC — proceeds against a stable version. This prevents conflicting changes and re-work during delivery.",
      },
      {
        question: "What master deliverables can you prepare?",
        answer:
          "Broadcast and OTT/web masters, versioned exports and review files, prepared to your delivery specification and verified through quality control.",
      },
      {
        question: "Can international teams collaborate remotely?",
        answer:
          "Yes. Rendorax operates as a global remote workflow with role-aware access, centralized assets and structured review, so distributed teams stay aligned.",
      },
    ],
    finalCtaHeading: "Build a more controlled post-production workflow.",
    finalCtaText:
      "Bring editorial, review, finishing and delivery into one accountable pipeline.",
  },

  "video-editing": {
    slug: "video-editing",
    navLabel: "Professional Video Editing",
    cardDesc:
      "Managed editorial for broadcast, branded, documentary and digital content — with version management and remote client review.",
    breadcrumbLabel: "Video Editing",
    metaTitle: "Professional Video Editing Services | Rendorax Studio",
    metaDescription:
      "Professional video editing for broadcast, branded, documentary and digital content — structured editorial, version management, remote client review and clean revision control.",
    ogTitle: "Professional Video Editing Services | Rendorax Studio",
    ogDescription:
      "Long-form and short-form editorial with disciplined version management, structured client feedback and remote review — not anonymous outsourcing.",
    serviceName: "Professional Video Editing",
    serviceType: "Video Editing",
    h1: "Professional Video Editing for Broadcast and Digital Content",
    heroValueProp:
      "Long-form and short-form editorial with disciplined version management, structured client feedback and remote review — managed editorial, not anonymous outsourcing.",
    secondaryCtaLabel: "View the Guide",
    secondaryCtaHref: "/guide",
    overview: {
      heading: "Editorial with accountability built in",
      paragraphs: [
        "Rendorax Studio provides managed video editing for broadcast programs, branded content, documentaries, promotional pieces and digital video. Each project runs through a structured editorial process where cuts, feedback and revisions are tracked as clearly labeled versions.",
        "Instead of trading files and losing track of changes, clients review edits in the Client Vault, leave timestamped comments, and approve or request revisions. The result is professional editorial with a clear trail — the opposite of low-cost, anonymous outsourcing.",
      ],
      audience: [
        "Broadcasters and production companies commissioning long-form editorial",
        "Agencies and brands producing commercials and campaign content",
        "Documentary and factual teams managing interview-driven cuts",
        "Digital teams needing platform-specific cutdowns and versions",
      ],
    },
    capabilities: [
      {
        title: "Long-Form Editorial",
        desc: "Structured editing for programs, documentaries and extended narrative content.",
      },
      {
        title: "Short-Form & Promos",
        desc: "Trailers, promos and cutdowns shaped for broadcast, web and social delivery.",
      },
      {
        title: "Documentary & Interview Editing",
        desc: "Story structuring, dialogue editing and pacing for interview-driven content.",
      },
      {
        title: "Branded & Corporate Content",
        desc: "Polished editorial aligned to brand identity and campaign goals.",
      },
      {
        title: "Revision & Version Management",
        desc: "Every revision tracked as a labeled Review Version so nothing is lost.",
      },
      {
        title: "Remote Client Review",
        desc: "Timestamped feedback in the Client Vault with role-aware access.",
      },
    ],
    workflow: [
      { stage: "Request", detail: "Editorial goals, formats and delivery targets are defined." },
      { stage: "Proposal", detail: "An editorial approach and version plan are agreed." },
      { stage: "Production", detail: "Cuts are built and shared as Review Versions." },
      { stage: "Review", detail: "Clients leave timestamped comments and request revisions." },
      { stage: "Picture Lock", detail: "The approved cut is locked before finishing and delivery." },
      { stage: "Delivery", detail: "Final edits and cutdowns are delivered per platform." },
    ],
    deliverables: [
      "Edited masters for broadcast and digital",
      "Platform-specific cutdowns and aspect variations",
      "Review files and versioned exports",
      "Clearly labeled revision versions",
      "Organized project handoff on request",
    ],
    whyPoints: [
      {
        title: "Managed, Not Outsourced",
        desc: "Accountable editorial with a clear owner and review trail — not anonymous piecework.",
      },
      {
        title: "Version Control",
        desc: "Labeled Review Versions keep feedback and revisions organized end to end.",
      },
      {
        title: "Role-Aware Collaboration",
        desc: "Editors, reviewers and approvers work with the right access at each step.",
      },
      {
        title: "Remote by Design",
        desc: "Review, comment and approve from anywhere with timestamped precision.",
      },
    ],
    related: ["broadcast-post-production", "color-grading", "audio-post-production", "localization", "quality-control"],
    faqs: [
      {
        question: "What types of content do you edit?",
        answer:
          "Long-form and short-form work including broadcast programs, branded content, documentary, promotional and digital video.",
      },
      {
        question: "How are revisions and versions managed?",
        answer:
          "Each cut is tracked as a Review Version. Clients leave timestamped feedback, and revisions are delivered as clearly labeled versions so nothing is lost or confused.",
      },
      {
        question: "Can I review edits remotely with my team?",
        answer:
          "Yes. Reviews happen in the Client Vault with timestamped comments and role-aware access, so editors, reviewers and approvers can collaborate from anywhere.",
      },
      {
        question: "Do you deliver platform-specific cutdowns?",
        answer:
          "Yes. Alongside the primary edit we can prepare cutdowns and aspect variations for broadcast, web and social delivery.",
      },
      {
        question: "Is this outsourced or managed editorial?",
        answer:
          "This is a managed, review-driven editorial service with structured accountability — not anonymous, low-cost outsourcing.",
      },
    ],
    finalCtaHeading: "Bring structure to your editorial.",
    finalCtaText:
      "Managed video editing with version control and remote review from start to delivery.",
  },

  "color-grading": {
    slug: "color-grading",
    navLabel: "Color Grading",
    cardDesc:
      "Shot matching, controlled look development, skin-tone handling and broadcast-safe Rec.709 finishing with review and approval.",
    breadcrumbLabel: "Color Grading",
    metaTitle: "Professional Color Grading Services | Rendorax Studio",
    metaDescription:
      "Color grading for consistent, production-ready finishing — shot matching, creative look development, skin-tone handling and Rec.709 broadcast-safe output, with review and approval.",
    ogTitle: "Professional Color Grading Services | Rendorax Studio",
    ogDescription:
      "Shot-to-shot consistency, controlled look development and broadcast-safe output — reviewed and approved before delivery.",
    serviceName: "Color Grading",
    serviceType: "Color Grading",
    h1: "Color Grading for Consistent, Production-Ready Finishing",
    heroValueProp:
      "Shot-to-shot consistency, controlled creative look development and broadcast-safe output — reviewed and approved before delivery.",
    secondaryCtaLabel: "Explore the Workflow",
    secondaryCtaHref: "/guide/workflow",
    overview: {
      heading: "Consistency that holds across the whole program",
      paragraphs: [
        "Color grading at Rendorax Studio focuses on consistency and controlled finishing. Shots are balanced and matched scene by scene so exposure, tone and color hold together across an entire program — not just in isolated hero shots.",
        "Creative look development is handled with care for skin tones and broadcast-safe output. Grades are shared as Review Versions for feedback and approval, and applied against locked editorial so the finished look sits on a stable version.",
      ],
      audience: [
        "Production companies finishing broadcast and digital programs",
        "Agencies needing consistent looks across campaign content",
        "Documentary and narrative teams matching mixed-source footage",
        "Clients who want to review and approve the grade before delivery",
      ],
    },
    capabilities: [
      {
        title: "Shot Matching & Balancing",
        desc: "Scene-by-scene matching so color and exposure stay consistent throughout.",
      },
      {
        title: "Creative Look Development",
        desc: "Controlled look design aligned to the tone and intent of the piece.",
      },
      {
        title: "Skin-Tone Handling",
        desc: "Careful attention to natural, consistent skin tones across shots.",
      },
      {
        title: "Broadcast-Safe Finishing",
        desc: "Rec.709 broadcast-safe output prepared for SDR delivery targets.",
      },
      {
        title: "Scene-to-Scene Consistency",
        desc: "A unified look that holds across the full deliverable, not just samples.",
      },
      {
        title: "Review & Approval of Grades",
        desc: "Grades shared as Review Versions for timestamped feedback and sign-off.",
      },
    ],
    workflow: [
      { stage: "Proposal", detail: "Look direction and delivery targets are agreed." },
      { stage: "Production", detail: "Grading and look development are performed on the footage." },
      { stage: "Review", detail: "Grades are shared as Review Versions for feedback." },
      { stage: "Picture Lock", detail: "Grading is applied against locked editorial for stability." },
      { stage: "Delivery", detail: "Graded masters are exported to your target specification." },
    ],
    deliverables: [
      "Graded masters in Rec.709 / SDR",
      "Reference stills for approved looks",
      "Review versions of the grade",
      "Versioned exports to your delivery specification",
    ],
    whyPoints: [
      {
        title: "Consistency First",
        desc: "Shot matching keeps the whole program coherent, not just individual frames.",
      },
      {
        title: "Reviewable Grades",
        desc: "Every look is shared for structured feedback and approval before export.",
      },
      {
        title: "Stable Finishing",
        desc: "Grading runs against locked editorial to avoid conflicting re-grades.",
      },
      {
        title: "Delivery-Ready Output",
        desc: "Broadcast-safe Rec.709 output prepared for your target platform.",
      },
    ],
    related: ["broadcast-post-production", "video-editing", "audio-post-production", "quality-control"],
    faqs: [
      {
        question: "What does your color grading service focus on?",
        answer:
          "Shot-to-shot consistency, controlled creative look development, skin-tone handling and broadcast-safe finishing that stays stable across a full program.",
      },
      {
        question: "How do you keep footage consistent across scenes?",
        answer:
          "We balance and match shots scene by scene against reference stills so tone, exposure and color hold together across the whole deliverable.",
      },
      {
        question: "What output standards do you finish to?",
        answer:
          "We finish to Rec.709 broadcast-safe output for SDR delivery, prepared to your target platform's specification.",
      },
      {
        question: "Can I review and approve the grade before delivery?",
        answer:
          "Yes. Grades are shared as Review Versions for timestamped feedback and approval before final export.",
      },
      {
        question: "Do you grade after Picture Lock?",
        answer:
          "Grading is performed against locked editorial so the finished look is applied to a stable version, avoiding conflicting re-grades.",
      },
    ],
    finalCtaHeading: "Give your program a consistent, finished look.",
    finalCtaText:
      "Controlled color grading with review and approval, finished to your delivery spec.",
  },

  "audio-post-production": {
    slug: "audio-post-production",
    navLabel: "Audio Post-Production",
    cardDesc:
      "Dialogue cleanup, balancing, noise reduction, music and effects integration, loudness review and stems preparation.",
    breadcrumbLabel: "Audio Post-Production",
    metaTitle: "Audio Post-Production Services | Rendorax Studio",
    metaDescription:
      "Audio post-production for clear, consistent delivery — dialogue cleanup, balancing, noise reduction, music and effects integration, loudness review to broadcast targets and stems preparation.",
    ogTitle: "Audio Post-Production Services | Rendorax Studio",
    ogDescription:
      "Dialogue clarity, balanced mixes and delivery-ready stems — reviewed against broadcast loudness targets before sign-off.",
    serviceName: "Audio Post-Production",
    serviceType: "Audio Post-Production",
    h1: "Audio Post-Production for Clear, Consistent Delivery",
    heroValueProp:
      "Dialogue clarity, balanced mixes and delivery-ready stems — reviewed against broadcast loudness targets before sign-off.",
    secondaryCtaLabel: "Explore the Workflow",
    secondaryCtaHref: "/guide/workflow",
    overview: {
      heading: "Clarity and consistency across every deliverable",
      paragraphs: [
        "Audio post-production at Rendorax Studio brings dialogue, music and effects into a clean, balanced mix. Dialogue is edited and cleaned up, noise is reduced, and levels are balanced so the program sounds consistent from start to finish.",
        "Mixes are reviewed against broadcast loudness targets as part of finishing, and delivered with stems where needed for future versioning. Audio is shared as Review Versions for timestamped feedback and approval before delivery.",
      ],
      audience: [
        "Broadcasters and production companies needing consistent program sound",
        "Documentary and interview teams with challenging location audio",
        "Agencies delivering polished branded and campaign content",
        "Teams that need separated stems for versioning and localization",
      ],
    },
    capabilities: [
      {
        title: "Dialogue Editing & Cleanup",
        desc: "Clear, intelligible dialogue with noise and inconsistencies reduced.",
      },
      {
        title: "Noise Reduction & Restoration",
        desc: "Reduction of hum, hiss and background issues in problem recordings.",
      },
      {
        title: "Level Balancing & Mix Prep",
        desc: "Balanced levels across dialogue, music and effects for a stable mix.",
      },
      {
        title: "Music & Effects Integration",
        desc: "Music and effects placed and balanced to support the edit.",
      },
      {
        title: "Loudness Review",
        desc: "Mixes reviewed against broadcast loudness targets during finishing.",
      },
      {
        title: "Stems & Delivery Preparation",
        desc: "Separated stems and delivery-ready mixes prepared to specification.",
      },
    ],
    workflow: [
      { stage: "Proposal", detail: "Audio scope, targets and deliverables are agreed." },
      { stage: "Production", detail: "Dialogue edit, cleanup, balancing and mix are performed." },
      { stage: "Review", detail: "Mixes are shared as Review Versions for feedback." },
      { stage: "Picture Lock", detail: "Final mix is finished against the locked edit." },
      { stage: "Delivery", detail: "Loudness-reviewed masters and stems are delivered." },
    ],
    deliverables: [
      "Final mix prepared to your delivery specification",
      "Audio stems (dialogue, music, effects) on request",
      "Loudness-reviewed masters aligned to broadcast targets",
      "Review files and versioned exports",
    ],
    whyPoints: [
      {
        title: "Dialogue Clarity",
        desc: "Clean, consistent dialogue is treated as the foundation of every mix.",
      },
      {
        title: "Loudness Awareness",
        desc: "Mixes are reviewed against broadcast loudness targets during finishing.",
      },
      {
        title: "Reviewable Audio",
        desc: "Every mix is shared for timestamped feedback and approval.",
      },
      {
        title: "Versioning-Ready Stems",
        desc: "Separated stems support future edits, versions and localization.",
      },
    ],
    related: ["broadcast-post-production", "video-editing", "color-grading", "localization"],
    faqs: [
      {
        question: "What does audio post-production include?",
        answer:
          "Dialogue editing and cleanup, noise reduction, level balancing, music and effects integration, loudness review and stems preparation for delivery.",
      },
      {
        question: "How do you handle loudness for broadcast?",
        answer:
          "Mixes are reviewed against broadcast loudness targets (for example R128 / -23 LUFS references) as part of finishing. We provide loudness-reviewed masters rather than formal certification.",
      },
      {
        question: "Can you deliver audio stems?",
        answer:
          "Yes. We can prepare separated stems (dialogue, music, effects) alongside the final mix for delivery and future versioning.",
      },
      {
        question: "Do you clean up problematic dialogue?",
        answer:
          "Yes. We reduce noise, hum and inconsistencies and balance dialogue for clarity across the program.",
      },
      {
        question: "How is audio reviewed and approved?",
        answer:
          "Audio is shared as Review Versions in the Client Vault for timestamped feedback and approval before delivery.",
      },
    ],
    finalCtaHeading: "Deliver clean, consistent sound.",
    finalCtaText:
      "Audio post-production reviewed against broadcast loudness targets before delivery.",
  },

  "quality-control": {
    slug: "quality-control",
    navLabel: "Quality Control",
    cardDesc:
      "Broadcast and OTT checks across picture, sound, subtitles and deliverables — with clear QC reporting before release.",
    breadcrumbLabel: "Quality Control",
    metaTitle: "Broadcast and OTT Quality Control | Rendorax Studio",
    metaDescription:
      "Broadcast and OTT quality control — visual and audio checks, subtitle and caption verification, sync and black-frame checks, deliverable verification and structured QC reporting.",
    ogTitle: "Broadcast and OTT Quality Control | Rendorax Studio",
    ogDescription:
      "Structured human QC across visual, audio, subtitle and deliverable layers — with clear reporting before your content ships.",
    serviceName: "Broadcast and OTT Quality Control",
    serviceType: "Quality Control",
    h1: "Quality Control for Broadcast and OTT Deliverables",
    heroValueProp:
      "Structured quality control across visual, audio, subtitle and deliverable layers — with clear reporting before your content ships.",
    secondaryCtaLabel: "View the Guide",
    secondaryCtaHref: "/guide",
    overview: {
      heading: "Catch issues before your audience does",
      paragraphs: [
        "Quality control at Rendorax Studio is a structured check across the layers that matter for broadcast and OTT delivery: picture, sound, subtitles and the deliverables themselves. Operators work through consistent checklists to catch visual issues, audio issues, sync problems, black frames and version mismatches.",
        "Each pass produces a clear QC report and issue log, so problems are documented and traceable before content is released. QC verifies that what ships matches what was approved.",
      ],
      audience: [
        "Broadcasters and networks with strict delivery requirements",
        "OTT and streaming teams verifying platform deliverables",
        "Production companies confirming masters before release",
        "Localization teams checking subtitle and caption accuracy",
      ],
    },
    capabilities: [
      {
        title: "Visual Issue Checks",
        desc: "Checks for artifacts, dropped frames, flashes and picture problems.",
      },
      {
        title: "Audio Issue Checks",
        desc: "Checks for clipping, dropouts, imbalance and audio anomalies.",
      },
      {
        title: "Subtitle & Caption Checks",
        desc: "Verification of subtitle timing, caption accuracy and language versions.",
      },
      {
        title: "Sync & Black-Frame Checks",
        desc: "Audio-to-picture sync verification and black-frame detection.",
      },
      {
        title: "Deliverable Verification",
        desc: "Confirmation that versions and deliverables match the approved master.",
      },
      {
        title: "QC Reporting",
        desc: "Structured QC reports and issue logs for every pass.",
      },
    ],
    workflow: [
      { stage: "Review", detail: "The deliverable is checked against structured QC criteria." },
      { stage: "Picture Lock", detail: "QC verifies the locked, approved version." },
      { stage: "Delivery", detail: "Verified deliverables are cleared for release." },
      { stage: "Archive", detail: "QC reports and verified versions are retained." },
    ],
    deliverables: [
      "Structured QC reports",
      "Detailed issue logs",
      "Verified deliverables cleared for release",
      "Version verification against the approved master",
    ],
    whyPoints: [
      {
        title: "Structured Checks",
        desc: "Consistent checklists across picture, sound, subtitles and deliverables.",
      },
      {
        title: "Clear Reporting",
        desc: "Documented QC reports and issue logs keep problems traceable.",
      },
      {
        title: "Version Verification",
        desc: "Confirms that shipped deliverables match the approved master.",
      },
      {
        title: "Human Review",
        desc: "Trained operators catch context-dependent issues automation can miss.",
      },
    ],
    related: ["broadcast-post-production", "localization", "color-grading", "audio-post-production"],
    faqs: [
      {
        question: "What does your quality control service check?",
        answer:
          "Visual issues, audio issues, subtitle and caption accuracy, sync, black frames, and version and deliverable verification — summarized in a QC report.",
      },
      {
        question: "Do you provide a QC report?",
        answer:
          "Yes. Each pass produces a structured QC report and issue log so problems are documented clearly before content ships.",
      },
      {
        question: "Do you QC for both broadcast and OTT?",
        answer:
          "Yes. Checks are aligned to broadcast and OTT delivery expectations across picture, sound and metadata layers.",
      },
      {
        question: "Can you verify subtitles and captions?",
        answer:
          "Yes. We check subtitle timing, caption accuracy and language-version consistency as part of QC.",
      },
      {
        question: "Is your QC automated?",
        answer:
          "QC is performed by trained operators using structured checklists and reporting. Human review remains central to catching context-dependent issues.",
      },
    ],
    finalCtaHeading: "Ship deliverables you can trust.",
    finalCtaText:
      "Structured broadcast and OTT quality control with clear reporting before release.",
  },

  localization: {
    slug: "localization",
    navLabel: "Media Localization",
    cardDesc:
      "Subtitling, captions, subtitle timing, language-version coordination and text translation workflows with review and approval.",
    breadcrumbLabel: "Localization",
    metaTitle: "Media Localization and Subtitling Services | Rendorax Studio",
    metaDescription:
      "Media localization and subtitling for global delivery — subtitles, closed captions, subtitle timing, language-version coordination, text translation workflows and localized review and approval.",
    ogTitle: "Media Localization and Subtitling Services | Rendorax Studio",
    ogDescription:
      "Subtitles, captions and language-version coordination managed through the same review, approval and delivery workflow as your masters.",
    serviceName: "Media Localization and Subtitling",
    serviceType: "Media Localization",
    h1: "Media Localization and Subtitling for Global Delivery",
    heroValueProp:
      "Subtitles, captions and language-version coordination managed through the same review, approval and delivery workflow as your masters.",
    secondaryCtaLabel: "Explore the Workflow",
    secondaryCtaHref: "/guide/workflow",
    overview: {
      heading: "Reach global audiences with coordinated language versions",
      paragraphs: [
        "Localization at Rendorax Studio covers subtitling, closed captions, subtitle timing and language-version coordination for global delivery. Text translation is handled as a coordinated workflow with translators and reviewers, keeping each localized version aligned to the approved master.",
        "Localized deliverables move through the same review and approval process as your primary content, so subtitles and captions are checked, versioned and signed off before delivery. Rendorax focuses on subtitling and coordinated language versions — not automated dubbing or live translated video.",
      ],
      audience: [
        "Distributors delivering programs across multiple territories",
        "OTT and streaming teams needing compliant caption files",
        "Production companies coordinating multi-language versions",
        "Agencies localizing campaign content for global markets",
      ],
    },
    capabilities: [
      {
        title: "Subtitling",
        desc: "Accurate, well-timed subtitles prepared for your delivery targets.",
      },
      {
        title: "Closed Captions",
        desc: "Caption files prepared to platform and accessibility requirements.",
      },
      {
        title: "Subtitle Timing & Conforming",
        desc: "Precise timing and conforming to the approved edit.",
      },
      {
        title: "Language-Version Coordination",
        desc: "Multiple language versions tracked and kept aligned to the master.",
      },
      {
        title: "Text Translation Workflow",
        desc: "Coordinated translation with translators and reviewers in the loop.",
      },
      {
        title: "Localized Review & Approval",
        desc: "Localized deliverables reviewed and approved before delivery.",
      },
    ],
    workflow: [
      { stage: "Request", detail: "Target languages, formats and delivery specs are defined." },
      { stage: "Production", detail: "Subtitling, captions and translation are prepared and timed." },
      { stage: "Review", detail: "Localized versions are reviewed for accuracy and timing." },
      { stage: "Delivery", detail: "Localized packages and files are delivered to specification." },
      { stage: "Archive", detail: "Approved language versions are retained for reuse." },
    ],
    deliverables: [
      "Subtitle files (e.g. SRT, VTT)",
      "Closed caption files",
      "Timed and conformed subtitle exports",
      "Coordinated language versions",
      "Localized delivery packages",
    ],
    whyPoints: [
      {
        title: "Coordinated Versions",
        desc: "Every language version is tracked and aligned to the approved master.",
      },
      {
        title: "Review & Approval",
        desc: "Localized deliverables move through the same structured sign-off.",
      },
      {
        title: "Accurate Timing",
        desc: "Subtitles and captions are conformed precisely to the edit.",
      },
      {
        title: "Honest Scope",
        desc: "Focused on subtitling and coordination — no automated dubbing claims.",
      },
    ],
    related: ["broadcast-post-production", "video-editing", "quality-control", "audio-post-production"],
    faqs: [
      {
        question: "What localization services do you offer?",
        answer:
          "Subtitling, closed captions, subtitle timing and conforming, language-version coordination, text translation workflow coordination, and localized review and approval.",
      },
      {
        question: "What subtitle and caption formats can you deliver?",
        answer:
          "Common formats such as SRT and VTT, plus timed caption files prepared to your platform's delivery requirements.",
      },
      {
        question: "How is translation handled?",
        answer:
          "Text translation is managed as a coordinated workflow with translators and reviewers; localized versions are reviewed and approved before delivery.",
      },
      {
        question: "Do you support multiple language versions of one program?",
        answer:
          "Yes. Language versions are tracked and coordinated so each localized deliverable stays aligned with the approved master.",
      },
      {
        question: "Do you offer automated dubbing or live translated video?",
        answer:
          "No. We focus on subtitling, captions and coordinated language-version workflows rather than automated dubbing or live video translation.",
      },
    ],
    finalCtaHeading: "Deliver your content to global audiences.",
    finalCtaText:
      "Subtitling and coordinated language versions managed through structured review and delivery.",
  },
};

export function getService(slug: string): ServiceConfig | undefined {
  return SERVICES[slug as ServiceSlug];
}

export function buildServiceMetadata(slug: ServiceSlug): Metadata {
  const s = SERVICES[slug];
  const url = `${SITE_URL}/services/${slug}`;
  return {
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: {
      canonical: `/services/${slug}`,
    },
    openGraph: {
      title: s.ogTitle,
      description: s.ogDescription,
      url,
      siteName: "Rendorax Studio",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: s.ogTitle,
      description: s.ogDescription,
    },
  };
}

export function buildServiceJsonLd(slug: ServiceSlug) {
  const s = SERVICES[slug];
  const url = `${SITE_URL}/services/${slug}`;

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Services",
        item: `${SITE_URL}/services`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: s.breadcrumbLabel,
        item: url,
      },
    ],
  };

  const service = {
    "@type": "Service",
    name: s.serviceName,
    serviceType: s.serviceType,
    description: s.metaDescription,
    url,
    provider: {
      "@type": "Organization",
      name: "Rendorax Studio",
      url: SITE_URL,
    },
    areaServed: AREA_SERVED.map((name) => ({ "@type": "Place", name })),
  };

  const faqPage = {
    "@type": "FAQPage",
    mainEntity: s.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [breadcrumb, service, faqPage],
  };
}
