"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  FileText,
  Gift,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  PiggyBank,
  ScrollText,
  Settings,
  Users,
  X,
} from "lucide-react";
import Logo from "@/components/Logo";

type AdminSidebarProps = {
  punguanId: string;
  punguanName: string;
  role: string;
  userName?: string | null;
  userEmail?: string | null;
};

type NavigationItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export default function AdminSidebar({
  punguanId,
  punguanName,
  role,
  userName,
  userEmail,
}: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems: NavigationItem[] = [
    { name: "Dashboard", href: `/p/${punguanId}/dashboard`, icon: LayoutDashboard },
    { name: "Daftar KK", href: `/p/${punguanId}/kk`, icon: Users },
    { name: "Iuran", href: `/p/${punguanId}/iuran`, icon: CreditCard },
    { name: "Arisan", href: `/p/${punguanId}/arisan`, icon: Gift },
    { name: "Tabungan", href: `/p/${punguanId}/tabungan`, icon: PiggyBank },
    { name: "Pengumuman", href: `/p/${punguanId}/pengumuman`, icon: Megaphone },
    { name: "Laporan", href: `/p/${punguanId}/laporan`, icon: FileText },
    { name: "AD/ART", href: `/p/${punguanId}/ad-art`, icon: ScrollText },
    { name: "Pengaturan", href: `/p/${punguanId}/pengaturan`, icon: Settings },
  ];

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  const navigation = (onNavigate?: () => void) => (
    <nav className="flex-1 overflow-y-auto py-4">
      <ul className="space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                prefetch={false}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-12 items-center rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-red-900/70 bg-red-950 text-white"
                    : "border-transparent text-stone-300 hover:border-red-900/50 hover:bg-red-950 hover:text-white"
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 shrink-0 ${isActive ? "text-red-400" : "text-red-700"}`} />
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const identity = (
    <>
      <div className="flex items-center gap-3">
        <Logo size={32} className="shrink-0" />
        <div className="min-w-0">
          <h2 className="font-serif text-xl font-bold text-white">HorasHub</h2>
          <p className="mt-0.5 truncate text-sm text-stone-400">{punguanName}</p>
        </div>
      </div>
      <div className="mt-3 inline-flex rounded border border-red-800 bg-red-900/80 px-2.5 py-1 text-xs font-semibold tracking-wider text-red-100">
        ROLE: {role}
      </div>
    </>
  );

  const account = (
    <div className="flex items-center gap-3 border-t border-stone-800 bg-stone-950 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-800 bg-red-900 text-sm font-semibold text-red-100">
        {userName?.charAt(0) ?? "U"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{userName}</p>
        <p className="truncate text-xs text-stone-500">{userEmail}</p>
      </div>
      <Link
        href="/api/auth/signout"
        aria-label="Keluar dari akun"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-900 hover:text-red-400"
      >
        <LogOut className="h-5 w-5" />
      </Link>
    </div>
  );

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 shadow-sm md:hidden">
        <button
          type="button"
          aria-label="Buka menu navigasi"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-md text-stone-700 transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="min-w-0 text-right">
          <p className="text-sm font-semibold text-stone-800">Panel Administrasi</p>
          <p className="max-w-52 truncate text-xs text-stone-500">{punguanName}</p>
        </div>
      </header>

      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:bg-stone-900 md:text-stone-100 md:shadow-xl md:z-10 md:border-r md:border-stone-800">
        <div className="relative overflow-hidden border-b border-stone-800 bg-stone-950 p-6">
          {identity}
        </div>
        {navigation()}
        {account}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <button
            type="button"
            aria-label="Tutup menu navigasi"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-stone-950/55"
          />
          <aside className="fixed inset-y-0 left-0 flex w-[86vw] max-w-80 flex-col bg-stone-900 text-stone-100 shadow-2xl">
            <div className="relative border-b border-stone-800 bg-stone-950 p-5">
              <button
                type="button"
                aria-label="Tutup menu navigasi"
                onClick={() => setIsOpen(false)}
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-md text-stone-300 hover:bg-stone-900 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              {identity}
            </div>
            {navigation(() => setIsOpen(false))}
            {account}
          </aside>
        </div>
      )}
    </>
  );
}
