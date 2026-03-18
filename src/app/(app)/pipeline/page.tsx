"use client";

import { Header } from "@/components/layout/header";
import { AddLeadModal } from "@/components/leads/add-lead-modal";
import { fetchLeads, updateLead } from "@/lib/api";
import { DbLead } from "@/lib/supabase/types";
import { LeadStatus } from "@/lib/mock-data";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MoreHorizontal, Plus, Loader2 } from "lucide-react";

const COLUMNS: { id: LeadStatus; label: string; color: string; dotColor: string }[] = [
  { id: "new", label: "New Lead", color: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40", dotColor: "bg-blue-500" },
  { id: "contacted", label: "Contacted", color: "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40", dotColor: "bg-amber-500" },
  { id: "quotation_sent", label: "Quotation Sent", color: "bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/40", dotColor: "bg-violet-500" },
  { id: "closed_won", label: "Closed Won", color: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40", dotColor: "bg-emerald-500" },
  { id: "lost", label: "Lost", color: "bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800", dotColor: "bg-gray-400" },
];

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function initials(name: string | null, phone: string) {
  if (name) return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return phone.slice(-2);
}

function PipelineCard({ lead }: { lead: DbLead }) {
  return (
    <Link
      href={`/leads/${lead.id}`}
      draggable
      onDragStart={(e) => e.dataTransfer.setData("leadId", lead.id)}
      className="block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              {initials(lead.name, lead.phone)}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
              {lead.name ?? "Unknown"}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{lead.phone}</p>
          </div>
        </div>
        <button
          onClick={(e) => e.preventDefault()}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        {lead.source && (
          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            {lead.source}
          </span>
        )}
        {lead.campaign && (
          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium truncate max-w-[100px]">
            {lead.campaign}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400 dark:text-gray-500">{formatRelative(lead.created_at)}</span>
        {lead.assigned_to && (
          <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-[80px]">{lead.assigned_to}</span>
        )}
      </div>
    </Link>
  );
}

export default function PipelinePage() {
  const [columnLeads, setColumnLeads] = useState<Record<LeadStatus, DbLead[]>>({
    new: [], contacted: [], quotation_sent: [], closed_won: [], lost: [],
  });
  const [loading, setLoading] = useState(true);
  const [dragOverCol, setDragOverCol] = useState<LeadStatus | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [wonCount, setWonCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchLeads({ limit: 200 });
      const grouped: Record<LeadStatus, DbLead[]> = {
        new: [], contacted: [], quotation_sent: [], closed_won: [], lost: [],
      };
      for (const lead of res.leads) {
        const s = lead.status as LeadStatus;
        if (grouped[s]) grouped[s].push(lead);
      }
      setColumnLeads(grouped);
      setTotalLeads(res.total);
      setWonCount(grouped.closed_won.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDrop = async (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    setColumnLeads((prev) => {
      const next = { ...prev };
      let moved: DbLead | undefined;
      for (const s of Object.keys(next) as LeadStatus[]) {
        const idx = next[s].findIndex((l) => l.id === leadId);
        if (idx !== -1) {
          [moved] = next[s].splice(idx, 1);
          next[s] = [...next[s]];
          break;
        }
      }
      if (moved) {
        next[targetStatus] = [...next[targetStatus], { ...moved, status: targetStatus }];
      }
      return { ...next };
    });
    setDragOverCol(null);
    // Persist status change
    try { await updateLead(leadId, { status: targetStatus }); } catch (e) { console.error(e); }
  };

  return (
    <>
      <AddLeadModal open={showModal} onClose={() => setShowModal(false)} onCreated={load} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Pipeline" />
        <main className="flex-1 overflow-hidden p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sales Pipeline</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {loading ? "Loading..." : `${totalLeads} leads · ${wonCount} won`}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin h-[calc(100%-5rem)]">
              {COLUMNS.map((col) => {
                const colLeads = columnLeads[col.id] ?? [];
                return (
                  <div
                    key={col.id}
                    className={`flex flex-col flex-shrink-0 w-64 rounded-2xl border p-3 transition-all ${col.color} ${
                      dragOverCol === col.id ? "ring-2 ring-indigo-300 dark:ring-indigo-700" : ""
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
                    onDragLeave={() => setDragOverCol(null)}
                    onDrop={(e) => handleDrop(e, col.id)}
                  >
                    {/* Column header */}
                    <div className="flex items-center justify-between mb-3 px-0.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{col.label}</span>
                      </div>
                      <span className="text-[11px] font-medium px-1.5 py-0.5 bg-white/70 dark:bg-gray-900/50 rounded-full text-gray-500 dark:text-gray-400">
                        {colLeads.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin min-h-[100px]">
                      {colLeads.length === 0 ? (
                        <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">Drop leads here</p>
                        </div>
                      ) : (
                        colLeads.map((lead) => (
                          <PipelineCard key={lead.id} lead={lead} />
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-1.5 px-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-900/30"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
