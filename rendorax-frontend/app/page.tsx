import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
  title: "Rendorax Studio | Broadcast Post-Production Platform",
  description:
    "Upload broadcast files, manage timelines, get frame-precise feedback, and organize assets in one secure vault for post-production teams and clients.",
};

export default function Home() {
  return <HomePageClient />;
}
