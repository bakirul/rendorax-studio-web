import { cookies } from "next/headers";
import { PRIVATE_REEL_COOKIE } from "./constants";
import PrivateReelClient from "./PrivateReelClient";

export default function PrivateReelPage() {
  const isUnlocked = cookies().get(PRIVATE_REEL_COOKIE)?.value === "1";

  return <PrivateReelClient initialUnlocked={isUnlocked} />;
}
