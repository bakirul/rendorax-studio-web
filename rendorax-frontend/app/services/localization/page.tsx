import ServicePage from "@/components/services/ServicePage";
import { buildServiceMetadata } from "@/utils/servicesContent";

export const metadata = buildServiceMetadata("localization");

export default function Page() {
  return <ServicePage slug="localization" />;
}
