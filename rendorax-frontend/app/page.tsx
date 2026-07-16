import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

const SITE_URL = "https://www.rendorax.com";
const OG_IMAGE =
  "/assets/landing_page-image/Global-post-production-operations-in-action.jpg";

const TITLE = "Rendorax Studio | Broadcast Post-Production Operations";
const DESCRIPTION =
  "Rendorax Studio is a broadcast post-production operations partner helping agencies, networks, OTT platforms and production teams manage request, review, delivery and archive inside one accountable workflow.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Rendorax Studio",
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: 1672,
        height: 941,
        alt: "Rendorax Studio global post-production operations command center",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Rendorax Studio",
      legalName: "Rendorax Limited",
      url: SITE_URL,
      logo: `${SITE_URL}/assets/logo.svg`,
      description: DESCRIPTION,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Dhaka",
        addressCountry: "BD",
      },
    },
    {
      "@type": "WebSite",
      name: "Rendorax Studio",
      url: SITE_URL,
      description: DESCRIPTION,
      publisher: {
        "@type": "Organization",
        name: "Rendorax Studio",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePageClient />
    </>
  );
}
