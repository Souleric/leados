import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export function KpiCard({
  title,
  value,
  change,
  changeLabel = "vs last month",
  icon: Icon,
  iconColor = "text-indigo-500",
  iconBg = "bg-indigo-50 dark:bg-indigo-500/10",
}: KpiCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-white dark:bg-white/[0.04] rounded-2xl p-5 hover:shadow-md hover:shadow-slate-200/60 dark:hover:shadow-black/20 transition-all duration-200 border border-slate-100/80 dark:border-white/[0.06]">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("w-[18px] h-[18px]", iconColor)} strokeWidth={2.5} />
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg",
            isPositive
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"
          )}>
            {isPositive
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            {isPositive ? "+" : ""}{change}%
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-none">
        {value}
      </p>
      <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wide">
        {title}
      </p>
      {change !== undefined && (
        <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-1">{changeLabel}</p>
      )}
    </div>
  );
}
