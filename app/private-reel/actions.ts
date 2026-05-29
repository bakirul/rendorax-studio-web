"use server";

import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { PRIVATE_REEL_COOKIE } from "./constants";

function secureCompare(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a, "utf8").digest();
  const hashB = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(hashA, hashB);
}

export async function verifyPrivateReelPasscode(
  passcode: string,
): Promise<{ success: boolean; error?: string }> {
  const expected = process.env.PRIVATE_REEL_PASSCODE;

  if (!expected) {
    console.error("PRIVATE_REEL_PASSCODE is not configured");
    return { success: false, error: "Server configuration error" };
  }

  const trimmed = passcode.trim();
  if (!trimmed) {
    return { success: false };
  }

  if (!secureCompare(trimmed, expected)) {
    return { success: false };
  }

  cookies().set(PRIVATE_REEL_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/private-reel",
    maxAge: 60 * 60 * 4,
  });

  return { success: true };
}

export async function lockPrivateReel(): Promise<void> {
  cookies().set(PRIVATE_REEL_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/private-reel",
    maxAge: 0,
  });
}
