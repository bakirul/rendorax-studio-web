import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio | Rendorax Studio",
  description:
    "Broadcast post-production shaped by 16+ years of live television experience, AI automation, and global development agency delivery.",
  alternates: {
    canonical: "/studio",
  },
};

export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
