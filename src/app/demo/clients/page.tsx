"use client";

import { DemoHeader } from "@/components/demo/header";
import { useState } from "react";
import { Search, Phone, Calendar, ChevronRight, UserCircle2 } from "lucide-react";
import { DEMO_CONTACTS, DEMO_TIERS, DemoContact } from "../data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function TierBadge({ tierId }: { tierId: string | null }) {
  if (!tierId) return <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-400 font-medium">No Tier</span>;
  const tier = DEMO_TIERS.find((t) => t.id === tierId);
  if (!tier) return null;
  return (
    <span
      className="text-[11px] px-2 py-0.5 rounded font-semibold"
      style={{ backgroundColor: `${tier.color}18`, color: tier.color }}
    >
      {tier.name}
    </span>
  );
}

const clients = DEMO_CONTACTS.filter((c) => c.lifecycle_stage === "client");

export default function DemoClientsPage() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selected, setSelected] = useState<DemoContact | null>(null);

  const filtered = clients.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (tierFilter === "none" && c.tier_id) return false;
    if (tierFilter !== "all" && tierFilter !== "none" && c.tier_id !== tierFilter) return false;
    return true;
  });

  return (
    <>
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-[#111827] h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200 p-6">
            <button onClick={() => setSelected(null)} className="text-xs text-slate-400 hover:text-slate-600 mb-4">← Back</button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <span className="text-sm font-bold text-emerald-600">{initials(selected.name)}</span>
              </div>
              <div>
                <p className="text-base font-bold text-slate-800 dark:text-white">{selected.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{selected.phone}</p>
              </div>
            </div>
            <div className="mb-3"><TierBadge tierId={selected.tier_id} /></div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Source</span><span className="font-medium text-slate-600 dark:text-slate-300">{selected.source}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Assigned To</span><span className="font-medium text-slate-600 dark:text-slate-300">{selected.assigned_to ?? "—"}</span></div>
              {selected.client_since && (
                <div className="flex justify-between"><span className="text-slate-400">Client Since</span><span className="font-medium text-slate-600 dark:text-slate-300">{formatDate(selected.client_since)}</span></div>
              )}
              {selected.email && (
                <div className="flex justify-between"><span className="text-slate-400">Email</span><span className="font-medium text-slate-600 dark:text-slate-300">{selected.email}</span></div>
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
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <DemoHeader title="Clients" />
        <main className="flex-1 overflow-y-auto px-7 pb-8 scrollbar-thin">

          <div className="flex items-center justify-between mb-5 mt-1">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Clients</h2>
              <p className="text-sm text-slate-400 mt-0.5">{filtered.length} total clients</p>
            </div>
            <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-400 font-medium">
              Demo — read only
            </div>
          </div>

          {/* Tiers legend */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {DEMO_TIERS.map((t) => (
              <span
                key={t.id}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: `${t.color}15`, color: t.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                {t.name}
              </span>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-white/[0.04] shadow-card dark:border dark:border-white/[0.06] rounded-lg flex-1 min-w-48 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs bg-transparent outline-none text-slate-600 dark:text-slate-300 placeholder:text-slate-400 w-full"
              />
            </div>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="text-xs px-3 py-2.5 bg-white dark:bg-white/[0.04] shadow-card dark:border dark:border-white/[0.06] rounded-lg text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="all">All Tiers</option>
              <option value="none">No Tier</option>
              {DEMO_TIERS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-white/[0.04] rounded-lg shadow-card dark:border dark:border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                    {["Client", "Phone", "Membership", "Assigned To", "Client Since"].map((h, i) => (
                      <th key={h} className={`text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${i === 1 ? "hidden md:table-cell" : ""} ${i >= 3 ? "hidden xl:table-cell" : ""}`}>
                        {h}
                      </th>
                    ))}
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16">
                        <div className="flex flex-col items-center gap-2">
                          <UserCircle2 className="w-8 h-8 text-slate-200" />
                          <p className="text-sm text-slate-400">No clients match filter</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr key={c.id} onClick={() => setSelected(c)} className="border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{initials(c.name)}</span>
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
                        <td className="px-5 py-3.5">
                          <TierBadge tierId={c.tier_id} />
                        </td>
                        <td className="px-5 py-3.5 hidden xl:table-cell">
                          <span className="text-xs text-slate-500">{c.assigned_to ?? "—"}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden xl:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {c.client_since ? formatDate(c.client_since) : "—"}
                          </div>
                        </td>
                        <td className="pr-4">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
