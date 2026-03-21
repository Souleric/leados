import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/lib/supabase/types";

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new: {
    label: "New Lead",
    className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  },
  contacted: {
    label: "Contacted",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  },
  quotation_sent: {
    label: "Quotation Sent",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  },
  closed_won: {
    label: "Closed Won",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  lost: {
    label: "Lost",
    className: "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300",
  },
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold",
      config.className
    )}>
      {config.label}
    </span>
  );
}
