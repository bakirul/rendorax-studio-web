import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/utils/contactEmail";

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <header className="relative w-full max-w-4xl mx-auto px-6 pt-32 pb-16 flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold-primary blur-[150px] opacity-5 -z-10 rounded-full pointer-events-none"></div>

        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-6">
          Financial Policy
        </span>
        <h1 className="text-4xl md:text-6xl font-display leading-[1.1] mb-6 text-white">
          Refund & <span className="text-gold-primary">Cancellation.</span>
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-text-gray/50 font-mono">
          Last Updated: May 20, 2026
        </p>
      </header>

      {/* Content Section */}
      <section className="w-full max-w-4xl mx-auto px-6 pb-32 flex-grow">
        <div className="bg-bg-panel border border-white/5 p-8 md:p-16 space-y-12 text-sm leading-relaxed font-light">
          {/* 1. Booking Deposit Non-Refundability */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              1. Commencement Deposits
            </h2>
            <p className="text-text-gray">
              As outlined in our Studio Protocols, a 50% advance deposit is
              required to secure calendar slots and initiate any offline editing
              or post-production assembly. Because our senior editors and
              grading suites are locked exclusively for your project upon
              payment, this 50% commencement deposit is{" "}
              <strong>entirely non-refundable</strong> under any circumstances
              once studio work or timeline architecture has begun.
            </p>
          </div>

          {/* 2. Cancellation & Rescheduling Windows */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              2. Rescheduling & Project Delays
            </h2>
            <p className="text-text-gray mb-4">
              We understand that production timelines can shift. To manage our
              facility capacity, we enforce the following scheduling windows:
            </p>
            <ul className="list-none space-y-3 pl-0 text-text-gray">
              <li className="flex gap-3 items-start">
                <span className="text-gold-primary font-mono text-xs">2.1</span>
                <div>
                  <strong className="text-white block">
                    Notice Period (7+ Days):
                  </strong>{" "}
                  If you notify us at least seven (7) business days prior to the
                  agreed-upon project kickoff date, your deposit can be fully
                  migrated to a future booking slot within ninety (90) days
                  without penalty.
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-gold-primary font-mono text-xs">2.2</span>
                <div>
                  <strong className="text-white block">
                    Late Rescheduling (Within 7 Days):
                  </strong>{" "}
                  Rescheduling requests made within seven (7) business days of
                  kickoff will incur a 15% studio re-allocation fee, deducted
                  from the initial advance deposit.
                </div>
              </li>
            </ul>
          </div>

          {/* 3. Mid-Project Termination (Kill Fee) */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              3. Mid-Project Termination
            </h2>
            <p className="text-text-gray">
              If a project is canceled or placed on an indefinite hold by the
              Client mid-way through execution (post-rough-cut or after look
              development), a prorated "Kill Fee" will be assessed. The Client
              will be billed for all actual hours worked by the editorial staff
              up to that point at our standard rate card ($75/hr). Any remaining
              portion of the advance deposit after satisfying the accrued hourly
              costs will be issued as a studio credit. No cash or electronic
              refunds will be disbursed for mid-project terminations.
            </p>
          </div>

          {/* 4. Technical Failures & Force Majeure */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              4. Facility Liability & Failures
            </h2>
            <p className="text-text-gray">
              In the extremely rare event that Rendorax Limited fails to
              meet a critical milestone due to catastrophic technical failures,
              hardware corruption, or acts of God (Force Majeure), we will
              exhaust all redundant backup nodes and cloud architectures to
              deliver the masters. If delivery remains impossible, a full 100%
              refund of all collected amounts for that specific milestone will
              be immediately processed back to your original payment route.
            </p>
          </div>

          {/* Contact Section */}
          <div className="pt-10 border-t border-white/5">
            <h2 className="text-xl font-display text-white mb-4">
              Billing Resolutions
            </h2>
            <p className="text-text-gray font-light mb-6">
              For any payment inquiries, ledger disputes, or refund tracking
              requests, please reach out directly to our financial compliance
              office:
            </p>
            <div className="bg-black border border-white/10 p-6 rounded-sm">
              <p className="text-sm text-text-gray font-mono leading-loose">
                <strong className="text-white">Rendorax Limited</strong>
                <br />
                Finance & Billing Operations
                <br />
                Dhaka, Bangladesh
                <br />
                Email:{" "}
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
