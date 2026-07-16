import { Suspense } from "react";
import InviteAcceptClient from "./InviteAcceptClient";

export default function InviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-bg-body text-text-gray flex items-center justify-center">
          <p className="text-xs uppercase tracking-widest text-gold-primary">
            Loading invitation…
          </p>
        </main>
      }
    >
      <InviteAcceptClient />
    </Suspense>
  );
}
