"use client";

import { useState } from "react";
import { X, Loader2, UserPlus } from "lucide-react";

const SOURCES = ["Facebook", "Instagram", "TikTok", "Referral", "Website", "Walk-in", "WhatsApp"];
const INQUIRY_TYPES = ["Roofing", "Acrylic", "Waterproofing", "Renovation", "Consultation", "Other"];
const STATUSES = [
  { value: "new",            label: "New Lead" },
  { value: "contacted",      label: "Contacted" },
  { value: "quotation_sent", label: "Quotation Sent" },
  { value: "closed_won",     label: "Closed Won" },
  { value: "lost",           label: "Lost" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AddLeadModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    source: "Facebook",
    campaign: "",
    status: "new",
    assigned_to: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone.trim()) { setError("Phone number is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: form.phone.startsWith("+") ? form.phone : `+${form.phone}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create lead");
      onCreated();
      onClose();
      setForm({ name: "", phone: "", source: "Facebook", campaign: "", status: "new", assigned_to: "", notes: "" });
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-100 dark:border-white/[0.08] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-indigo-500" />
            </div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">Add New Lead</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <Field label="Full Name" hint="Optional — can be updated later">
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Ahmad Faizal"
              className={inputCls}
            />
          </Field>

          {/* Phone */}
          <Field label="WhatsApp Number *" hint="Include country code, e.g. +60123456789">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+60123456789"
              className={inputCls}
              required
            />
          </Field>

          {/* Source + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source">
              <select value={form.source} onChange={(e) => set("source", e.target.value)} className={inputCls}>
                {SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>

          {/* Campaign */}
          <Field label="Campaign" hint="Optional — e.g. Roofing March">
            <input
              type="text"
              value={form.campaign}
              onChange={(e) => set("campaign", e.target.value)}
              placeholder="e.g. Roofing Campaign March"
              className={inputCls}
            />
          </Field>

          {/* Assigned To */}
          <Field label="Assigned To" hint="Optional">
            <input
              type="text"
              value={form.assigned_to}
              onChange={(e) => set("assigned_to", e.target.value)}
              placeholder="Agent name"
              className={inputCls}
            />
          </Field>

          {/* Notes */}
          <Field label="Notes" hint="Optional">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Add any notes..."
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Adding..." : "Add Lead"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none focus:border-indigo-300 dark:focus:border-indigo-600 transition-colors";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      {hint && <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}
