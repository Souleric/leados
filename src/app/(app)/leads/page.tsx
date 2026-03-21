"use client";

import { Header } from "@/components/layout/header";
import { StatusBadge } from "@/components/ui/status-badge";
import { DbLead, LeadStatus, LeadSource } from "@/lib/supabase/types";
import { fetchLeads } from "@/lib/api";
import { AddLeadModal } from "@/components/leads/add-lead-modal";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Plus, ChevronRight, Phone, Calendar, Users, RefreshCw } from "lucide-react";

const sourceOptions: LeadSource[] = ["Facebook", "Instagram", "TikTok", "Referral", "Website", "Walk-in"];
const statusOptions: LeadStatus[] = ["new", "contacted", "quotation_sent", "closed_won", "lost"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}
function initials(name: string | null, phone: string) {
  if (name) return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return phone.slice(-2);
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<DbLead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

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
      });
      setLeads(res.leads);
      setTotal(res.total ?? res.leads.length);
    } catch (e) {
      setError("Failed to load leads");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sourceFilter]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  return (
    <>
      <AddLeadModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={load}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Leads" />
        <main className="flex-1 overflow-y-auto px-7 pb-8 scrollbar-thin">

          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">All Leads</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
                {loading ? "Loading..." : `${total} total leads`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.04] hover:border-indigo-200 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30"
              >
                <Plus className="w-4 h-4" />
                Add Lead
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className={`flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl flex-1 min-w-48 max-w-xs transition-all`}>
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
                className="text-xs px-3 py-2.5 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as LeadSource | "all")}
                className="text-xs px-3 py-2.5 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">All Sources</option>
                {sourceOptions.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
              {error} — <button onClick={load} className="underline">retry</button>
            </div>
          )}

          {/* Table */}
          <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                    {["Name", "Phone", "Source", "Status", "Assigned To", "Created"].map((h, i) => (
                      <th key={h} className={`text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${i > 1 && i < 3 ? "hidden lg:table-cell" : ""} ${i >= 4 ? "hidden xl:table-cell" : ""} ${i === 1 ? "hidden md:table-cell" : ""}`}>
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
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center">
                            <Users className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No leads yet</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Add your first lead or connect WhatsApp</p>
                          </div>
                          <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors mt-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add First Lead
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors group"
                      >
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
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 font-medium">
                            {lead.source}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="px-5 py-3.5 hidden xl:table-cell">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {lead.assigned_to ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 hidden xl:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {formatDate(lead.created_at)}
                          </div>
                        </td>
                        <td className="pr-4">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {!loading && leads.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-50 dark:border-white/[0.04] flex items-center justify-between">
                <p className="text-xs text-slate-400">Showing {leads.length} of {total} leads</p>
                <div className="flex items-center gap-1">
                  <button className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/[0.06] text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] disabled:opacity-40 transition-colors" disabled>
                    Previous
                  </button>
                  <button className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/[0.06] text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
