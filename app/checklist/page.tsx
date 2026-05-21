"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function ChecklistPage() {
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    // বর্তমান তারিখ অটোমেটিকভাবে জেনারেট করার জন্য
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setCurrentDate(date);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen flex flex-col bg-bg-body text-text-gray font-main overflow-x-hidden selection:bg-gold-primary selection:text-black print:bg-white print:text-black">
      {/* Navbar - Hidden when printing */}
      <div className="print:hidden">
        <Navbar />
      </div>

      {/* Page Header - Hidden when printing */}
      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-12 flex flex-col items-center text-center print:hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-primary blur-[200px] opacity-10 -z-10 rounded-full pointer-events-none"></div>
        <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-6">
          Client Onboarding
        </span>
        <h1 className="text-4xl md:text-5xl font-display leading-[1.1] text-white mb-4">
          Expectation <span className="text-gold-primary">Checklist.</span>
        </h1>
        <p className="text-sm text-text-gray max-w-xl font-light">
          A mandatory alignment document to ensure broadcast standards,
          structured feedback loops, and timeline integrity before
          post-production begins.
        </p>
      </header>

      {/* The Printable Document Area */}
      <section className="w-full max-w-4xl mx-auto px-6 pb-32 flex-grow print:p-0 print:m-0 print:pb-0">
        <div className="bg-[#121418] border border-white/5 p-8 md:p-16 relative shadow-2xl print:shadow-none print:border-none print:bg-white print:p-0">
          {/* Document Header */}
          <div className="flex justify-between items-end border-b-2 border-gold-primary pb-8 mb-10 print:border-black">
            <div>
              {/* Brand Logo for Web (White/Gold) & Print (Black/Grayscale if needed) */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 border-2 border-gold-primary flex items-center justify-center print:border-black">
                  <span className="text-gold-primary font-display font-bold text-lg print:text-black">
                    K
                  </span>
                </div>
                <span className="text-xl font-display tracking-widest uppercase text-white print:text-black">
                  Kachna Media
                </span>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-white text-lg font-display mb-1 print:text-black">
                Client Expectation Checklist
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-gold-primary print:text-gray-600">
                Post-Production Alignment
              </p>
            </div>
          </div>

          {/* Checklist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {/* Column 1 */}
            <div className="space-y-10">
              {/* Section 01 */}
              <div>
                <span className="font-mono text-[10px] text-gold-primary bg-[#1f2228] px-3 py-1.5 uppercase tracking-widest mb-4 inline-block print:bg-gray-200 print:text-black print:border print:border-black">
                  01. Project Alignment
                </span>
                <div className="space-y-3">
                  <CheckItem
                    id="p1"
                    label="Final delivery platform is confirmed (TV / OTT / Digital)"
                  />
                  <CheckItem
                    id="p2"
                    label="Content duration & format are clearly defined"
                  />
                  <CheckItem
                    id="p3"
                    label="Language versions required are confirmed"
                  />
                  <CheckItem
                    id="p4"
                    label="Reference style (if any) is shared"
                  />
                </div>
              </div>

              {/* Section 02 */}
              <div>
                <span className="font-mono text-[10px] text-gold-primary bg-[#1f2228] px-3 py-1.5 uppercase tracking-widest mb-4 inline-block print:bg-gray-200 print:text-black print:border print:border-black">
                  02. Editorial Process
                </span>
                <div className="space-y-3">
                  <CheckItem
                    id="e1"
                    label="Editing will follow structured stages"
                  />
                  <CheckItem
                    id="e2"
                    label="Changes are expected per stage, not continuously"
                  />
                  <CheckItem
                    id="e3"
                    label="Creative decisions are respected once approved"
                  />
                </div>
              </div>

              {/* Section 03 */}
              <div>
                <span className="font-mono text-[10px] text-gold-primary bg-[#1f2228] px-3 py-1.5 uppercase tracking-widest mb-4 inline-block print:bg-gray-200 print:text-black print:border print:border-black">
                  03. Feedback & Approval
                </span>
                <div className="space-y-3">
                  <CheckItem
                    id="f1"
                    label="One person is responsible for final approval"
                  />
                  <CheckItem
                    id="f2"
                    label="Feedback will be consolidated, not fragmented"
                  />
                  <CheckItem
                    id="f3"
                    label="Timestamped or clearly written notes will be provided"
                  />
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-10">
              {/* Section 04 */}
              <div>
                <span className="font-mono text-[10px] text-gold-primary bg-[#1f2228] px-3 py-1.5 uppercase tracking-widest mb-4 inline-block print:bg-gray-200 print:text-black print:border print:border-black">
                  04. Audio & Delivery
                </span>
                <div className="space-y-3">
                  <CheckItem
                    id="a1"
                    label="Audio structure (stems / M&E) is agreed"
                  />
                  <CheckItem
                    id="a2"
                    label="Textless or clean masters are confirmed if needed"
                  />
                  <CheckItem
                    id="a3"
                    label="Delivery formats are aligned before export"
                  />
                </div>
              </div>

              {/* Section 05 */}
              <div>
                <span className="font-mono text-[10px] text-gold-primary bg-[#1f2228] px-3 py-1.5 uppercase tracking-widest mb-4 inline-block print:bg-gray-200 print:text-black print:border print:border-black">
                  05. Timelines
                </span>
                <div className="space-y-3">
                  <CheckItem
                    id="t1"
                    label="Deadlines consider content complexity"
                  />
                  <CheckItem
                    id="t2"
                    label="Feedback turnaround impacts final delivery"
                  />
                  <CheckItem
                    id="t3"
                    label="Primary communication channel is agreed"
                  />
                </div>
              </div>

              {/* Section 06 */}
              <div>
                <span className="font-mono text-[10px] text-gold-primary bg-[#1f2228] px-3 py-1.5 uppercase tracking-widest mb-4 inline-block print:bg-gray-200 print:text-black print:border print:border-black">
                  06. Standards
                </span>
                <div className="space-y-3">
                  <CheckItem
                    id="s1"
                    label="Broadcast-safe practices are mandatory"
                  />
                  <CheckItem
                    id="s2"
                    label="Export accuracy is prioritized over speed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="mt-16 pt-10 border-t border-dashed border-white/20 print:border-black">
            <p className="font-display italic text-white text-lg border-l-2 border-gold-primary pl-4 mb-10 print:text-black print:border-black">
              "I understand that professional post-production depends on
              clarity, structure, and timely feedback."
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-text-gray mb-2 print:text-gray-600">
                  Client Name
                </label>
                <input
                  type="text"
                  className="w-full bg-transparent border-b border-text-gray/50 text-white py-2 focus:outline-none focus:border-gold-primary print:text-black print:border-black"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-text-gray mb-2 print:text-gray-600">
                  Date
                </label>
                <input
                  type="text"
                  value={currentDate}
                  readOnly
                  className="w-full bg-transparent border-b border-text-gray/50 text-white py-2 focus:outline-none print:text-black print:border-black"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-text-gray mb-2 print:text-gray-600">
                Signature / Confirmation
              </label>
              <input
                type="text"
                placeholder="(Type Name to Sign)"
                className="w-full bg-transparent border-b border-text-gray/50 text-white py-2 focus:outline-none focus:border-gold-primary placeholder:text-text-gray/30 print:text-black print:border-black print:placeholder:text-transparent"
              />
            </div>
          </div>
        </div>

        {/* Action Button - Hidden when printing */}
        <div className="mt-12 text-center print:hidden">
          <button
            onClick={handlePrint}
            className="bg-gold-primary text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors shadow-[0_0_20px_rgba(212,175,55,0.2)]"
          >
            Save as PDF / Print
          </button>
        </div>
      </section>

      {/* Footer - Hidden when printing */}
      <div className="print:hidden">
        <Footer />
      </div>
    </main>
  );
}

// Reusable Checkbox Component
const CheckItem = ({ id, label }: { id: string; label: string }) => (
  <div className="flex items-start gap-3 group cursor-pointer">
    <div className="relative flex items-center justify-center mt-1 shrink-0">
      <input
        type="checkbox"
        id={id}
        className="peer appearance-none w-4 h-4 border border-text-gray/50 checked:border-gold-primary cursor-pointer transition-colors print:border-black"
      />
      <div className="absolute inset-0 bg-gold-primary scale-0 peer-checked:scale-100 transition-transform pointer-events-none print:peer-checked:bg-black"></div>
    </div>
    <label
      htmlFor={id}
      className="text-sm text-text-gray group-hover:text-white peer-checked:text-white cursor-pointer transition-colors leading-snug print:text-gray-800 print:peer-checked:text-black"
    >
      {label}
    </label>
  </div>
);
