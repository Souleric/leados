import { cn } from "@/lib/utils";
import type { LeadStatus, LifecycleStage } from "@/lib/supabase/types";

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new: {
    label: "New Lead",
    className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  },
  contacted: {
    label: "Contacted",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  },
  proposal_sent: {
    label: "Proposal Sent",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  },
  converted: {
    label: "Converted",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  inactive: {
    label: "Inactive",
    className: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400",
  },
};

const lifecycleConfig: Record<LifecycleStage, { label: string; className: string }> = {
  active_lead: {
    label: "Active Lead",
    className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  },
  client: {
    label: "Client",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  inactive_lead: {
    label: "Inactive Lead",
    className: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400",
  },
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  const config = statusConfig[status] ?? { label: status, className: "bg-slate-100 text-slate-500" };
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold",
      config.className
    )}>
      {config.label}
    </span>
  );
}

export function LifecycleBadge({ stage }: { stage: LifecycleStage }) {
  const config = lifecycleConfig[stage] ?? { label: stage, className: "bg-slate-100 text-slate-500" };
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold",
      config.className
    )}>
      {config.label}
    </span>
  );
}
