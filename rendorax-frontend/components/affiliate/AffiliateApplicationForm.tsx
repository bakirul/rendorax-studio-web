"use client";

import { useState } from "react";

export default function AffiliateApplicationForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    linkedinUrl: "",
    networkSummary: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="bg-bg-panel border border-white/5 p-8 relative">
      <h3 className="text-base uppercase tracking-widest text-gold-primary mb-6 border-b border-white/10 pb-3">
        Request Authorization
      </h3>

      {formSubmitted ? (
        <div className="py-12 text-center space-y-4">
          <div className="w-12 h-12 bg-gold-primary/10 text-gold-primary border border-gold-primary/30 rounded-full flex items-center justify-center mx-auto text-xl shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            ✓
          </div>
          <h4 className="text-white text-lg font-display uppercase tracking-widest mt-4">
            Application Under Review
          </h4>
          <p className="text-text-gray text-xs max-w-sm mx-auto leading-relaxed mt-2">
            Your credentials have been securely transmitted to our vetting
            team. If your profile aligns with our operational standards, you
            will receive your authorization access via email within 48-72
            hours.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
              Legal Full Name
            </label>
            <input
              required
              type="text"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="John Doe"
              className="w-full bg-black border border-white/10 p-3 text-white focus:border-gold-primary outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
              Business Email Address
            </label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="john@agency.com"
              className="w-full bg-black border border-white/10 p-3 text-white focus:border-gold-primary outline-none transition-colors"
            />
          </div>
          <div className="border-t border-white/10 my-4 pt-4">
            <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
              LinkedIn Profile / Agency URL (For Vetting)
            </label>
            <input
              required
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) =>
                setFormData({ ...formData, linkedinUrl: e.target.value })
              }
              placeholder="https://linkedin.com/in/yourprofile"
              className="w-full bg-black border border-white/10 p-3 text-white focus:border-gold-primary outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
              Network Summary & Acquisition Strategy
            </label>
            <textarea
              required
              rows={4}
              value={formData.networkSummary}
              onChange={(e) =>
                setFormData({ ...formData, networkSummary: e.target.value })
              }
              placeholder="Briefly describe your current client base and how you plan to refer high-ticket post-production leads..."
              className="w-full bg-black border border-white/10 p-3 text-white focus:border-gold-primary outline-none custom-scrollbar transition-colors"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-gold-primary text-black font-bold text-xs uppercase tracking-[0.2em] py-4 mt-4 hover:bg-white transition-all duration-300"
          >
            Submit For Authorization
          </button>
        </form>
      )}
    </div>
  );
}
