"use client";

interface CareerApplyButtonProps {
  formLink: string;
}

export default function CareerApplyButton({ formLink }: CareerApplyButtonProps) {
  return (
    <a
      href={formLink || "#"}
      target={formLink ? "_blank" : "_self"}
      rel="noopener noreferrer"
      onClick={(e) => {
        if (!formLink) {
          e.preventDefault();
          alert(
            "The application form is not linked yet. Please check back later or email us directly!",
          );
        }
      }}
      className="bg-transparent text-white text-xs uppercase tracking-widest border border-white/20 px-6 py-3 hover:bg-gold-primary hover:text-black hover:border-gold-primary transition-all font-bold flex items-center gap-2"
    >
      Apply via Form <span>↗</span>
    </a>
  );
}
