"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

const links = [
  { href: "/news", label: "News" },
  { href: "/my-leagues", label: "My Leagues" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <Link
          href="/"
          className="text-lg sm:text-xl font-bold tracking-tight text-gray-900"
        >
          The Fantasy Golf Association
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6 text-sm sm:text-base font-medium">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`transition-colors ${
                  active
                    ? "text-emerald-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {signedIn === null ? (
            <span className="w-20 h-9" aria-hidden="true" />
          ) : signedIn ? (
            <Link
              href="/profile"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Profile
            </Link>
          ) : (
            <Link
              href="/login"
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
