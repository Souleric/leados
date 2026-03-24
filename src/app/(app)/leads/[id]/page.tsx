"use client";

import { use } from "react";
import { Header } from "@/components/layout/header";
import { StatusBadge } from "@/components/ui/status-badge";
import { fetchLead, updateLead } from "@/lib/api";
import type { DbLead, DbTeamMember, LeadStatus } from "@/lib/supabase/types";
import Link from "next/link";
import {
  Phone, Tag, ChevronLeft, MoreHorizontal,
  User, StickyNote, CheckCircle2, Loader2, FileText, Receipt, Plus, Trash2, ExternalLink,
  Activity, MessageSquare, Instagram, Facebook, PhoneCall, Mail, MapPin, Zap,
} from "lucide-react";
import { DocumentPicker } from "@/components/leads/document-picker";
import { useState, useEffect } from "react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

/** Extracts structured fields from the notes string written by the sheet sync */
function parseLeadExtras(notes: string): { email: string; address: string; tnb: string; cleanNotes: string } {
  let email = "", address = "", tnb = "";
  const remaining: string[] = [];
  for (const line of (notes ?? "").split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("Email:")) email = trimmed.replace("Email:", "").trim();
    else if (trimmed.startsWith("Address:")) address = trimmed.replace("Address:", "").trim();
    else if (trimmed.startsWith("Avg TNB Bill:")) tnb = trimmed.replace("Avg TNB Bill:", "").trim();
    else remaining.push(line);
  }
  return { email, address, tnb, cleanNotes: remaining.join("\n").trim() };
}

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "quotation_sent", label: "Quotation Sent" },
  { value: "closed_won", label: "Closed Won" },
  { value: "lost", label: "Lost" },
];

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [lead, setLead] = useState<DbLead | null>(null);
  const [loadingLead, setLoadingLead] = useState(true);

  const [status, setStatus] = useState<LeadStatus>("new");
  const [notes, setNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<DbTeamMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string; is_master_admin: boolean } | null>(null);

  // Documents
  const [linkedDocs, setLinkedDocs] = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  // Load lead + team members
  useEffect(() => {
    fetchLead(id)
      .then((l) => {
        setLead(l);
        setStatus(l.status);
        setNotes(parseLeadExtras(l.notes ?? "").cleanNotes);
        setAssignedTo(l.assigned_to ?? null);
      })
      .catch(console.error)
      .finally(() => setLoadingLead(false));

    fetch("/api/team")
      .then((r) => r.json())
      .then((d) => setTeamMembers(d.members ?? []))
      .catch(console.error);

    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setCurrentUser(d?.user ?? null))
      .catch(console.error);

    fetchLinkedDocs();
  }, [id]);

  function fetchLinkedDocs() {
    fetch(`/api/leads/${id}/documents`)
      .then((r) => r.json())
      .then((d) => setLinkedDocs(d.documents ?? []))
      .catch(console.error);
  }

  async function handleUnlink(docId: string) {
    setUnlinkingId(docId);
    try {
      await fetch(`/api/leads/${id}/documents/${docId}`, { method: "DELETE" });
      setLinkedDocs((prev) => prev.filter((d) => d.id !== docId));
    } finally {
      setUnlinkingId(null);
    }
  }

  const isAgent = !!(currentUser && !currentUser.is_master_admin && currentUser.role === "agent");
  // Agents can only edit details of leads assigned to them
  const canEditDetails = !isAgent || (lead?.assigned_to != null && lead.assigned_to === currentUser?.name);

  const handleSaveStatus = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      // Re-attach structured fields (email/address/tnb) so they aren't lost on save
      const { email, address, tnb } = parseLeadExtras(lead.notes ?? "");
      const structuredLines = [
        email ? `Email: ${email}` : "",
        address ? `Address: ${address}` : "",
        tnb ? `Avg TNB Bill: ${tnb}` : "",
      ].filter(Boolean).join("\n");
      const fullNotes = structuredLines
        ? `${structuredLines}${notes.trim() ? `\n${notes.trim()}` : ""}`
        : notes;
      const updates: Partial<DbLead> = { status, notes: fullNotes };
      // Agents cannot reassign leads
      if (!isAgent) updates.assigned_to = assignedTo;
      const updated = await updateLead(id, updates);
      setLead(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };


  if (loadingLead) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Lead Detail" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        </main>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Lead Detail" />
        <main className="flex-1 flex flex-col items-center justify-center gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">Lead not found</p>
          <Link href="/leads" className="text-xs text-violet-600 underline">Back to Leads</Link>
        </main>
      </div>
    );
  }

  return (
    <>
    {showPicker && (
      <DocumentPicker
        leadId={id}
        onLinked={fetchLinkedDocs}
        onClose={() => setShowPicker(false)}
      />
    )}
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Lead Detail" />
      <main className="flex-1 overflow-hidden p-6">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-4 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Leads
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 h-[calc(100%-2.5rem)]">
          {/* LEFT */}
          <div className="xl:col-span-2 flex flex-col gap-4 overflow-y-auto scrollbar-thin pr-1">
            {/* Contact card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {(lead.name ?? lead.phone).split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{lead.name ?? "Unknown"}</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {lead.source}{lead.campaign ? ` · ${lead.campaign}` : ""}
                    </p>
                  </div>
                </div>
                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{lead.phone}</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-[11px] font-medium"
                      title="Call"
                    >
                      <PhoneCall className="w-3 h-3" />
                      Call
                    </a>
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-[11px] font-medium"
                      title="WhatsApp"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      WhatsApp
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {isAgent ? (
                    <span className="text-gray-700 dark:text-gray-300">
                      {assignedTo ?? "Unassigned"}
                    </span>
                  ) : (
                    <select
                      value={assignedTo ?? ""}
                      onChange={(e) => setAssignedTo(e.target.value || null)}
                      className="flex-1 bg-transparent text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Extra info parsed from notes */}
              {(() => {
                const { email, address, tnb } = parseLeadExtras(lead.notes ?? "");
                if (!email && !address && !tnb) return null;
                return (
                  <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
                    {email && (
                      <div className="flex items-start gap-2.5 text-xs">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300 break-all">{email}</span>
                      </div>
                    )}
                    {address && (
                      <div className="flex items-start gap-2.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{address}</span>
                      </div>
                    )}
                    {tnb && (
                      <div className="flex items-center gap-2.5 text-xs">
                        <Zap className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{tnb} <span className="text-gray-400">/month TNB</span></span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {lead.tags && lead.tags.length > 0 && (
                <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Lead Status</h3>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={status} />
                <span className="text-xs text-gray-400 dark:text-gray-500">Since {formatDate(lead.created_at)}</span>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                disabled={!canEditDetails}
                className="w-full text-xs px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Documents */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Quotations & Invoices</h3>
                </div>
                <button
                  onClick={() => setShowPicker(true)}
                  className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Link
                </button>
              </div>

              {linkedDocs.length === 0 ? (
                <button
                  onClick={() => setShowPicker(true)}
                  className="w-full flex flex-col items-center justify-center py-5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
                >
                  <FileText className="w-6 h-6 text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition-colors mb-1.5" />
                  <span className="text-xs text-gray-400 dark:text-gray-500">Link a quotation or invoice</span>
                </button>
              ) : (
                <div className="space-y-2">
                  {linkedDocs.map((doc) => (
                    <div key={doc.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 group">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                        {doc.doc_type === "invoice"
                          ? <Receipt className="w-3.5 h-3.5 text-indigo-500" />
                          : <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {doc.doc_number || "No number"}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${doc.doc_type === "invoice" ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"}`}>
                            {doc.doc_type}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {doc.customer_name && `${doc.customer_name} · `}
                          {doc.currency} {parseFloat(doc.amount ?? 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
                          {doc.provider === "manual" ? "Manual" : doc.provider?.replace(/_/g, " ")} {doc.status ? `· ${doc.status}` : ""}
                        </p>
                        {doc.doc_url && (
                          <a
                            href={doc.doc_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] text-indigo-500 hover:underline mt-0.5"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> View file
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleUnlink(doc.id)}
                        disabled={unlinkingId === doc.id}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                      >
                        {unlinkingId === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="w-3.5 h-3.5 text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Notes</h3>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!canEditDetails}
                className="w-full text-xs px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 outline-none resize-none focus:border-violet-300 dark:focus:border-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                rows={4}
                placeholder={canEditDetails ? "Add notes about this lead..." : "Not assigned to you"}
              />
              <button
                onClick={handleSaveStatus}
                disabled={saving || !canEditDetails}
                className="mt-2 w-full py-2 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>

          {/* RIGHT: Activity + Channels */}
          <div className="xl:col-span-3 flex flex-col gap-4 overflow-y-auto scrollbar-thin pr-1">

            {/* Activity Log */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <Activity className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Activity Log</span>
              </div>
              <div className="flex-1 p-5 space-y-4">
                {/* Lead created */}
                {lead && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div className="w-px flex-1 bg-gray-100 dark:bg-gray-800 mt-2" />
                    </div>
                    <div className="pb-4">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Lead created</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {lead.name ?? lead.phone} · via {lead.source}{lead.campaign ? ` · ${lead.campaign}` : ""}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(lead.created_at)}</p>
                    </div>
                  </div>
                )}

                {/* Current status */}
                {lead && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Status updated</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{status.replace(/_/g, " ")}</p>
                      {lead.assigned_to && (
                        <p className="text-[11px] text-gray-400 mt-0.5">Assigned to {lead.assigned_to}</p>
                      )}
                    </div>
                  </div>
                )}

                {!lead && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Messaging Channels */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Messaging Channels</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Facebook className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Facebook Messenger</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Connect via Meta Business API</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium">Coming soon</span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                  <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center shrink-0">
                    <Instagram className="w-4 h-4 text-pink-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Instagram DM</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Requires IG Business account linked to Page</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium">Coming soon</span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">WhatsApp</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Requires WhatsApp Business API</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium">Coming soon</span>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500 text-center">
                Messaging integrations will be available in the next update
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
