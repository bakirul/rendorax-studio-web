import ServicePage from "@/components/services/ServicePage";
import { buildServiceMetadata } from "@/utils/servicesContent";

export const metadata = buildServiceMetadata("audio-post-production");

export default function Page() {
  return <ServicePage slug="audio-post-production" />;
}
