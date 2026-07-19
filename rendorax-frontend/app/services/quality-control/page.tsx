import ServicePage from "@/components/services/ServicePage";
import { buildServiceMetadata } from "@/utils/servicesContent";

export const metadata = buildServiceMetadata("quality-control");

export default function Page() {
  return <ServicePage slug="quality-control" />;
}
