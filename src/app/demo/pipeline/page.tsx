"use client";

import { DemoHeader } from "@/components/demo/header";
import { useState } from "react";
import { Clock, MoreHorizontal } from "lucide-react";
import { DEMO_CONTACTS, DemoContact, DemoStatus } from "../data";

const COLUMNS: { id: DemoStatus; label: string; color: string; dotColor: string }[] = [
  { id: "new",           label: "New Lead",      color: "bg-blue-50 border-blue-200 dark:bg-blue-950/60 dark:border-blue-700",          dotColor: "bg-blue-500" },
  { id: "contacted",     label: "Contacted",     color: "bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:border-amber-700",      dotColor: "bg-amber-500" },
  { id: "proposal_sent", label: "Proposal Sent", color: "bg-violet-50 border-violet-200 dark:bg-violet-950/60 dark:border-violet-700",  dotColor: "bg-violet-500" },
  { id: "converted",     label: "Converted",     color: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-700", dotColor: "bg-emerald-500" },
  { id: "inactive",      label: "Inactive",      color: "bg-gray-100 border-gray-300 dark:bg-gray-800/70 dark:border-gray-600",          dotColor: "bg-gray-400" },
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}
function formatRelative(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}
function ProposalAge({ sentAt }: { sentAt: string | null }) {
  if (!sentAt) return null;
  const days = Math.floor((Date.now() - new Date(sentAt).getTime()) / 86400000);
  const cls = days >= 15 ? "text-red-500 bg-red-50 dark:bg-red-500/10"
    : days >= 8 ? "text-amber-500 bg-amber-50 dark:bg-amber-500/10"
    : "text-slate-400 bg-slate-50 dark:bg-white/[0.05]";
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${cls}`}>
      <Clock className="w-2.5 h-2.5" />{days}d
    </span>
  );
}

function PipelineCard({ contact, onClick }: { contact: DemoContact; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="block bg-white dark:bg-[#1E2238] border border-slate-200 dark:border-[#252840] rounded-lg p-3.5 hover:shadow-sm hover:border-[#1E6FEB]/30 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{initials(contact.name)}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{contact.name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{contact.phone}</p>
          </div>
        </div>
        <button onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{contact.source}</span>
        {contact.status === "proposal_sent" && <ProposalAge sentAt={contact.proposal_sent_at} />}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400 dark:text-gray-500">{formatRelative(contact.created_at)}</span>
        {contact.assigned_to && (
          <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-[80px]">{contact.assigned_to}</span>
        )}
      </div>
    </div>
  );
}

export default function DemoPipelinePage() {
  const [selected, setSelected] = useState<DemoContact | null>(null);

  const grouped: Record<DemoStatus, DemoContact[]> = {
    new: [], contacted: [], proposal_sent: [], converted: [], inactive: [],
  };
  for (const c of DEMO_CONTACTS) {
    grouped[c.status].push(c);
  }

  const totalActive = grouped.new.length + grouped.contacted.length + grouped.proposal_sent.length;
  const converted   = grouped.converted.length;

  return (
    <>
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-[#111827] h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200 p-6">
            <button onClick={() => setSelected(null)} className="text-xs text-slate-400 hover:text-slate-600 mb-4">← Back</button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-500">{initials(selected.name)}</span>
              </div>
              <div>
                <p className="text-base font-bold text-slate-800 dark:text-white">{selected.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{selected.phone}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Source</span><span className="font-medium text-slate-600 dark:text-slate-300">{selected.source}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Assigned To</span><span className="font-medium text-slate-600 dark:text-slate-300">{selected.assigned_to ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Created</span><span className="font-medium text-slate-600 dark:text-slate-300">{new Date(selected.created_at).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</span></div>
            </div>
            {selected.notes && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Notes</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/[0.03] rounded-lg p-3">{selected.notes}</p>
              </div>
            )}
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Demo mode — drag & drop disabled</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <DemoHeader title="Pipeline" />
        <main className="flex-1 overflow-hidden p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sales Pipeline</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{totalActive} active · {converted} converted</p>
            </div>
            <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-400 font-medium">
              Demo — read only
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin h-[calc(100%-5rem)]">
            {COLUMNS.map((col) => {
              const colContacts = grouped[col.id] ?? [];
              return (
                <div
                  key={col.id}
                  className={`flex flex-col flex-shrink-0 w-64 rounded-lg border p-3 ${col.color}`}
                >
                  <div className="flex items-center justify-between mb-3 px-0.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{col.label}</span>
                    </div>
                    <span className="text-[11px] font-medium px-1.5 py-0.5 bg-white/70 dark:bg-gray-900/50 rounded-full text-gray-500 dark:text-gray-400">
                      {colContacts.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin min-h-[100px]">
                    {colContacts.length === 0 ? (
                      <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-[11px] text-gray-400">Empty</p>
                      </div>
                    ) : (
                      colContacts.map((c) => <PipelineCard key={c.id} contact={c} onClick={() => setSelected(c)} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </>
  );
}
