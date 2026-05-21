"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function AffiliatePage() {
  const [formData, setFormData] = useState({
    partnerName: "",
    partnerEmail: "",
    clientName: "",
    projectBrief: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // পরবর্তীতে এখানে Supabase বা Email API যুক্ত করা যাবে
    setFormSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-black text-text-white selection:bg-gold-primary selection:text-black flex flex-col justify-between relative overflow-hidden">
      {/* Background Cinematic Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gold-primary blur-[200px] opacity-5 -z-10 pointer-events-none"></div>

      {/* Top Bar / Navigation Pointer */}
      <div className="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center relative z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-text-gray group-hover:text-gold-primary transition-colors text-xs uppercase tracking-widest">
            ← Back to Home
          </span>
        </Link>
        <span className="text-[10px] uppercase tracking-widest text-gold-primary border border-gold-primary/20 px-3 py-1 font-mono">
          B2B Network
        </span>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-5xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start relative z-10">
        {/* Left Side: Policy & Commission Structure */}
        <div className="space-y-8">
          <div>
            <span className="text-gold-primary text-xs font-bold uppercase tracking-[0.3em] mb-3 block">
              Agency Partner Program
            </span>
            <h1 className="text-4xl md:text-5xl font-display leading-tight text-white">
              Bring in Work.
              <br />
              Earn Competitive Rewards.
            </h1>
            <p className="text-text-gray text-sm mt-4 leading-relaxed">
              Kachna Media-এর পার্টনার নেটওয়ার্কে আপনাকে স্বাগতম। আপনি যদি কোনো
              ব্র্যান্ড, ক্রিয়েটর বা এজেন্সির ভিডিও প্রোডাকশন বা পোস্ট-প্রোডাকশন
              প্রজেক্ট আমাদের সাথে কানেক্ট করে দিতে পারেন, তবে প্রতিটি সফল ডিল
              থেকে আপনি একটি সলিড রেভিনিউ শেয়ার পাবেন।
            </p>
          </div>

          {/* Program Pillars */}
          <div className="space-y-4 border-t border-white/5 pt-6">
            <div className="flex gap-4">
              <div className="text-gold-primary font-mono text-sm shrink-0">
                01 /
              </div>
              <div>
                <h4 className="text-white text-sm uppercase tracking-wider font-semibold">
                  10% - 15% Commission Structure
                </h4>
                <p className="text-text-gray text-xs mt-1 leading-relaxed">
                  প্রতিটি প্রজেক্টের মোট বাজেট ক্লিয়ার হওয়ার পর সেটির ১০% থেকে
                  ১৫% সরাসরি আপনার পার্টনার অ্যাকাউন্টে ট্রান্সফার করা হবে।
                </p>
              </div>
            </div>

            <div className="flex gap-4 border-t border-white/5 pt-4">
              <div className="text-gold-primary font-mono text-sm shrink-0">
                02 /
              </div>
              <div>
                <h4 className="text-white text-sm uppercase tracking-wider font-semibold">
                  Zero Financial Risk (Milestone Locked)
                </h4>
                <p className="text-text-gray text-xs mt-1 leading-relaxed">
                  ক্লায়েন্ট যখন ইনভয়েস পরিশোধ করবে, আপনার কমিশন তখনই লক হয়ে
                  যাবে। কোনো জটিল হিডেন পলিসি বা ফাইন্যান্সিয়াল রিস্ক নেই।
                </p>
              </div>
            </div>

            <div className="flex gap-4 border-t border-white/5 pt-4">
              <div className="text-gold-primary font-mono text-sm shrink-0">
                03 /
              </div>
              <div>
                <h4 className="text-white text-sm uppercase tracking-wider font-semibold">
                  Full Technical Ownership by HQ
                </h4>
                <p className="text-text-gray text-xs mt-1 leading-relaxed">
                  আপনার কাজ শুধু লিড বা ক্লায়েন্টকে ইন্ট্রোডিউস করিয়ে দেওয়া।
                  কোয়ালিটি কন্ট্রোল, ক্লায়েন্ট ভল্ট ম্যানেজমেন্ট এবং প্রোডাকশনের
                  পুরো দায়িত্ব আমাদের ব্রডকাস্ট টিমের।
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Lead Submission Form */}
        <div className="bg-bg-panel border border-white/5 p-8 relative">
          <h3 className="text-base uppercase tracking-widest text-gold-primary mb-6 border-b border-white/10 pb-3">
            Submit Deal / Reference
          </h3>

          {formSubmitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 bg-gold-primary/10 text-gold-primary rounded-full flex items-center justify-center mx-auto text-xl">
                ✓
              </div>
              <h4 className="text-white text-lg font-display">
                Lead Transmitted successfully!
              </h4>
              <p className="text-text-gray text-xs max-w-sm mx-auto leading-relaxed">
                আমাদের টিম আপনার সাবমিট করা লিডটি পর্যালোচনা করে খুব দ্রুত আপনার
                ইমেইলে যোগাযোগ করবে। ধন্যবাদ!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                  Your Full Name
                </label>
                <input
                  required
                  type="text"
                  value={formData.partnerName}
                  onChange={(e) =>
                    setFormData({ ...formData, partnerName: e.target.value })
                  }
                  placeholder="e.g. Robin Ahmed"
                  className="w-full bg-black border border-white/10 p-3 text-white focus:border-gold-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                  Your Email Address
                </label>
                <input
                  required
                  type="email"
                  value={formData.partnerEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, partnerEmail: e.target.value })
                  }
                  placeholder="robin@example.com"
                  className="w-full bg-black border border-white/10 p-3 text-white focus:border-gold-primary outline-none"
                />
              </div>
              <div className="border-t border-white/10 my-4 pt-4">
                <label className="block text-[10px] uppercase tracking-widest text-gold-primary mb-2">
                  Potential Client Name / Company
                </label>
                <input
                  required
                  type="text"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  placeholder="e.g. Apex Ltd. or Channel X"
                  className="w-full bg-black border border-white/10 p-3 text-white focus:border-gold-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-text-gray mb-2">
                  Project Brief / Expected Work
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.projectBrief}
                  onChange={(e) =>
                    setFormData({ ...formData, projectBrief: e.target.value })
                  }
                  placeholder="পটেনশিয়াল কাজের একটি ছোট বিবরণ দিন (যেমন: কমার্শিয়াল কালার গ্রেডিং বা ২ ঘণ্টার ডকুমেন্টারি এডিট)..."
                  className="w-full bg-black border border-white/10 p-3 text-white focus:border-gold-primary outline-none custom-scrollbar"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-gold-primary text-black font-bold uppercase tracking-widest py-4 mt-2 hover:bg-white transition-colors"
              >
                Register Lead
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Global Footer Component Integration */}
      <Footer />
    </main>
  );
}
