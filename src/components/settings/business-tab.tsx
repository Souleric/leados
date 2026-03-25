"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Building2, Trash2, AlertTriangle } from "lucide-react";

const TIMEZONES = [
  "Asia/Kuala_Lumpur",
  "Asia/Singapore",
  "Asia/Jakarta",
  "Asia/Bangkok",
  "Asia/Manila",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "UTC",
];

export function BusinessSettingsTab() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kuala_Lumpur");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteAllLeads = async () => {
    setDeleting(true);
    try {
      await fetch("/api/leads/delete-all", { method: "DELETE" });
      setConfirmDelete(false);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetch("/api/settings/workspace")
      .then((r) => r.json())
      .then(({ workspace }) => {
        if (workspace) {
          setName(workspace.name ?? "");
          setEmail(workspace.owner_email ?? "");
          setTimezone(workspace.timezone ?? "Asia/Kuala_Lumpur");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, owner_email: email, timezone }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-white/[0.04] rounded-lg border border-slate-100/80 dark:border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Business Profile</h3>
        </div>
        <div className="p-5 space-y-4">
          {/* Business name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Business Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Syarikat Bumbung Jaya"
              className="w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none focus:border-violet-300 dark:focus:border-violet-700 transition-colors"
            />
          </div>

          {/* Contact email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none focus:border-violet-300 dark:focus:border-violet-700 transition-colors"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Timezone
            </label>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">
              Used for timestamps in the dashboard
            </p>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 outline-none cursor-pointer focus:border-violet-300 dark:focus:border-violet-700 transition-colors"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <div className="pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
                saved
                  ? "bg-emerald-600 text-white"
                  : "bg-violet-600 hover:bg-violet-700 text-white"
              } disabled:opacity-50`}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : null}
              {saved ? "Saved!" : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
      {/* Danger Zone */}
      <div className="bg-white dark:bg-white/[0.04] rounded-lg border border-red-100 dark:border-red-900/30 overflow-hidden">
        <div className="px-5 py-4 border-b border-red-100 dark:border-red-900/30 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Delete All Leads</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Permanently removes all leads and their data. Useful for demo resets.</p>
          </div>
          {confirmDelete ? (
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <span className="text-xs text-red-500 font-medium">Sure?</span>
              <button
                onClick={handleDeleteAllLeads}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Yes, delete all
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="shrink-0 ml-4 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3 h-3" />
              Delete All Leads
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
