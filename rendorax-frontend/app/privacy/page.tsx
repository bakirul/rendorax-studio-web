import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CONTACT_EMAIL } from "@/utils/contactEmail";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <header className="relative w-full max-w-4xl mx-auto px-6 pt-32 pb-16 flex flex-col items-center text-center">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold-primary blur-[150px] opacity-5 -z-10 rounded-full pointer-events-none"></div>

        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-6">
          Legal Compliance
        </span>
        <h1 className="text-4xl md:text-6xl font-display leading-[1.1] mb-6 text-white">
          Privacy <span className="text-gold-primary">Policy.</span>
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-text-gray/50 font-mono">
          Last Updated: May 20, 2026
        </p>
      </header>

      {/* Content Section */}
      <section className="w-full max-w-4xl mx-auto px-6 pb-32 flex-grow">
        <div className="bg-bg-panel border border-white/5 p-8 md:p-16 space-y-12">
          {/* 1. Introduction */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              1. Introduction
            </h2>
            <p className="text-sm leading-relaxed text-text-gray font-light">
              Rendorax Limited ("we," "our," or "us") respects your privacy
              and is committed to protecting your personal data and project
              assets. This Privacy Policy outlines how we collect, use, and
              safeguard your information when you visit our website
              (rendorax.com), use our Client Vault, or engage with our
              post-production and digital services.
            </p>
          </div>

          {/* 2. Data We Collect */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              2. Data We Collect
            </h2>
            <ul className="list-none space-y-4 text-sm text-text-gray font-light">
              <li className="flex gap-4 items-start">
                <span className="text-gold-primary mt-1">■</span>
                <div>
                  <strong className="text-white block mb-1">
                    Identity & Contact Data:
                  </strong>
                  Names, email addresses, billing addresses, and company
                  affiliations when you submit an inquiry or register for the
                  Client Vault.
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="text-gold-primary mt-1">■</span>
                <div>
                  <strong className="text-white block mb-1">
                    Production Assets:
                  </strong>
                  Raw footage, audio stems, scripts, and other proprietary files
                  transmitted through our secure protocols for editing and
                  mastering.
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="text-gold-primary mt-1">■</span>
                <div>
                  <strong className="text-white block mb-1">
                    Technical Data:
                  </strong>
                  IP addresses, browser types, and usage data collected via
                  essential cookies for site security and analytics.
                </div>
              </li>
            </ul>
          </div>

          {/* 3. How We Use Your Data */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-sm leading-relaxed text-text-gray font-light mb-4">
              We strictly utilize the collected information for core business
              operations, including:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-text-gray font-light">
              <li>
                Executing post-production contracts and delivering final master
                files.
              </li>
              <li>
                Managing your account securely within the Client Vault
                dashboard.
              </li>
              <li>
                Processing payments through authorized gateways (e.g.,
                Payoneer).
              </li>
              <li>
                Maintaining and optimizing our digital infrastructure and
                applications.
              </li>
            </ul>
          </div>

          {/* 4. Data Security & Confidentiality */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              4. Security & Non-Disclosure
            </h2>
            <p className="text-sm leading-relaxed text-text-gray font-light">
              We implement broadcast-industry standard security protocols to
              prevent your personal data and unreleased footage from being
              accidentally lost, altered, or accessed in an unauthorized way.
              Access to your production assets is strictly limited to authorized
              editorial staff working directly on your project under NDA. We do
              not sell, rent, or monetize your data.
            </p>
          </div>

          {/* 5. Third-Party Services */}
          <div>
            <h2 className="text-xl font-display text-white mb-4">
              5. Third-Party Integrations
            </h2>
            <p className="text-sm leading-relaxed text-text-gray font-light">
              Our studio ecosystem integrates third-party tools for workflow
              automation, secure hosting, and payment processing. These
              providers adhere to their own strict privacy frameworks and are
              only granted data access necessary to perform their specific
              functions for Rendorax.
            </p>
          </div>

          {/* Contact Section */}
          <div className="pt-10 border-t border-white/5">
            <h2 className="text-xl font-display text-white mb-4">
              Contacting the Data Controller
            </h2>
            <p className="text-sm leading-relaxed text-text-gray font-light mb-6">
              If you have any questions regarding this policy or wish to request
              the deletion of your project files from our archival servers,
              please contact headquarters:
            </p>
            <div className="bg-black border border-white/10 p-6 rounded-sm">
              <p className="text-sm text-text-gray font-mono leading-loose">
                <strong className="text-white">Rendorax Limited</strong>
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
