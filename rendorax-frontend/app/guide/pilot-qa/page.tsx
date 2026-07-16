import type { Metadata } from "next";
import GuideArticle, { GuideNote } from "@/components/guide/GuideArticle";

export const metadata: Metadata = {
  title: "Pilot QA Runbook | Guide | Rendorax Studio",
};

type Check = { step: string; expect: string };

type Scenario = {
  id: string;
  title: string;
  goal: string;
  actors: string;
  checks: Check[];
  passRule: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "A",
    title: "Admin — Request to Project",
    goal: "Prove commercial intake becomes a production Agency Project.",
    actors: "Admin + Primary Client (or Approver for proposal)",
    checks: [
      {
        step: "Admin creates Client (email + temporary password)",
        expect: "Client can sign in at /access → /dashboard",
      },
      {
        step: "Admin creates Editor with specialization",
        expect: "Editor signs in → sees Dashboard (not Admin HQ)",
      },
      {
        step: "Client submits Project Request",
        expect: "Appears in Admin Request Inbox as Submitted",
      },
      {
        step: "Admin reviews → creates Proposal → Send",
        expect: "Request status Quoted; Client sees Proposal",
      },
      {
        step: "Client/Approver Approves Proposal",
        expect: "Request status Approved (Admin cannot fake Approve)",
      },
      {
        step: "Admin Convert To Project",
        expect: "Status Project Created; AgencyProject at Awaiting Assets",
      },
      {
        step: "Retry Convert on same request",
        expect: "409 Already converted — no second project",
      },
      {
        step: "Client opens Dashboard project list",
        expect: "Converted project visible without Admin creating it again",
      },
    ],
    passRule: "Pass only if convert + visibility work and duplicate convert fails.",
  },
  {
    id: "B",
    title: "Reviewer — Invite and limits",
    goal: "Reviewer joins org and can comment, but cannot approve or download Master.",
    actors: "Primary Contact (invite) + Reviewer invitee",
    checks: [
      {
        step: "Primary invites Reviewer (email or copy link)",
        expect: "Pending invite; role Reviewer",
      },
      {
        step: "Reviewer opens /access/invite → sets password → Accept",
        expect: "Auth role client; lands on Client Dashboard",
      },
      {
        step: "Reviewer opens org project / request",
        expect: "Can view request and review assets",
      },
      {
        step: "Reviewer posts a timed comment",
        expect: "Comment appears; author shows Reviewer identity",
      },
      {
        step: "Reviewer tries Approve Proposal (if any sent) / Approve Version",
        expect: "UI hidden or API 403 — cannot approve",
      },
      {
        step: "Reviewer opens Master Delivery → Download",
        expect: "Download blocked (UI and/or API 403)",
      },
    ],
    passRule: "Pass only if comment works and approve + download are denied.",
  },
  {
    id: "C",
    title: "Approver — Decisions and delivery",
    goal: "Approver can approve review and download Master.",
    actors: "Primary Contact (invite) + Approver + Editor (delivery ready)",
    checks: [
      {
        step: "Invite Approver → Accept + password",
        expect: "Dashboard access as org Approver",
      },
      {
        step: "With sent Proposal on Quoted request — Approve Proposal",
        expect: "Request → Approved (or use Scenario A Approver for this)",
      },
      {
        step: "On Review Version — Approve Version",
        expect: "Review decision recorded as approved",
      },
      {
        step: "With active Master Delivery — Download Master",
        expect: "Download succeeds; Access Granted recorded",
      },
    ],
    passRule: "Pass only if approve review + master download both succeed.",
  },
  {
    id: "D",
    title: "Editor — Production path",
    goal: "Editor completes assigned production work on the converted project.",
    actors: "Admin (assign) + Editor",
    checks: [
      {
        step: "Admin assigns Task on converted project to Editor",
        expect: "Task appears on Editor Dashboard",
      },
      {
        step: "Editor uploads Review Version to project (03_REVIEW)",
        expect: "Asset linked to project; Client can preview",
      },
      {
        step: "Editor (or Client) sets Picture Lock when ready",
        expect: "Lock event visible; rules match product policy",
      },
      {
        step: "Editor uploads/registers Master Delivery (05_MASTER_DELIVERY)",
        expect: "Delivery current; Approver/Primary can download",
      },
    ],
    passRule: "Pass only if task → review → lock → master chain works on one project.",
  },
  {
    id: "E",
    title: "Password Recovery",
    goal: "Paying client can recover access without Admin console.",
    actors: "Any provisioned client user",
    checks: [
      {
        step: "/access → Forgot Password? → enter email → Send Reset Link",
        expect: "Success message; email arrives (Supabase Auth email)",
      },
      {
        step: "Open reset link → /auth/callback → /reset-password",
        expect: "Session valid; New Password + Confirm form",
      },
      {
        step: "Update Password → Go To Login → sign in",
        expect: "Login with new password succeeds",
      },
      {
        step: "Expired / reused link",
        expect: "Clear error; can request a new link",
      },
    ],
    passRule:
      "Pass only if email delivery works in the environment under test (Redirect URLs configured).",
  },
  {
    id: "F",
    title: "Archive / Restore",
    goal: "Finished work leaves active surfaces; Restore brings it back.",
    actors: "Admin + Client + Editor",
    checks: [
      {
        step: "Admin Archives the pilot project",
        expect: "Removed from active Admin/Client/Editor lists and Operations Queue",
      },
      {
        step: "Client/Editor attempt active workspace actions on archived project",
        expect: "API 409 / blocked — not editable as live work",
      },
      {
        step: "Admin Restores project",
        expect: "Visible again in active lists; workflow usable",
      },
    ],
    passRule: "Pass only if archive hides from active ops and restore recovers.",
  },
  {
    id: "G",
    title: "Organization Isolation",
    goal: "Org A must not see Org B data (especially comments).",
    actors: "Two separate Client Organizations (A and B)",
    checks: [
      {
        step: "Create Org A project with comments; Org B separate project",
        expect: "Each org only sees own projects/requests",
      },
      {
        step: "Org A user opens review; query/browse comments",
        expect: "Cannot read Org B comments (RLS / UI)",
      },
      {
        step: "Org B member tries Org A project id / request id",
        expect: "403 / empty — no cross-org leak",
      },
    ],
    passRule: "Fail the sprint if any cross-org comment or project leak is found.",
  },
];

export default function PilotQaRunbookPage() {
  return (
    <GuideArticle
      eyebrow="Pilot · QA Sprint"
      title="Real Pilot Client QA Runbook."
      description="Answer one question: can a real paying client use Rendorax end-to-end? Run Scenarios A–G in a real browser against the environment you will pilot. Do not start First International Onboarding until this sprint passes."
      nextHref="/guide/workflow"
      nextLabel="Workflow Guide"
    >
      <GuideNote>
        Goal: <strong className="text-white">Can a real paying client use this?</strong>{" "}
        Feature build is paused. This runbook is the gate before First International
        Pilot Client. Billing (Proposal → Invoice → Payment) comes after a successful
        pilot, not before.
      </GuideNote>

      <section className="space-y-3">
        <h2 className="text-white font-display text-xl">Current maturity (reference)</h2>
        <ul className="space-y-1 text-sm">
          <li>Business Layer ~95%</li>
          <li>Workflow Layer ~95%</li>
          <li>Platform Foundation ~90%</li>
          <li>Pilot Readiness ~80% — blocked on real browser QA, production env, user behavior</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-white font-display text-xl">How to run</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Use production-like env (or staging that mirrors prod Auth, R2, Redis).</li>
          <li>One dedicated pilot org first; Scenario G needs a second org.</li>
          <li>Mark each check Pass / Fail. Any Fail in A–E or G = sprint Fail.</li>
          <li>Record email provider, browser, and date on the scorecard below.</li>
        </ol>
      </section>

      {SCENARIOS.map((scenario) => (
        <section key={scenario.id} className="space-y-4">
          <div>
            <h2 className="text-white font-display text-xl">
              Scenario {scenario.id} — {scenario.title}
            </h2>
            <p className="mt-1 text-sm">{scenario.goal}</p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-gold-primary">
              Actors: {scenario.actors}
            </p>
          </div>
          <ul className="space-y-2">
            {scenario.checks.map((check) => (
              <li
                key={check.step}
                className="border border-white/5 bg-[#0e0e12] px-4 py-3"
              >
                <p className="text-white text-sm mb-1">
                  <span className="text-text-gray font-mono text-[10px] mr-2">
                    [ ]
                  </span>
                  {check.step}
                </p>
                <p className="text-[12px] text-text-gray pl-6">
                  Expect: {check.expect}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-gold-primary/90 border border-gold-primary/20 bg-gold-primary/5 px-3 py-2">
            Pass rule: {scenario.passRule}
          </p>
        </section>
      ))}

      <section className="space-y-3">
        <h2 className="text-white font-display text-xl">Sprint scorecard</h2>
        <div className="border border-white/10 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[9px] uppercase tracking-widest text-text-gray border-b border-white/10">
                <th className="py-2 px-3 font-normal">Scenario</th>
                <th className="py-2 px-3 font-normal">Result</th>
                <th className="py-2 px-3 font-normal">Notes</th>
              </tr>
            </thead>
            <tbody>
              {SCENARIOS.map((s) => (
                <tr key={s.id} className="border-b border-white/5">
                  <td className="py-2 px-3 text-white">
                    {s.id} — {s.title}
                  </td>
                  <td className="py-2 px-3 text-text-gray">Pass / Fail</td>
                  <td className="py-2 px-3 text-text-gray">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <GuideNote>
          Sprint Pass = A–G all Pass (or G deferred only if pilot is strictly
          single-org and documented). Then proceed to First International Pilot
          Client. After a successful pilot: Proposal → Invoice → Payment.
        </GuideNote>
      </section>
    </GuideArticle>
  );
}
