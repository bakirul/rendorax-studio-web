"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "About", path: "/studio" },
    { name: "Work", path: "/portfolio" },
    { name: "Services", path: "/services" },
    { name: "How It Works", path: "/guide" },
    { name: "Pricing", path: "/pricing" },
    { name: "Journal", path: "/journal" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <div className="container mx-auto px-6">
      <nav className="flex items-center justify-between w-full py-6 relative z-50">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            alt="Rendorax Logo"
            className="object-contain"
            height={32}
            src="/assets/logo.svg"
            width={32}
          />
          <span className="font-display text-lg md:text-xl tracking-[0.2em] uppercase text-white">
            Rendorax
          </span>
        </Link>

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

        <div
          className={`
            absolute md:static top-full left-0 w-full md:w-auto
            bg-bg-body/98 md:bg-transparent border-b border-gold-primary/30 md:border-none
            flex flex-col md:flex-row items-center gap-0 md:gap-6 lg:gap-8
            overflow-hidden transition-all duration-500 ease-in-out backdrop-blur-md md:backdrop-blur-none
            ${isOpen ? "max-h-[560px] py-8 md:py-0 shadow-2xl" : "max-h-0 md:max-h-full py-0"}
          `}
        >
          {navLinks.map((item) => {
            const isActive =
              pathname === item.path || pathname?.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`text-[0.85rem] uppercase tracking-[0.1em] my-3 md:my-0 transition-colors ${
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

          <div className="flex flex-col md:flex-row items-center gap-4 mt-4 md:mt-0 md:ml-4">
            <Link
              href="/access"
              className="px-5 py-2.5 border border-gold-primary text-gold-primary text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 hover:bg-gold-primary hover:text-black rounded-sm"
              onClick={() => setIsOpen(false)}
            >
              Client Login
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
