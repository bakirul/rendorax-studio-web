import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Rendorax Studio",
  description:
    "Start a project with Rendorax Studio. Submit your briefing for review and a technical consultation within 24 hours.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black">
      <Navbar />

      <header className="relative w-full max-w-4xl mx-auto px-6 pt-32 pb-16 flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>

        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-6 animate-pulse">
          Initiate Protocol
        </span>
        <h1 className="text-4xl md:text-6xl font-display leading-[1.1] mb-6 text-white">
          Start a{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-primary to-[#fff]">
            Project.
          </span>
        </h1>
        <p className="text-sm text-text-gray font-light max-w-2xl leading-relaxed">
          Submit your project briefing below. Our operations team reviews all
          inquiries within 24 hours to determine alignment and schedule a
          technical consultation.
        </p>
      </header>

      <section className="w-full max-w-3xl mx-auto px-6 pb-32 flex-grow">
        <ContactForm />
      </section>

      <Footer />
    </main>
  );
}
