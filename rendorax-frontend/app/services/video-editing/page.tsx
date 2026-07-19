import ServicePage from "@/components/services/ServicePage";
import { buildServiceMetadata } from "@/utils/servicesContent";

export const metadata = buildServiceMetadata("video-editing");

export default function Page() {
  return <ServicePage slug="video-editing" />;
}
