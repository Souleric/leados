"use client";

import { Header } from "@/components/layout/header";
import { DbLead, DbMembershipTier } from "@/lib/supabase/types";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Search, ChevronRight, Phone, Calendar, UserCircle2, Loader2, Crown } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}
function initials(name: string | null, phone: string) {
  if (name) return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return phone.slice(-2);
}

function TierBadge({ tier }: { tier: DbMembershipTier | null }) {
  if (!tier) return <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-slate-500 font-medium">No Tier</span>;
  return (
    <span
      className="text-[11px] px-2 py-0.5 rounded font-semibold"
      style={{ backgroundColor: `${tier.color}18`, color: tier.color }}
    >
      {tier.name}
    </span>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<DbLead[]>([]);
  const [tiers, setTiers] = useState<DbMembershipTier[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ lifecycle: "client", limit: "100" });
      if (search) params.set("q", search);
      const [clientsRes, tiersRes]: [Response, Response] = await Promise.all([
        fetch(`/api/leads?${params}`),
        fetch("/api/membership-tiers"),
      ]);
      const clientsData = await clientsRes.json();
      const tiersData = await tiersRes.json();
      setClients(clientsData.leads ?? []);
      setTotal(clientsData.total ?? 0);
      setTiers(tiersData.tiers ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const tiersMap = Object.fromEntries(tiers.map((t) => [t.id, t]));

  const filtered = tierFilter === "all"
    ? clients
    : tierFilter === "none"
    ? clients.filter((c) => !c.tier_id)
    : clients.filter((c) => c.tier_id === tierFilter);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Clients" />
      <main className="flex-1 overflow-y-auto px-7 pb-8 scrollbar-thin">

        <div className="flex items-center justify-between mb-5 mt-1">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Clients</h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
              {loading ? "Loading..." : `${total} total clients`}
            </p>
          </div>
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
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="text-xs px-3 py-2.5 bg-white dark:bg-white/[0.04] shadow-card dark:border dark:border-white/[0.06] rounded-lg text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">All Tiers</option>
            <option value="none">No Tier</option>
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
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
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50 dark:border-white/[0.03]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.05] animate-pulse" />
                          <div className="h-3 bg-slate-100 dark:bg-white/[0.05] rounded animate-pulse w-32" />
                        </div>
                      </td>
                      {[...Array(3)].map((_, j) => (
                        <td key={j} className="px-5 py-4 hidden md:table-cell">
                          <div className="h-3 bg-slate-100 dark:bg-white/[0.05] rounded animate-pulse w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center">
                          <UserCircle2 className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No clients yet</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Contacts marked as Converted will appear here</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((client) => {
                    const tier = client.tier_id ? (tiersMap[client.tier_id] ?? null) : null;
                    return (
                      <tr key={client.id} className="border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-3.5">
                          <Link href={`/leads/${client.id}`} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                {initials(client.name, client.phone)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-none">
                                {client.name ?? "Unknown"}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5 md:hidden">{client.phone}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Phone className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                            {client.phone}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <TierBadge tier={tier} />
                        </td>
                        <td className="px-5 py-3.5 hidden xl:table-cell">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{client.assigned_to ?? "—"}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden xl:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {client.client_since ? formatDate(client.client_since) : "—"}
                          </div>
                        </td>
                        <td className="pr-4">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/leads/${client.id}`}>
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
        </div>
      </main>
    </div>
  );
}
