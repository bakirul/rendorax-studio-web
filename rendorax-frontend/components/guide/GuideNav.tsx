"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GUIDE_NAV } from "./guideConfig";

export default function GuideNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Guide sections" className="space-y-8">
      {GUIDE_NAV.map((group) => (
        <div key={group.title}>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold-primary mb-3">
            {group.title}
          </p>
          <ul className="space-y-1.5">
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/guide" && pathname.startsWith(`${item.href}/`));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block text-sm py-1.5 px-2 -mx-2 rounded transition-colors ${
                      active
                        ? "text-white bg-white/5 border-l-2 border-gold-primary pl-[6px]"
                        : "text-text-gray hover:text-white border-l-2 border-transparent"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
