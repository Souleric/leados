"use client";

import { Header } from "@/components/layout/header";
import { StatusBadge } from "@/components/ui/status-badge";
import { DbLead, LeadStatus, LeadSource, LifecycleStage } from "@/lib/supabase/types";
import { fetchLeads } from "@/lib/api";
import { AddLeadModal } from "@/components/leads/add-lead-modal";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Plus, ChevronRight, Phone, Calendar, Users, RefreshCw, Sheet, Loader2, X, Clock } from "lucide-react";

const sourceOptions: LeadSource[] = ["Facebook", "Instagram", "TikTok", "Referral", "Website", "Walk-in"];
const statusOptions: LeadStatus[] = ["new", "contacted", "proposal_sent", "converted", "inactive"];

const LIFECYCLE_TABS: { id: LifecycleStage | "all"; label: string }[] = [
  { id: "active_lead",   label: "Active Leads" },
  { id: "inactive_lead", label: "Inactive" },
  { id: "all",           label: "All Contacts" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}
function initials(name: string | null, phone: string) {
  if (name) return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return phone.slice(-2);
}
function proposalDays(proposalSentAt: string | null): number | null {
  if (!proposalSentAt) return null;
  return Math.floor((Date.now() - new Date(proposalSentAt).getTime()) / 86400000);
}
function ProposalAgeBadge({ days }: { days: number }) {
  const cls =
    days >= 15 ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
    : days >= 8  ? "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
    : "bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400";
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ml-1.5 ${cls}`}>
      <Clock className="w-2.5 h-2.5" />
      {days}d
    </span>
  );
}

export default function ContactsPage() {
  const [leads, setLeads] = useState<DbLead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [savedSheetUrl, setSavedSheetUrl] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [lifecycleTab, setLifecycleTab] = useState<LifecycleStage | "all">("active_lead");

  useEffect(() => {
    const saved = localStorage.getItem("gsheet_url") ?? "";
    setSavedSheetUrl(saved);
    setSheetUrl(saved);
  }, []);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLeads({
        status: statusFilter !== "all" ? statusFilter : undefined,
        source: sourceFilter !== "all" ? sourceFilter : undefined,
        q: search || undefined,
        lifecycle: lifecycleTab,
      } as any);
      setLeads(res.leads);
      setTotal(res.total ?? res.leads.length);
    } catch (e) {
      setError("Failed to load contacts");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sourceFilter, lifecycleTab]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const handleSaveUrl = () => {
    const trimmed = sheetUrl.trim();
    localStorage.setItem("gsheet_url", trimmed);
    setSavedSheetUrl(trimmed);
  };

  const handleSheetSync = async () => {
    const url = savedSheetUrl || sheetUrl.trim();
    if (!url || syncing) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res: Response = await fetch("/api/leads/sync-gsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setSyncMsg({ type: "ok", text: data.message });
      setLastSynced(new Date().toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" }));
      await load();
    } catch (e: any) {
      setSyncMsg({ type: "err", text: e.message ?? "Sync failed" });
    } finally {
      setSyncing(false);
    }
  };

  // Filter status options by lifecycle tab
  const filteredStatusOptions = lifecycleTab === "active_lead"
    ? statusOptions.filter((s) => ["new", "contacted", "proposal_sent"].includes(s))
    : lifecycleTab === "inactive_lead"
    ? ["inactive" as LeadStatus]
    : statusOptions;

  return (
    <>
      <AddLeadModal open={showModal} onClose={() => setShowModal(false)} onCreated={load} />

      {/* Google Sheet Sync Modal */}
      {showSheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Sheet className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Google Sheet Sync</h3>
              </div>
              <button onClick={() => { setShowSheetModal(false); setSyncMsg(null); }} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Reads your sheet and creates new contacts or updates existing ones. Sheet must be <strong>Anyone with link can view</strong>.
            </p>
            <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">Sheet URL</label>
            <div className="flex gap-2 mb-1">
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 text-xs px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none focus:border-emerald-300 dark:focus:border-emerald-700"
              />
              <button
                onClick={handleSaveUrl}
                disabled={!sheetUrl.trim() || sheetUrl.trim() === savedSheetUrl}
                className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                Save URL
              </button>
            </div>
            {savedSheetUrl && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mb-4">URL saved — sync will use this sheet</p>
            )}
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 p-3 mb-4">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Columns read from sheet</p>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { label: "Name", col: "full_name" },
                  { label: "Phone", col: "phone" },
                  { label: "Email", col: "email" },
                  { label: "Property type", col: "property_type" },
                  { label: "TNB Bill", col: "average_tnb_bill_per_month" },
                  { label: "Address", col: "address" },
                ].map(({ label, col }) => (
                  <div key={col} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-[11px] text-gray-600 dark:text-gray-400">{label} <span className="text-gray-400">({col})</span></span>
                  </div>
                ))}
              </div>
            </div>
            {syncMsg && (
              <div className={`mb-3 px-3 py-2.5 rounded-lg text-xs font-medium ${
                syncMsg.type === "ok"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : "bg-red-50 text-red-700 border border-red-100"
              }`}>
                {syncMsg.text}
              </div>
            )}
            <button
              onClick={handleSheetSync}
              disabled={!(savedSheetUrl || sheetUrl.trim()) || syncing}
              className="w-full py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {syncing ? <><Loader2 className="w-4 h-4 animate-spin" /> Syncing...</> : "Sync Now"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Contacts" />
        <main className="flex-1 overflow-y-auto px-7 pb-8 scrollbar-thin">

          {/* Page header */}
          <div className="flex items-center justify-between mb-5 mt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Contacts</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
                {loading ? "Loading..." : `${total} ${lifecycleTab === "active_lead" ? "active leads" : lifecycleTab === "inactive_lead" ? "inactive" : "total"}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} className="w-9 h-9 flex items-center justify-center rounded-lg shadow-card dark:border dark:border-white/[0.06] bg-white dark:bg-white/[0.04]" title="Refresh">
                <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setShowSheetModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/[0.04] shadow-card dark:border dark:border-white/[0.06] text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
              >
                {syncing ? <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" /> : <Sheet className="w-4 h-4 text-emerald-600" />}
                <span>Sync Sheet</span>
                {lastSynced && <span className="text-[10px] text-slate-400">{lastSynced}</span>}
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1E6FEB] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>
          </div>

          {/* Lifecycle tabs */}
          <div className="flex items-center gap-1 mb-4 bg-white dark:bg-white/[0.04] shadow-card dark:border dark:border-white/[0.06] rounded-lg p-1 w-fit">
            {LIFECYCLE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setLifecycleTab(tab.id); setStatusFilter("all"); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  lifecycleTab === tab.id
                    ? "bg-[#1E6FEB] text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
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
                onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "all")}
                className="text-xs px-3 py-2.5 bg-white dark:bg-white/[0.04] shadow-card dark:border dark:border-white/[0.06] rounded-lg text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                {filteredStatusOptions.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as LeadSource | "all")}
                className="text-xs px-3 py-2.5 bg-white dark:bg-white/[0.04] shadow-card dark:border dark:border-white/[0.06] rounded-lg text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">All Sources</option>
                {sourceOptions.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg text-xs text-red-600 dark:text-red-400">
              {error} — <button onClick={load} className="underline">retry</button>
            </div>
          )}

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
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-50 dark:border-white/[0.03]">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.05] animate-pulse" />
                            <div className="h-3 bg-slate-100 dark:bg-white/[0.05] rounded animate-pulse w-32" />
                          </div>
                        </td>
                        {[...Array(4)].map((_, j) => (
                          <td key={j} className="px-5 py-4 hidden md:table-cell">
                            <div className="h-3 bg-slate-100 dark:bg-white/[0.05] rounded animate-pulse w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-20">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-lg bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center">
                            <Users className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No contacts yet</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Add your first contact or sync from Google Sheet</p>
                          </div>
                          <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E6FEB] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors mt-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add First Contact
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => {
                      const pDays = lead.status === "proposal_sent" ? proposalDays(lead.proposal_sent_at) : null;
                      return (
                        <tr key={lead.id} className="border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors group">
                          <td className="px-5 py-3.5">
                            <Link href={`/leads/${lead.id}`} className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400">
                                  {initials(lead.name, lead.phone)}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-none">
                                  {lead.name ?? "Unknown"}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5 md:hidden">{lead.phone}</p>
                              </div>
                            </Link>
                          </td>
                          <td className="px-5 py-3.5 hidden md:table-cell">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <Phone className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                              {lead.phone}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 hidden lg:table-cell">
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 font-medium">
                              {lead.source}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center">
                              <StatusBadge status={lead.status} />
                              {pDays !== null && <ProposalAgeBadge days={pDays} />}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 hidden xl:table-cell">
                            <span className="text-xs text-slate-500 dark:text-slate-400">{lead.assigned_to ?? "—"}</span>
                          </td>
                          <td className="px-5 py-3.5 hidden xl:table-cell">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Calendar className="w-3 h-3" />
                              {formatDate(lead.created_at)}
                            </div>
                          </td>
                          <td className="pr-4">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/leads/${lead.id}`}>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {!loading && leads.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-50 dark:border-white/[0.04] flex items-center justify-between">
                <p className="text-xs text-slate-400">Showing {leads.length} of {total}</p>
                <div className="flex items-center gap-1">
                  <button className="px-3 py-1.5 text-xs rounded-lg shadow-card dark:border dark:border-white/[0.06] text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] disabled:opacity-40 transition-colors" disabled>Previous</button>
                  <button className="px-3 py-1.5 text-xs rounded-lg shadow-card dark:border dark:border-white/[0.06] text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">Next</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
