"use client";

import { Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function DemoHeader({ title }: { title: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <header className="h-[60px] px-4 sm:px-7 flex items-center justify-between bg-white dark:bg-[#111827] border-b border-[#E2E6EF] dark:border-[#1F2D42] sticky top-0 z-20 shadow-sm gap-3 shrink-0">
      <h1 className="text-base font-semibold text-[#111827] dark:text-[#E8EDF5] tracking-tight truncate">
        {title}
      </h1>
      <div className="flex items-center gap-1 shrink-0">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-md bg-[#ECEEF3] dark:bg-[#1A2235] border border-[#E2E6EF] dark:border-[#1F2D42]">
          <Bell className="w-[18px] h-[18px] text-[#6B7897]" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#1E6FEB]" />
        </button>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-8 h-8 flex items-center justify-center rounded-md bg-[#ECEEF3] dark:bg-[#1A2235] border border-[#E2E6EF] dark:border-[#1F2D42] hover:border-[#1E6FEB]/40 transition-all"
        >
          {theme === "dark"
            ? <Sun className="w-[18px] h-[18px] text-[#6B7897]" />
            : <Moon className="w-[18px] h-[18px] text-[#6B7897]" />
          }
        </button>
      </div>
    </header>
  );
}
