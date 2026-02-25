"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}

export default function NavLink({ href, children, exact = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-zinc-100 text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      {children}
    </Link>
  );
}
