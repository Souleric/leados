import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/lib/mock-data";

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new: {
    label: "New Lead",
    className: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  },
  contacted: {
    label: "Contacted",
    className: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
  quotation_sent: {
    label: "Quotation Sent",
    className: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  closed_won: {
    label: "Closed Won",
    className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  lost: {
    label: "Lost",
    className: "bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-400",
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
