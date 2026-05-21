"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // SEO আর্কিটেকচার অনুযায়ী লিংক ম্যাপিং
  const navLinks = [
    { name: "About", path: "/studio" },
    { name: "Work", path: "/portfolio" },
    { name: "Services", path: "/services" },
    { name: "Pricing", path: "/pricing" },
    { name: "Journal", path: "/journal" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <div className="container mx-auto px-6">
      <nav className="flex items-center justify-between w-full py-6 relative z-50">
        {/* 1. Brand Logo */}
        <Link href="/" className="block shrink-0">
          <Image
            src="/assets/logo.png"
            alt="Kachna Media"
            width={150}
            height={75}
            className="h-[50px] md:h-[75px] w-auto transition-transform hover:scale-105"
            priority
          />
        </Link>

        {/* 2. Hamburger Icon (Mobile) */}
        <div
          className="md:hidden flex flex-col gap-[6px] cursor-pointer z-[101]"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span
            className={`w-[30px] h-[2px] bg-gold-primary transition-all duration-300 ${
              isOpen ? "rotate-45 translate-y-[8px]" : ""
            }`}
          ></span>
          <span
            className={`w-[30px] h-[2px] bg-gold-primary transition-all duration-300 ${
              isOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            className={`w-[30px] h-[2px] bg-gold-primary transition-all duration-300 ${
              isOpen ? "-rotate-45 -translate-y-[8px]" : ""
            }`}
          ></span>
        </div>

        {/* 3. Navigation Links */}
        <div
          className={`
          absolute md:static top-full left-0 w-full md:w-auto
          bg-bg-body/98 md:bg-transparent border-b border-gold-primary/30 md:border-none
          flex flex-col md:flex-row items-center gap-0 md:gap-8
          overflow-hidden transition-all duration-500 ease-in-out backdrop-blur-md md:backdrop-blur-none
          ${isOpen ? "max-h-[500px] py-8 md:py-0 shadow-2xl" : "max-h-0 md:max-h-full py-0"}
        `}
        >
          {navLinks.map((item) => {
            const isActive =
              pathname === item.path || pathname?.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`text-[0.85rem] uppercase tracking-[0.1em] my-4 md:my-0 transition-colors ${
                  isActive
                    ? "text-gold-primary font-bold border-b border-gold-primary pb-1"
                    : "text-text-gray hover:text-gold-primary"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            );
          })}

          {/* 4. Legacy Protocol (Client Access Vault) */}
          <Link
            href="/access"
            className="group ml-0 md:ml-6 mt-4 md:mt-0 px-5 py-2.5 border border-gold-primary/40 bg-gold-primary/5 text-gold-primary text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all duration-500 hover:bg-gold-primary hover:text-black hover:shadow-[0_0_25px_rgba(212,175,55,0.3)] shadow-[0_0_15px_rgba(212,175,55,0.05)]"
            onClick={() => setIsOpen(false)}
          >
            {/* Tailwind's built-in pulse animation */}
            <span className="w-1.5 h-1.5 bg-gold-primary rounded-full animate-pulse group-hover:bg-black group-hover:animate-none"></span>
            Legacy Protocol
          </Link>
        </div>
      </nav>
    </div>
  );
}
