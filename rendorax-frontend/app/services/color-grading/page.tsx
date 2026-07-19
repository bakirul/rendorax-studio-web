import ServicePage from "@/components/services/ServicePage";
import { buildServiceMetadata } from "@/utils/servicesContent";

export const metadata = buildServiceMetadata("color-grading");

export default function Page() {
  return <ServicePage slug="color-grading" />;
}
