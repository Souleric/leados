"use client";

import { useState, useEffect, useRef } from "react";
import {
  BookOpen, Plus, Trash2, Upload, FileText,
  Loader2, CheckCircle2, ChevronDown, ChevronUp, Pencil, X, Save,
} from "lucide-react";

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  source_type: "manual" | "file";
  file_name: string | null;
  created_at: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function KnowledgeBaseTab() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editState, setEditState] = useState<SaveState>("idle");

  // Manual add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [addState, setAddState] = useState<SaveState>("idle");

  // File upload
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<SaveState>("idle");
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    setLoading(true);
    try {
      const res = await fetch("/api/knowledge-base");
      const json = await res.json();
      setEntries(json.entries ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddManual() {
    if (!newTitle.trim() || !newContent.trim()) return;
    setAddState("saving");
    try {
      const res = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const json = await res.json();
      setEntries((prev) => [json.entry, ...prev]);
      setNewTitle("");
      setNewContent("");
      setShowAddForm(false);
      setAddState("saved");
      setTimeout(() => setAddState("idle"), 2000);
    } catch {
      setAddState("error");
      setTimeout(() => setAddState("idle"), 2000);
    }
  }

  async function handleUpload() {
    if (!uploadTitle.trim() || !uploadFile) return;
    setUploadError("");
    setUploadState("saving");
    try {
      const form = new FormData();
      form.append("file", uploadFile);
      form.append("title", uploadTitle);
      const res = await fetch("/api/knowledge-base/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setEntries((prev) => [json.entry, ...prev]);
      setUploadTitle("");
      setUploadFile(null);
      setShowUpload(false);
      setUploadState("saved");
      setTimeout(() => setUploadState("idle"), 2000);
    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed");
      setUploadState("error");
      setTimeout(() => setUploadState("idle"), 2000);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/knowledge-base/${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (expandedId === id) setExpandedId(null);
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(entry: KnowledgeEntry) {
    setEditingId(entry.id);
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setExpandedId(entry.id);
  }

  async function handleSaveEdit(id: string) {
    if (!editTitle.trim() || !editContent.trim()) return;
    setEditState("saving");
    try {
      const res = await fetch(`/api/knowledge-base/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const json = await res.json();
      setEntries((prev) => prev.map((e) => (e.id === id ? json.entry : e)));
      setEditingId(null);
      setEditState("saved");
      setTimeout(() => setEditState("idle"), 2000);
    } catch {
      setEditState("error");
      setTimeout(() => setEditState("idle"), 2000);
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleFileSelect(file: File) {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (![".txt", ".md", ".pdf"].includes(ext)) {
      setUploadError("Only .txt, .md, and .pdf files are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File is too large. Maximum size is 5MB.");
      return;
    }
    setUploadError("");
    setUploadFile(file);
    if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, ""));
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Knowledge Base</h3>
            <span className="ml-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowUpload(!showUpload); setShowAddForm(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload file
            </button>
            <button
              onClick={() => { setShowAddForm(!showAddForm); setShowUpload(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add entry
            </button>
          </div>
        </div>

        <div className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
          Add FAQs, product info, pricing, policies — anything the bot should know to answer customer questions.
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-500" />
            Upload a file
          </h4>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Entry title
            </label>
            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="e.g. Product Catalogue, Pricing FAQ"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                : uploadFile
                ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
            {uploadFile ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-green-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">{uploadFile.name}</p>
                <p className="text-xs text-gray-400">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Drag & drop or click to upload
                </p>
                <p className="text-xs text-gray-400">.txt, .md, .pdf — max 5MB</p>
              </div>
            )}
          </div>

          {uploadError && (
            <p className="text-xs text-red-500">{uploadError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowUpload(false); setUploadFile(null); setUploadTitle(""); setUploadError(""); }}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!uploadTitle.trim() || !uploadFile || uploadState === "saving"}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              {uploadState === "saving" ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Uploading…</>
              ) : uploadState === "saved" ? (
                <><CheckCircle2 className="w-3.5 h-3.5" />Done!</>
              ) : (
                <><Upload className="w-3.5 h-3.5" />Upload & Save</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Manual add form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" />
            New entry
          </h4>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Refund Policy, Pricing, Product Features"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Content
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write the information the bot should know and use when answering customer questions…"
              rows={6}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowAddForm(false); setNewTitle(""); setNewContent(""); }}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddManual}
              disabled={!newTitle.trim() || !newContent.trim() || addState === "saving"}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              {addState === "saving" ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>
              ) : addState === "saved" ? (
                <><CheckCircle2 className="w-3.5 h-3.5" />Saved!</>
              ) : (
                <><Plus className="w-3.5 h-3.5" />Save entry</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Entries list */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center px-6">
            <BookOpen className="w-8 h-8 text-gray-200 dark:text-gray-700" />
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500">No knowledge base entries yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-600 max-w-xs">
              Add FAQs, product info, or upload a document to teach the bot how to respond.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {entries.map((entry) => (
              <li key={entry.id}>
                {/* Row header */}
                <div
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {entry.source_type === "file" ? (
                        <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      ) : (
                        <BookOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {entry.title}
                      </span>
                      {entry.file_name && (
                        <span className="text-xs text-gray-400 truncate hidden sm:block">— {entry.file_name}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {entry.content.slice(0, 120)}{entry.content.length > 120 ? "…" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(entry); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                      disabled={deletingId === entry.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      {deletingId === entry.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                    {expandedId === entry.id
                      ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                      : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    }
                  </div>
                </div>

                {/* Expanded content / edit */}
                {expandedId === entry.id && (
                  <div className="px-5 pb-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-gray-800">
                    {editingId === entry.id ? (
                      <div className="pt-4 space-y-3">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={8}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(entry.id)}
                            disabled={editState === "saving"}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors"
                          >
                            {editState === "saving"
                              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>
                              : <><Save className="w-3.5 h-3.5" />Save changes</>
                            }
                          </button>
                        </div>
                      </div>
                    ) : (
                      <pre className="pt-4 text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                        {entry.content}
                      </pre>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
