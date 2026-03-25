"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Megaphone,
  UserCheck,
  Settings,
  LogOut,
  Zap,
  X,
  UserCircle2,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useSidebar } from "./sidebar-context";

const navGroups = [
  {
    label: "MAIN",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "CONTACTS",
    items: [
      { href: "/leads",    label: "Contacts",  icon: Users },
      { href: "/pipeline", label: "Pipeline",  icon: KanbanSquare },
      { href: "/clients",  label: "Clients",   icon: UserCircle2 },
    ],
  },
  {
    label: "GROWTH",
    items: [
      { href: "/campaigns",       label: "Campaigns",       icon: Megaphone },
      { href: "/team",            label: "Team",            icon: UserCheck },
      { href: "/email-marketing", label: "Email Marketing", icon: Mail },
    ],
  },
];

interface AuthUser {
  name: string;
  username: string;
  role: string;
  is_master_admin: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { open, close } = useSidebar();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setUser(d?.user ?? null));
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => { close(); }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  const initials = user
    ? user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const sidebarContent = (
    <aside className="flex flex-col h-full w-[220px] bg-white dark:bg-[#0D1526] border-r border-[#E2E6EF] dark:border-[#1C2D45]">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E6EF] dark:border-[#1C2D45]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#1E6FEB] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-[13px] font-bold text-slate-800 dark:text-white tracking-tight">LeadOS</span>
            <p className="text-[10px] text-slate-400 dark:text-[#4A6080] leading-none mt-0.5">Sales CRM</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={close}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-thin space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold tracking-widest text-slate-400 dark:text-[#506A8A] uppercase">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-all duration-150 relative",
                      isActive
                        ? "bg-[#EBF2FF] dark:bg-[#1E6FEB]/15 text-[#1E6FEB] dark:text-white font-semibold border-l-2 border-[#1E6FEB] pl-[10px]"
                        : "text-slate-600 dark:text-[#A8B8D0] hover:bg-slate-50 dark:hover:bg-[#162038] hover:text-slate-800 dark:hover:text-white font-medium border-l-2 border-transparent pl-[10px]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-[16px] h-[16px] shrink-0",
                        isActive ? "text-[#1E6FEB]" : "text-slate-400 dark:text-[#6A85A8]"
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-[#E2E6EF] dark:border-[#1C2D45] pt-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all border-l-2 pl-[10px]",
            pathname === "/settings"
              ? "bg-[#EBF2FF] dark:bg-[#1E6FEB]/15 text-[#1E6FEB] dark:text-white border-[#1E6FEB]"
              : "text-slate-600 dark:text-[#A8B8D0] hover:bg-slate-50 dark:hover:bg-[#162038] hover:text-slate-800 dark:hover:text-white border-transparent"
          )}
        >
          <Settings className="w-[16px] h-[16px] shrink-0 text-slate-400 dark:text-[#6A85A8]" strokeWidth={2} />
          Settings
        </Link>

        <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-lg hover:bg-slate-50 dark:hover:bg-[#162038] transition-all group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 dark:text-[#C8D0E0] truncate">
              {user?.name ?? "Loading..."}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-[#4A6080] truncate">
              {user?.is_master_admin ? "Master Admin" : user?.role ?? ""}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1 text-slate-300 dark:text-[#3A5070] hover:text-red-500 dark:hover:text-red-400 transition-colors rounded"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden lg:flex h-screen shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile: drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />
          {/* Drawer */}
          <div className="relative z-10 h-full animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
