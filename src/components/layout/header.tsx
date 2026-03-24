"use client";

import { Bell, Search, Moon, Sun, Mail, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

export function Header({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="h-[60px] px-7 flex items-center justify-between bg-white dark:bg-[#111827] border-b border-[#E2E6EF] dark:border-[#1F2D42] sticky top-0 z-20 shadow-sm">

      {/* Left: page title */}
      <h1 className="text-base font-semibold text-[#111827] dark:text-[#E8EDF5] tracking-tight">
        {title ?? "Dashboard"}
      </h1>

      {/* Center: search */}
      <div
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border transition-all duration-200 bg-[#F2F4F8] dark:bg-[#1A2235] ${
          searchFocused
            ? "border-[#1E6FEB]/40 shadow-sm w-72"
            : "border-[#E2E6EF] dark:border-[#1F2D42] w-52"
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
        <kbd className="text-[10px] text-[#6B7897] font-mono hidden sm:block">⌘K</kbd>
      </div>

      {/* Right: icon actions */}
      <div className="flex items-center gap-1.5">
        <IconBtn>
          <Mail className="w-[18px] h-[18px] text-[#6B7897]" />
        </IconBtn>

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
      className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-[#F2F4F8] dark:bg-[#1A2235] border border-[#E2E6EF] dark:border-[#1F2D42] hover:border-[#1E6FEB]/40 hover:bg-[#EBF2FF] dark:hover:bg-[#162038] hover:shadow-sm transition-all"
    >
      {children}
      {badge && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#1E6FEB]" />
      )}
    </button>
  );
}
