import ServicePage from "@/components/services/ServicePage";
import { buildServiceMetadata } from "@/utils/servicesContent";

export const metadata = buildServiceMetadata("broadcast-post-production");

export default function Page() {
  return <ServicePage slug="broadcast-post-production" />;
}
