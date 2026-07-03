import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CONTACT_EMAIL } from "@/utils/contactEmail";

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <header className="relative w-full max-w-4xl mx-auto px-6 pt-32 pb-16 flex flex-col items-center text-center">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold-primary blur-[150px] opacity-5 -z-10 rounded-full pointer-events-none"></div>

        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-6">
          Studio Protocol
        </span>
        <h1 className="text-4xl md:text-6xl font-display leading-[1.1] mb-6 text-white">
          Terms & <span className="text-gold-primary">Conditions.</span>
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-text-gray/50 font-mono">
          Effective Date: May 20, 2026
        </p>
      </header>

      {/* Content Section */}
      <section className="w-full max-w-4xl mx-auto px-6 pb-32 flex-grow">
        <div className="bg-bg-panel border border-white/5 p-8 md:p-16 space-y-12 text-sm leading-relaxed font-light">
          {/* 1. Engagement & Scope */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              1. Engagement of Services
            </h2>
            <p className="text-text-gray">
              By initiating a project briefing, signing a studio contract, or
              transmitting production assets to Rendorax Limited, you agree
              to be legally bound by these Terms and Conditions. Our services
              encompass broadcast-grade video editing, cinematic color grading,
              sound design, LUFS-compliant audio mastering, animation continuity
              tracking, and general post-production execution.
            </p>
          </div>

          {/* 2. Financial Framework & Milestones */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              2. Financial Framework & Payments
            </h2>
            <p className="text-text-gray mb-4">
              All post-production engagements are subject to a strict milestone
              payment structure:
            </p>
            <ul className="list-none space-y-3 pl-0 text-text-gray">
              <li className="flex gap-3 items-start">
                <span className="text-gold-primary font-mono text-xs">2.1</span>
                <div>
                  <strong className="text-white block">
                    Commencement Deposit:
                  </strong>{" "}
                  A non-refundable 50% advance payment of the total estimated
                  project budget is mandatory to lock studio calendar time and
                  initiate editorial assembly.
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-gold-primary font-mono text-xs">2.2</span>
                <div>
                  <strong className="text-white block">
                    Milestone Delivery:
                  </strong>{" "}
                  Payments must be routed through our verified corporate
                  channels (e.g., global electronic bank transfers or Payoneer
                  business receiving networks).
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-gold-primary font-mono text-xs">2.3</span>
                <div>
                  <strong className="text-white block">
                    Final Master Release:
                  </strong>{" "}
                  The remaining 50% balance must be settled and cleared in full
                  before any unwatermarked, high-resolution broadcast masters,
                  multi-channel audio stems, or textless versions are delivered.
                </div>
              </li>
            </ul>
          </div>

          {/* 3. Asset Transmission & Raw Footage */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              3. Asset Submission & Archival Policy
            </h2>
            <p className="text-text-gray">
              The Client is entirely responsible for the integrity, legal
              clearance, and backup of all source footage, offline files, and
              music licenses transmitted to our secure servers. Rendorax
              Limited implements secure data storage protocols for active
              projects. However, we do not provide permanent cloud hosting.
              Unless otherwise agreed upon via a custom retainer contract, all
              raw project assets and temporary scratch files are purged from our
              local arrays thirty (30) days following final master approval.
            </p>
          </div>

          {/* 4. Editorial Judgment & Revisions */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              4. Editorial Review & Revision Protocols
            </h2>
            <p className="text-text-gray mb-4">
              We apply senior broadcast judgment to every cut. To maintain tight
              production timelines and operational efficiency, standard projects
              include:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-text-gray">
              <li>
                Two (2) comprehensive rounds of consolidated editorial feedback
                during the rough-cut phase.
              </li>
              <li>
                Feedback must be provided using our synchronized timecode review
                platform inside the Client Vault.
              </li>
              <li>
                Subsequent modifications, structural changes post-picture-lock,
                or revision loops extending beyond the agreed scope will be
                automatically billed under our standard hourly editorial rate
                card.
              </li>
            </ul>
          </div>

          {/* 5. Intellectual Property & Rights */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              5. Copyright & Intellectual Property
            </h2>
            <p className="text-text-gray">
              Upon final balance clearance, full copyright ownership of the
              finished post-production master is transferred to the Client.
              Rendorax Limited retains the perpetual, non-exclusive right to
              utilize excerpts, behind-the-scenes timelines, and watermarked
              sequences of the completed works solely for studio portfolio
              showreels, case studies, and promotional self-marketing, unless
              explicitly restricted by a signed Non-Disclosure Agreement (NDA)
              before project commencement.
            </p>
          </div>

          {/* 6. Jurisdiction */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              6. Governing Law
            </h2>
            <p className="text-text-gray">
              These terms are governed by and construed in accordance with the
              laws of the People's Republic of Bangladesh. Any legal disputes,
              claims, or arbitration arising from studio service failures,
              copyright issues, or outstanding financial debts will fall under
              the exclusive jurisdiction of the courts located in Dhaka,
              Bangladesh.
            </p>
          </div>

          {/* Contact Section */}
          <div className="pt-10 border-t border-white/5">
            <h2 className="text-xl font-display text-white mb-4">
              Legal Queries
            </h2>
            <p className="text-text-gray font-light mb-6">
              For corporate contract signing, custom master-service agreements,
              or clarification regarding these studio terms, please communicate
              with our administration team:
            </p>
            <div className="bg-black border border-white/10 p-6 rounded-sm">
              <p className="text-sm text-text-gray font-mono leading-loose">
                <strong className="text-white">Rendorax Limited</strong>
                <br />
                Operations & Compliance Hub
                <br />
                Dhaka, Bangladesh
                <br />
                Contact:{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-gold-primary hover:text-white transition-colors"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
