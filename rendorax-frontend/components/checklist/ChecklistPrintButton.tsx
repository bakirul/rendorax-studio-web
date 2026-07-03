"use client";

export default function ChecklistPrintButton() {
  return (
    <div className="mt-12 text-center print:hidden">
      <button
        onClick={() => window.print()}
        className="bg-gold-primary text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors shadow-[0_0_20px_rgba(212,175,55,0.2)]"
      >
        Save as PDF / Print
      </button>
    </div>
  );
}
