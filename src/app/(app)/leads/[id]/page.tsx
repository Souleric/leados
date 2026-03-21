"use client";

import { use } from "react";
import { Header } from "@/components/layout/header";
import { StatusBadge } from "@/components/ui/status-badge";
import { fetchLead, fetchMessages, sendMessage, updateLead } from "@/lib/api";
import type { DbLead, DbMessage, DbTeamMember, LeadStatus } from "@/lib/supabase/types";
import Link from "next/link";
import {
  Phone, Tag, ChevronLeft, Send, MoreHorizontal,
  User, StickyNote, CheckCircle2, Loader2, FileText, Receipt, Plus, Trash2, ExternalLink,
} from "lucide-react";
import { DocumentPicker } from "@/components/leads/document-picker";
import { useState, useEffect, useRef } from "react";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
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
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [loadingLead, setLoadingLead] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);

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
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load lead + team members
  useEffect(() => {
    fetchLead(id)
      .then((l) => {
        setLead(l);
        setStatus(l.status);
        setNotes(l.notes ?? "");
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

  // Load messages
  useEffect(() => {
    fetchMessages(id)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
  }, [id]);

  // Scroll to bottom when messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isAgent = !!(currentUser && !currentUser.is_master_admin && currentUser.role === "agent");
  // Agents can only edit details of leads assigned to them
  const canEditDetails = !isAgent || (lead?.assigned_to != null && lead.assigned_to === currentUser?.name);

  const handleSaveStatus = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const updates: Partial<DbLead> = { status, notes };
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

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    const optimistic: DbMessage = {
      id: `temp_${Date.now()}`,
      lead_id: id,
      wa_message_id: null,
      direction: "outbound",
      type: "text",
      content: message,
      media_url: null,
      status: "sent",
      sender_name: "You",
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setMessage("");

    try {
      const real = await sendMessage(id, optimistic.content, "Agent");
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? real : m))
      );
    } catch (e) {
      console.error(e);
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
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

          {/* RIGHT: Chat */}
          <div className="xl:col-span-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">WhatsApp Conversation</span>
              <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500">{messages.length} messages</span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin bg-gray-50/50 dark:bg-gray-950/30">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <p className="text-sm text-gray-400 dark:text-gray-500">No messages yet</p>
                  <p className="text-xs text-gray-300 dark:text-gray-600">Messages will appear here when the lead replies</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] ${
                        msg.direction === "outbound"
                          ? "bg-violet-600 text-white rounded-2xl rounded-br-sm"
                          : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm"
                      } px-3.5 py-2.5 shadow-sm`}
                    >
                      {msg.direction === "outbound" && msg.sender_name && (
                        <p className="text-[10px] font-semibold text-violet-200 mb-1">{msg.sender_name}</p>
                      )}
                      <p className="text-xs leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1.5 ${msg.direction === "outbound" ? "text-violet-300" : "text-gray-400 dark:text-gray-500"}`}>
                        {formatTime(msg.timestamp)}
                        {msg.direction === "outbound" && (
                          <span className="ml-1.5">
                            {msg.status === "read" ? "✓✓" : msg.status === "delivered" ? "✓✓" : "✓"}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1 text-xs px-3.5 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none focus:bg-gray-50 dark:focus:bg-gray-700 transition-colors border border-transparent focus:border-violet-200 dark:focus:border-violet-900 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="w-9 h-9 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
              >
                {sending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
