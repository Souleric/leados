"use client";

import { Bell, Search, Moon, Sun, Mail, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

export function Header({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="h-[60px] px-7 flex items-center justify-between bg-transparent sticky top-0 z-20">

      {/* Left: page title */}
      <h1 className="text-lg font-bold text-[#0F1734] dark:text-[#EEF0FA] tracking-tight">
        {title ?? "Dashboard"}
      </h1>

      {/* Center: search */}
      <div
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all duration-200 bg-white dark:bg-[#181B2C] ${
          searchFocused
            ? "border-[#3D52F5]/40 dark:border-[#3D52F5]/50 shadow-sm w-72"
            : "border-[#D8DCFF] dark:border-[#252840] w-52"
        }`}
      >
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          className="text-[13px] bg-transparent outline-none text-[#0F1734] dark:text-[#EEF0FA] placeholder:text-slate-400 dark:placeholder:text-[#8B95B8] w-full"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <kbd className="text-[10px] text-slate-300 dark:text-[#3D52F5]/60 font-mono hidden sm:block">⌘K</kbd>
      </div>

      {/* Right: icon actions */}
      <div className="flex items-center gap-1.5">
        <IconBtn>
          <Mail className="w-[18px] h-[18px] text-[#5C6A8A] dark:text-[#8B95B8]" />
        </IconBtn>

        <IconBtn badge>
          <Bell className="w-[18px] h-[18px] text-[#5C6A8A] dark:text-[#8B95B8]" />
        </IconBtn>

        <IconBtn onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark"
            ? <Sun className="w-[18px] h-[18px] text-[#8B95B8]" />
            : <Moon className="w-[18px] h-[18px] text-[#5C6A8A]" />
          }
        </IconBtn>

        <IconBtn>
          <Settings className="w-[18px] h-[18px] text-[#5C6A8A] dark:text-[#8B95B8]" />
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
      className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#181B2C] border border-[#D8DCFF] dark:border-[#252840] hover:border-[#3D52F5]/40 dark:hover:border-[#3D52F5]/50 hover:shadow-sm transition-all"
    >
      {children}
      {badge && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#3D52F5]" />
      )}
    </button>
  );
}
