"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Megaphone,
  UserCheck,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "MAIN",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "LEADS",
    items: [
      { href: "/leads",    label: "Leads",     icon: Users },
      { href: "/pipeline", label: "Pipeline",  icon: KanbanSquare },
    ],
  },
  {
    label: "GROWTH",
    items: [
      { href: "/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/team",      label: "Team",      icon: UserCheck },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-screen w-[220px] shrink-0 bg-white dark:bg-[#141628] border-r border-slate-100 dark:border-white/[0.06]">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40">
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">LeadOS</span>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">WhatsApp CRM</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-thin space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-slate-400 dark:text-slate-600 uppercase">
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
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-[18px] h-[18px] shrink-0",
                        isActive ? "text-indigo-500 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span>{label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom — user + settings */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-slate-100 dark:border-white/[0.06] pt-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
            pathname === "/settings"
              ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Settings className="w-[18px] h-[18px] shrink-0 text-slate-400" strokeWidth={2} />
          Settings
        </Link>

        {/* User profile */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer transition-all group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white">EC</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">Eric Cheah</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">Admin</p>
          </div>
          <LogOut className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
        </div>
      </div>
    </aside>
  );
}
