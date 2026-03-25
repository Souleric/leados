"use client";

import { DemoHeader } from "@/components/demo/header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useState } from "react";
import { Search, Filter, Users, Phone, Calendar, ChevronRight, Clock } from "lucide-react";
import { DEMO_CONTACTS, DemoStatus, DemoSource, DemoLifecycle, DemoContact } from "../data";

const LIFECYCLE_TABS: { id: DemoLifecycle | "all"; label: string }[] = [
  { id: "active_lead",   label: "Active Leads" },
  { id: "inactive_lead", label: "Inactive" },
  { id: "all",           label: "All Contacts" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}
function proposalDays(sentAt: string | null): number | null {
  if (!sentAt) return null;
  return Math.floor((Date.now() - new Date(sentAt).getTime()) / 86400000);
}
function ProposalAgeBadge({ days }: { days: number }) {
  const cls =
    days >= 15 ? "bg-red-100 text-red-600"
    : days >= 8  ? "bg-amber-100 text-amber-600"
    : "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ml-1.5 ${cls}`}>
      <Clock className="w-2.5 h-2.5" />{days}d
    </span>
  );
}

const STATUS_OPTIONS: DemoStatus[] = ["new", "contacted", "proposal_sent", "converted", "inactive"];
const SOURCE_OPTIONS: DemoSource[] = ["Facebook", "Instagram", "Referral", "Website", "Walk-in"];

export default function DemoLeadsPage() {
  const [tab, setTab] = useState<DemoLifecycle | "all">("active_lead");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DemoStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<DemoSource | "all">("all");
  const [selected, setSelected] = useState<DemoContact | null>(null);

  const filteredStatus = tab === "active_lead"
    ? STATUS_OPTIONS.filter((s) => ["new", "contacted", "proposal_sent"].includes(s))
    : tab === "inactive_lead"
    ? ["inactive" as DemoStatus]
    : STATUS_OPTIONS;

  const contacts = DEMO_CONTACTS.filter((c) => {
    if (tab !== "all" && c.lifecycle_stage !== tab) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (sourceFilter !== "all" && c.source !== sourceFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search)) return false;
    return true;
  });

  return (
    <>
      {/* Contact detail slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-[#111827] h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-6">
              <button onClick={() => setSelected(null)} className="text-xs text-slate-400 hover:text-slate-600 mb-4">← Back</button>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-indigo-500">{initials(selected.name)}</span>
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800 dark:text-white">{selected.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{selected.phone}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <StatusBadge status={selected.status as any} />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Source</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{selected.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned To</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{selected.assigned_to ?? "—"}</span>
                </div>
                {selected.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{selected.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Created</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{formatDate(selected.created_at)}</span>
                </div>
                {selected.proposal_sent_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Proposal Sent</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{formatDate(selected.proposal_sent_at)}</span>
                  </div>
                )}
                {selected.client_since && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Client Since</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{formatDate(selected.client_since)}</span>
                  </div>
                )}
              </div>
              {selected.notes && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Notes</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/[0.03] rounded-lg p-3">{selected.notes}</p>
                </div>
              )}
              <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Demo mode — editing disabled</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <DemoHeader title="Contacts" />
        <main className="flex-1 overflow-y-auto px-7 pb-8 scrollbar-thin">

          <div className="flex items-center justify-between mb-5 mt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Contacts</h2>
              <p className="text-sm text-slate-400 mt-0.5">{contacts.length} {tab === "active_lead" ? "active leads" : tab === "inactive_lead" ? "inactive" : "total"}</p>
            </div>
            <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-400 font-medium">
              Demo — read only
            </div>
          </div>

          {/* Lifecycle tabs */}
          <div className="flex items-center gap-1 mb-4 bg-white dark:bg-white/[0.04] shadow-card dark:border dark:border-white/[0.06] rounded-lg p-1 w-fit">
            {LIFECYCLE_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setStatusFilter("all"); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  tab === t.id ? "bg-[#1E6FEB] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-white/[0.04] shadow-card dark:border dark:border-white/[0.06] rounded-lg flex-1 min-w-48 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs bg-transparent outline-none text-slate-600 dark:text-slate-300 placeholder:text-slate-400 w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DemoStatus | "all")}
                className="text-xs px-3 py-2.5 bg-white dark:bg-white/[0.04] shadow-card dark:border dark:border-white/[0.06] rounded-lg text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                {filteredStatus.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as DemoSource | "all")}
                className="text-xs px-3 py-2.5 bg-white dark:bg-white/[0.04] shadow-card dark:border dark:border-white/[0.06] rounded-lg text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">All Sources</option>
                {SOURCE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-white/[0.04] rounded-lg shadow-card dark:border dark:border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                    {["Contact", "Phone", "Source", "Status", "Assigned To", "Created"].map((h, i) => (
                      <th key={h} className={`text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${i === 2 ? "hidden lg:table-cell" : ""} ${i >= 4 ? "hidden xl:table-cell" : ""} ${i === 1 ? "hidden md:table-cell" : ""}`}>
                        {h}
                      </th>
                    ))}
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {contacts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-8 h-8 text-slate-200" />
                          <p className="text-sm text-slate-400">No contacts match filter</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    contacts.map((c) => {
                      const pDays = c.status === "proposal_sent" ? proposalDays(c.proposal_sent_at) : null;
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelected(c)}
                          className="border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-indigo-500">{initials(c.name)}</span>
                              </div>
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{c.name}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 hidden md:table-cell">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Phone className="w-3 h-3 text-slate-300" />
                              {c.phone}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 hidden lg:table-cell">
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.05] text-slate-500 font-medium">{c.source}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center">
                              <StatusBadge status={c.status as any} />
                              {pDays !== null && <ProposalAgeBadge days={pDays} />}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 hidden xl:table-cell">
                            <span className="text-xs text-slate-500">{c.assigned_to ?? "—"}</span>
                          </td>
                          <td className="px-5 py-3.5 hidden xl:table-cell">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Calendar className="w-3 h-3" />
                              {formatDate(c.created_at)}
                            </div>
                          </td>
                          <td className="pr-4">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-50 dark:border-white/[0.04] flex items-center justify-between">
              <p className="text-xs text-slate-400">Showing {contacts.length} of {DEMO_CONTACTS.length}</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
