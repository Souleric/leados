"use client";

import { useState, useEffect } from "react";
import { DbMembershipTier } from "@/lib/supabase/types";
import { Plus, Trash2, Loader2, Crown, Check, X } from "lucide-react";

const PRESET_COLORS = [
  "#6366f1", "#1E6FEB", "#10B981", "#F59E0B",
  "#EF4444", "#8B5CF6", "#EC4899", "#0EA5E9",
];

export function MembershipTiersTab() {
  const [tiers, setTiers] = useState<DbMembershipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res: Response = await fetch("/api/membership-tiers");
      const data = await res.json();
      setTiers(data.tiers ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res: Response = await fetch("/api/membership-tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      if (res.ok) {
        setNewName("");
        setNewColor("#6366f1");
        setShowAdd(false);
        await load();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tier? Clients assigned to it will have no tier.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/membership-tiers/${id}`, { method: "DELETE" });
      setTiers((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Membership Tiers</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Define client membership labels. Assign tiers to clients from their contact page.
        </p>
      </div>

      {/* Tier list */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            <span className="text-xs text-slate-400">Loading tiers...</span>
          </div>
        ) : tiers.length === 0 ? (
          <div className="py-8 text-center">
            <Crown className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-400 dark:text-slate-500">No tiers yet. Add your first tier below.</p>
          </div>
        ) : (
          tiers.map((tier) => (
            <div
              key={tier.id}
              className="flex items-center justify-between px-4 py-3 bg-white dark:bg-white/[0.04] shadow-card dark:border dark:border-white/[0.06] rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tier.color }} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{tier.name}</span>
                <span
                  className="text-[11px] px-2 py-0.5 rounded font-semibold"
                  style={{ backgroundColor: `${tier.color}18`, color: tier.color }}
                >
                  {tier.name}
                </span>
              </div>
              <button
                onClick={() => handleDelete(tier.id)}
                disabled={deletingId === tier.id}
                className="p-1.5 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 rounded transition-colors disabled:opacity-50"
              >
                {deletingId === tier.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add new tier */}
      {showAdd ? (
        <div className="bg-white dark:bg-white/[0.04] shadow-card dark:border dark:border-white/[0.06] rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">New Tier</p>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. VIP Member"
            className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none focus:border-[#1E6FEB]/40 transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
          />
          {/* Color picker */}
          <div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">Badge color</p>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {newColor === c && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </button>
              ))}
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent"
                title="Custom color"
              />
            </div>
          </div>
          {/* Preview */}
          {newName && (
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-slate-400">Preview:</p>
              <span
                className="text-[11px] px-2 py-0.5 rounded font-semibold"
                style={{ backgroundColor: `${newColor}18`, color: newColor }}
              >
                {newName}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || saving}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1E6FEB] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Add Tier
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewName(""); setNewColor("#6366f1"); }}
              className="px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-200 dark:border-white/[0.08] rounded-lg text-xs font-medium text-slate-400 dark:text-slate-500 hover:border-[#1E6FEB]/40 hover:text-[#1E6FEB] dark:hover:text-[#1E6FEB] transition-colors w-full"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Tier
        </button>
      )}
    </div>
  );
}
