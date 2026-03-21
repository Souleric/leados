/**
 * Frontend API client — calls our Next.js API routes.
 */

import type { DbLead, DbMessage } from "./supabase/types";

const BASE = "";  // same-origin

// ─── LEADS ──────────────────────────────────────────────────────────────────

export interface FetchLeadsParams {
  status?: string;
  source?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface LeadsResponse {
  leads: DbLead[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchLeads(params: FetchLeadsParams = {}): Promise<LeadsResponse> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.source) qs.set("source", params.source);
  if (params.q) qs.set("q", params.q);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));

  const res = await fetch(`${BASE}/api/leads?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`fetchLeads failed: ${res.status}`);
  return res.json();
}

export async function fetchLead(id: string): Promise<DbLead> {
  const res = await fetch(`${BASE}/api/leads/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetchLead failed: ${res.status}`);
  const data = await res.json();
  return data.lead;
}

export async function updateLead(id: string, updates: Partial<DbLead>): Promise<DbLead> {
  const res = await fetch(`${BASE}/api/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`updateLead failed: ${res.status}`);
  const data = await res.json();
  return data.lead;
}

// ─── MESSAGES ───────────────────────────────────────────────────────────────

export async function fetchMessages(leadId: string): Promise<DbMessage[]> {
  const res = await fetch(`${BASE}/api/leads/${leadId}/messages`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`fetchMessages failed: ${res.status}`);
  const data = await res.json();
  return data.messages;
}

export async function sendMessage(
  leadId: string,
  content: string,
  senderName: string
): Promise<DbMessage> {
  const res = await fetch(`${BASE}/api/leads/${leadId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, senderName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `sendMessage failed: ${res.status}`);
  }
  const data = await res.json();
  return data.message;
}
