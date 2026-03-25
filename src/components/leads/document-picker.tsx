"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X, Search, Loader2, FileText, Receipt,
  CheckCircle2, Upload, PenLine,
} from "lucide-react";

type Provider = "autocount_cloud" | "autocount_aotg" | "bukku";
type DocType = "quotation" | "invoice";
type Mode = "accounting" | "manual";

interface RemoteDocument {
  id: string;
  doc_number: string;
  doc_date: string;
  due_date?: string;
  customer_name: string;
  amount: number;
  currency: string;
  status: string;
  doc_type: string;
  raw: Record<string, any>;
}

interface DocumentPickerProps {
  leadId: string;
  onLinked: () => void;
  onClose: () => void;
}

const PROVIDER_LABELS: Record<Provider, string> = {
  autocount_cloud: "AutoCount Cloud",
  autocount_aotg: "AutoCount AOTG",
  bukku: "Bukku",
};

// ─── Manual Entry Form ───────────────────────────────────────────────────────

function ManualEntry({ leadId, onLinked, onClose }: DocumentPickerProps) {
  const [docType, setDocType] = useState<DocType>("quotation");
  const [docNumber, setDocNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [docDate, setDocDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("MYR");
  const [status, setStatus] = useState("Draft");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(f: File) {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(f.type)) { setError("Only PDF, JPG, PNG files are supported."); return; }
    if (f.size > 10 * 1024 * 1024) { setError("File too large. Max 10MB."); return; }
    setError("");
    setFile(f);
  }

  async function handleSubmit() {
    setError("");
    setSaving(true);
    try {
      const form = new FormData();
      form.append("doc_type", docType);
      if (docNumber)     form.append("doc_number", docNumber);
      if (customerName)  form.append("customer_name", customerName);
      if (docDate)       form.append("doc_date", docDate);
      if (dueDate)       form.append("due_date", dueDate);
      if (amount)        form.append("amount", amount);
      form.append("currency", currency);
      form.append("status", status);
      if (file) form.append("file", file);

      const res = await fetch(`/api/leads/${leadId}/documents/upload`, { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onLinked();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-5 py-4 overflow-y-auto">
      {/* Doc type */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Document type</label>
        <div className="flex gap-2">
          {(["quotation", "invoice"] as DocType[]).map((t) => (
            <button
              key={t}
              onClick={() => setDocType(t)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                docType === t
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300"
              }`}
            >
              {t === "quotation" ? <FileText className="w-3.5 h-3.5" /> : <Receipt className="w-3.5 h-3.5" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Document no. <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            placeholder="e.g. QT-00001"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Customer name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer / company"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Document date</label>
          <input
            type="date"
            value={docDate}
            onChange={(e) => setDocDate(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Due date <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Amount</label>
          <div className="flex gap-1.5">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-20 px-2 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>MYR</option>
              <option>USD</option>
              <option>SGD</option>
              <option>EUR</option>
            </select>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option>Draft</option>
            <option>Sent</option>
            <option>Approved</option>
            <option>Paid</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>

      {/* File upload */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Attach file <span className="text-gray-400">(PDF, JPG, PNG — max 10MB)</span>
        </label>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
          onClick={() => fileRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            isDragging
              ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
              : file
              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
          />
          {file ? (
            <>
              <FileText className="w-6 h-6 text-emerald-500" />
              <p className="text-xs font-medium text-gray-900 dark:text-white">{file.name}</p>
              <p className="text-[11px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-gray-300 dark:text-gray-600" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Drag & drop or click to upload</p>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1 pb-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          {saving ? "Saving…" : "Save document"}
        </button>
      </div>
    </div>
  );
}

// ─── Accounting Picker ───────────────────────────────────────────────────────

function AccountingPicker({ leadId, onLinked, onClose }: DocumentPickerProps) {
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [docType, setDocType] = useState<DocType>("quotation");
  const [search, setSearch] = useState("");
  const [documents, setDocuments] = useState<RemoteDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loadingProviders, setLoadingProviders] = useState(true);

  useEffect(() => {
    fetch("/api/settings/integrations")
      .then((r) => r.json())
      .then((d) => {
        const active = (d.integrations ?? []).filter((i: any) => i.is_active);
        setProviders(active);
        if (active.length > 0) setSelectedProvider(active[0].provider);
      })
      .catch(console.error)
      .finally(() => setLoadingProviders(false));
  }, []);

  const fetchDocuments = useCallback(async () => {
    if (!selectedProvider) return;
    setLoading(true);
    setError("");
    setDocuments([]);
    try {
      const qs = new URLSearchParams({ type: docType });
      if (search) qs.set("q", search);
      const res = await fetch(`/api/integrations/${selectedProvider}/documents?${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch");
      setDocuments(json.documents ?? []);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  }, [selectedProvider, docType, search]);

  useEffect(() => {
    if (selectedProvider) fetchDocuments();
  }, [selectedProvider, docType]);

  async function handleLink(doc: RemoteDocument) {
    setLinking(doc.id);
    try {
      const res = await fetch(`/api/leads/${leadId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          doc_type: docType,
          doc_id: doc.id,
          doc_number: doc.doc_number,
          doc_date: doc.doc_date,
          due_date: doc.due_date,
          amount: doc.amount,
          currency: doc.currency,
          status: doc.status,
          customer_name: doc.customer_name,
          raw: doc.raw,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onLinked();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Failed to link document");
    } finally {
      setLinking(null);
    }
  }

  if (loadingProviders) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3 px-8 text-center">
        <FileText className="w-8 h-8 text-gray-200 dark:text-gray-700" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No accounting software connected</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Go to <strong>Settings → Integrations</strong> to connect AutoCount or Bukku, or use Manual Entry.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Controls */}
      <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Provider selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {providers.map((p: any) => (
              <button
                key={p.provider}
                onClick={() => setSelectedProvider(p.provider)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${selectedProvider === p.provider ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
              >
                {PROVIDER_LABELS[p.provider as Provider] ?? p.provider}
              </button>
            ))}
          </div>
          {/* Doc type */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(["quotation", "invoice"] as DocType[]).map((t) => (
              <button
                key={t}
                onClick={() => setDocType(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${docType === t ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
              >
                {t === "quotation" ? <FileText className="w-3 h-3" /> : <Receipt className="w-3 h-3" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchDocuments()}
            placeholder={`Search ${docType}s…`}
            className="w-full pl-9 pr-16 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={fetchDocuments} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-indigo-500 hover:text-indigo-600 font-medium px-1">
            Search
          </button>
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Fetching documents…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-8">
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={fetchDocuments} className="text-xs text-indigo-500 hover:underline">Try again</button>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-gray-400 dark:text-gray-500">No {docType}s found</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-5 py-2.5 text-gray-400 font-medium">Number</th>
                <th className="text-left px-3 py-2.5 text-gray-400 font-medium">Customer</th>
                <th className="text-left px-3 py-2.5 text-gray-400 font-medium">Date</th>
                <th className="text-right px-3 py-2.5 text-gray-400 font-medium">Amount</th>
                <th className="text-left px-3 py-2.5 text-gray-400 font-medium">Status</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 font-mono font-medium text-gray-800 dark:text-gray-200">{doc.doc_number || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-400 max-w-[140px] truncate">{doc.customer_name || "—"}</td>
                  <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                    {doc.doc_date ? new Date(doc.doc_date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                    {doc.currency} {doc.amount.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      doc.status?.toLowerCase().includes("paid") || doc.status?.toLowerCase().includes("approved")
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : doc.status?.toLowerCase().includes("draft")
                        ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        : "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                    }`}>
                      {doc.status || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleLink(doc)}
                      disabled={linking === doc.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {linking === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function DocumentPicker({ leadId, onLinked, onClose }: DocumentPickerProps) {
  const [mode, setMode] = useState<Mode>("manual");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Link Quotation / Invoice</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex items-center gap-1 px-5 pt-4 pb-0 shrink-0">
          <button
            onClick={() => setMode("manual")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-xs font-medium border-b-2 transition-colors ${
              mode === "manual"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            <PenLine className="w-3.5 h-3.5" />
            Manual Entry
          </button>
          <button
            onClick={() => setMode("accounting")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-xs font-medium border-b-2 transition-colors ${
              mode === "accounting"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            From Accounting Software
          </button>
        </div>
        <div className="border-b border-gray-100 dark:border-gray-800 shrink-0" />

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {mode === "manual" ? (
            <ManualEntry leadId={leadId} onLinked={onLinked} onClose={onClose} />
          ) : (
            <AccountingPicker leadId={leadId} onLinked={onLinked} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
