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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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

interface AuthUser {
  name: string;
  username: string;
  role: string;
  is_master_admin: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setUser(d?.user ?? null));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  const initials = user
    ? user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <aside className="flex flex-col h-screen w-[220px] shrink-0 bg-white dark:bg-[#181B2C] border-r border-[#D8DCFF] dark:border-[#252840]">

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
            <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-slate-400 dark:text-[#3D52F5]/70 uppercase">
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
                        ? "bg-[#E2E5FF] dark:bg-[#3D52F5]/20 text-[#3D52F5] dark:text-[#7B8EFF] font-semibold"
                        : "text-slate-500 dark:text-[#8B95B8] hover:bg-[#E2E5FF]/60 dark:hover:bg-[#1E2238] hover:text-[#0F1734] dark:hover:text-white font-medium"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-[18px] h-[18px] shrink-0",
                        isActive ? "text-[#3D52F5] dark:text-[#7B8EFF]" : "text-slate-400 dark:text-[#8B95B8]"
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span>{label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3D52F5] dark:bg-[#7B8EFF]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom — settings + user */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-[#D8DCFF] dark:border-[#252840] pt-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
            pathname === "/settings"
              ? "bg-[#E2E5FF] dark:bg-[#3D52F5]/20 text-[#3D52F5] dark:text-[#7B8EFF]"
              : "text-slate-500 dark:text-[#8B95B8] hover:bg-[#E2E5FF]/60 dark:hover:bg-[#1E2238] hover:text-[#0F1734] dark:hover:text-white"
          )}
        >
          <Settings className="w-[18px] h-[18px] shrink-0 text-slate-400" strokeWidth={2} />
          Settings
        </Link>

        {/* User profile + logout */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-xl hover:bg-[#E2E5FF]/60 dark:hover:bg-[#1E2238] transition-all group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#0F1734] dark:text-[#EEF0FA] truncate">
              {user?.name ?? "Loading..."}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-[#8B95B8] truncate">
              {user?.is_master_admin ? "Master Admin" : user?.role ?? ""}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
