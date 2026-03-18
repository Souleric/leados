/**
 * Frontend API client — calls our Next.js API routes.
 * Falls back to mock data when NEXT_PUBLIC_SUPABASE_URL is not set.
 */

import type { DbLead, DbMessage } from "./supabase/types";
import { leads as mockLeads, type Lead as MockLead } from "./mock-data";

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
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // Return mock data shaped as DbLead
    return {
      leads: mockLeads.map(mockToDb),
      total: mockLeads.length,
      page: 1,
      limit: 50,
    };
  }

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
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const mock = mockLeads.find((l) => l.id === id);
    if (!mock) throw new Error("Lead not found");
    return mockToDb(mock);
  }

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
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const mock = mockLeads.find((l) => l.id === leadId);
    return (mock?.messages ?? []).map((m) => ({
      id: m.id,
      lead_id: leadId,
      wa_message_id: m.id,
      direction: m.type === "outgoing" ? "outbound" : "inbound",
      type: "text",
      content: m.content,
      media_url: null,
      status: "delivered",
      sender_name: m.sender ?? null,
      timestamp: m.timestamp,
      created_at: m.timestamp,
    }));
  }

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

// ─── MOCK → DB SHAPE ────────────────────────────────────────────────────────

function mockToDb(m: MockLead): DbLead {
  return {
    id: m.id,
    phone: m.phone,
    name: m.name,
    source: m.source,
    campaign: null,
    status: m.status,
    assigned_to: m.assignedTo,
    tags: m.tags,
    notes: m.notes,
    wa_contact_id: null,
    last_message_at: m.messages.at(-1)?.timestamp ?? m.createdAt,
    created_at: m.createdAt,
    updated_at: m.createdAt,
  };
}
