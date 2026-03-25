"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, KanbanSquare, Megaphone,
  UserCheck, UserCircle2, Mail, Zap, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "MAIN",
    items: [{ href: "/demo", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "CONTACTS",
    items: [
      { href: "/demo/leads",    label: "Contacts",  icon: Users },
      { href: "/demo/pipeline", label: "Pipeline",  icon: KanbanSquare },
      { href: "/demo/clients",  label: "Clients",   icon: UserCircle2 },
    ],
  },
  {
    label: "GROWTH",
    items: [
      { href: "/demo/campaigns",       label: "Campaigns",       icon: Megaphone },
      { href: "/demo/team",            label: "Team",            icon: UserCheck },
      { href: "/demo/email-marketing", label: "Email Marketing", icon: Mail },
    ],
  },
];

function DemoSidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex flex-col h-full w-[220px] bg-white dark:bg-[#0D1526] border-r border-[#E2E6EF] dark:border-[#1C2D45]">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#E2E6EF] dark:border-[#1C2D45]">
        <div className="w-7 h-7 rounded-md bg-[#1E6FEB] flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-[13px] font-bold text-slate-800 dark:text-white tracking-tight">LeadOS</span>
          <p className="text-[10px] text-slate-400 dark:text-[#4A6080] leading-none mt-0.5">Sales CRM</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-thin space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold tracking-widest text-slate-400 dark:text-[#506A8A] uppercase">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || (href !== "/demo" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-all duration-150",
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

      <div className="px-3 pb-4 border-t border-[#E2E6EF] dark:border-[#1C2D45] pt-3">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 dark:text-[#C8D0E0] truncate">Ahmad Demo</p>
            <p className="text-[10px] text-slate-400 dark:text-[#4A6080] truncate">Sales Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      {/* Demo Banner */}
      <div className="shrink-0 bg-[#1E6FEB] text-white text-[12px] font-medium px-5 py-2 flex items-center justify-between gap-4 z-30">
        <span className="opacity-90">
          You are viewing a <strong>live demo</strong> — sample data, no login required.
        </span>
        <Link
          href="https://labxco.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors whitespace-nowrap text-[11px] font-semibold"
        >
          Get LeadOS
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* App shell */}
      <div className="flex flex-1 overflow-hidden bg-background">
        <div className="hidden lg:flex h-full shrink-0">
          <DemoSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
