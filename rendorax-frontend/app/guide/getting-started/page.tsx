import type { Metadata } from "next";
import Link from "next/link";
import GuideArticle, {
  GuideNote,
  GuideSteps,
} from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Getting Started | Guide | Rendorax Studio",
};

export default function GettingStartedPage() {
  return (
    <GuideArticle
      eyebrow="Getting Started"
      title="Sign in and choose your role surface."
      description="Rendorax Studio is for invited Clients, Editors, and Admins. There is no public self-signup for production work."
      nextHref="/guide/workflow"
      nextLabel="Workflow Guide"
    >
      <GuideSteps
        steps={[
          "Open /access and sign in with the credentials provided by Admin.",
          "Clients and Editors land on /dashboard (the Client Vault / workspace).",
          "Admins open /admin for Request Inbox, Clients, Projects, Operations Queue, and Archive.",
          "Clients can submit a Project Request from the Dashboard before production starts.",
          "Use this Guide Center anytime from the Dashboard Help control or the site Footer.",
        ]}
      />

      <section>
        <h2 className="text-white font-display text-xl mb-3">Roles</h2>
        <ul className="space-y-2 list-disc pl-5">
          <li>
            <strong className="text-white">Client</strong> — review deliverables,
            leave comments, approve or request revision, download Master
            Delivery.
          </li>
          <li>
            <strong className="text-white">Editor</strong> — work assigned
            Projects and Tasks, upload Review Versions, Picture Lock, create
            Master Delivery.
          </li>
          <li>
            <strong className="text-white">Admin</strong> — create Clients and
            Projects, assign Editors, run Operations Queue, track Delivery,
            Archive / Restore.
          </li>
        </ul>
      </section>

      <GuideNote>
        Related onboarding document:{" "}
        <Link href="/checklist" className="text-gold-primary hover:text-white">
          Client Expectation Checklist
        </Link>
        . That page aligns expectations before post starts; this Guide explains
        how Studio itself works. Vetted prospects:{" "}
        <Link href="/guide/demo" className="text-gold-primary hover:text-white">
          Demo Workspace
        </Link>
        .
      </GuideNote>
    </GuideArticle>
  );
}
