"use client";

import { Bell, Search, Moon, Sun, Settings, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useSidebar } from "./sidebar-context";

export function Header({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);
  const { toggle } = useSidebar();

  return (
    <header className="h-[60px] px-4 sm:px-7 flex items-center justify-between bg-white dark:bg-[#111827] border-b border-[#E2E6EF] dark:border-[#1F2D42] sticky top-0 z-20 shadow-sm gap-3">

      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggle}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-[#111827] dark:text-[#E8EDF5] tracking-tight truncate">
          {title ?? "Dashboard"}
        </h1>
      </div>

      {/* Center: search — hidden on small mobile */}
      <div
        className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all duration-200 bg-[#ECEEF3] dark:bg-[#1A2235] ${
          searchFocused
            ? "border-[#1E6FEB]/50 shadow-sm w-60"
            : "border-[#E2E6EF] dark:border-[#1F2D42] w-44"
        }`}
      >
        <Search className="w-3.5 h-3.5 text-[#6B7897] shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          className="text-[13px] bg-transparent outline-none text-[#111827] dark:text-[#E8EDF5] placeholder:text-[#6B7897] w-full"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <kbd className="text-[10px] text-[#6B7897] font-mono hidden md:block">⌘K</kbd>
      </div>

      {/* Right: icon actions */}
      <div className="flex items-center gap-1 shrink-0">
        <IconBtn badge>
          <Bell className="w-[18px] h-[18px] text-[#6B7897]" />
        </IconBtn>

        <IconBtn onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark"
            ? <Sun className="w-[18px] h-[18px] text-[#6B7897]" />
            : <Moon className="w-[18px] h-[18px] text-[#6B7897]" />
          }
        </IconBtn>

        <IconBtn>
          <Settings className="w-[18px] h-[18px] text-[#6B7897]" />
        </IconBtn>
      </div>
    </header>
  );
}

function IconBtn({
  children,
  badge,
  onClick,
}: {
  children: React.ReactNode;
  badge?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative w-8 h-8 flex items-center justify-center rounded-md bg-[#ECEEF3] dark:bg-[#1A2235] border border-[#E2E6EF] dark:border-[#1F2D42] hover:border-[#1E6FEB]/40 hover:bg-[#EBF2FF] dark:hover:bg-[#162038] transition-all"
    >
      {children}
      {badge && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#1E6FEB]" />
      )}
    </button>
  );
}
