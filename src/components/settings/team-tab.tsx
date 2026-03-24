"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Users, Loader2, Shield, ToggleLeft, ToggleRight } from "lucide-react";

const COLORS = [
  "#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626",
  "#0891b2", "#65a30d", "#db2777",
];

interface Member {
  id: string;
  name: string;
  email: string | null;
  role: "admin" | "agent" | "viewer";
  avatar_color: string;
  status: string;
  created_at: string;
  username: string | null;
  is_master_admin: boolean;
}

interface AuthUser {
  id: string;
  role: string;
  is_master_admin: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  agent: "Sales Person",
  viewer: "Viewer (read-only)",
};

function avatarInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function TeamSettingsTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "agent" | "viewer">("agent");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [autoAssign, setAutoAssign] = useState(false);
  const [togglingAutoAssign, setTogglingAutoAssign] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teamRes, meRes, wsRes] = await Promise.all([
        fetch("/api/team"),
        fetch("/api/auth/me"),
        fetch("/api/settings/workspace"),
      ]);
      const teamData = await teamRes.json();
      const meData = meRes.ok ? await meRes.json() : null;
      const wsData = wsRes.ok ? await wsRes.json() : null;
      setMembers(teamData.members ?? []);
      setCurrentUser(meData?.user ?? null);
      setAutoAssign(wsData?.workspace?.auto_assign_leads ?? false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleAutoAssign = async () => {
    const next = !autoAssign;
    setAutoAssign(next);
    setTogglingAutoAssign(true);
    try {
      await fetch("/api/settings/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_assign_leads: next }),
      });
    } finally {
      setTogglingAutoAssign(false);
    }
  };

  useEffect(() => { load(); }, [load]);

  const isAdmin = currentUser?.is_master_admin || currentUser?.role === "admin";

  const addMember = async () => {
    if (!newName.trim()) { setError("Name is required"); return; }
    if (!newUsername.trim()) { setError("Username is required"); return; }
    if (!newPassword || newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail, role: newRole, username: newUsername, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add member");
      setNewName(""); setNewEmail(""); setNewRole("agent");
      setNewUsername(""); setNewPassword("");
      setShowAdd(false);
      await load();
    } catch (e: any) {
      setError(e.message ?? "Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (id: string, role: string) => {
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, role: role as Member["role"] } : m));
    await fetch(`/api/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
  };

  const removeMember = async (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/team/${id}`, { method: "DELETE" });
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
      <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Team Members</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              {members.length}
            </span>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setShowAdd(true); setError(""); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Member
            </button>
          )}
        </div>

        {/* Add member form */}
        {showAdd && isAdmin && (
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-violet-50/50 dark:bg-violet-950/10">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">New Team Member</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full name *"
                className="text-xs px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:border-violet-300 dark:focus:border-violet-700 transition-colors"
              />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email (optional)"
                className="text-xs px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:border-violet-300 dark:focus:border-violet-700 transition-colors"
              />
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Username *"
                autoComplete="off"
                className="text-xs px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:border-violet-300 dark:focus:border-violet-700 transition-colors"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password * (min 6 chars)"
                autoComplete="new-password"
                className="text-xs px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:border-violet-300 dark:focus:border-violet-700 transition-colors"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Member["role"])}
                className="text-xs px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                <option value="admin">Admin</option>
                <option value="agent">Sales Person</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={addMember}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                Add
              </button>
              <button
                onClick={() => { setShowAdd(false); setError(""); }}
                className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Member list */}
        {members.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">No team members yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add your first agent above</p>
          </div>
        ) : (
          <div>
            {members.map((m, i) => (
              <div
                key={m.id}
                className={`flex items-center gap-3 px-5 py-3.5 ${
                  i < members.length - 1 ? "border-b border-gray-50 dark:border-gray-800/50" : ""
                } hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors group`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: (COLORS[i % COLORS.length]) + "20" }}
                >
                  <span className="text-[11px] font-bold" style={{ color: COLORS[i % COLORS.length] }}>
                    {avatarInitials(m.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</p>
                    {m.is_master_admin && (
                      <span title="Master Admin">
                        <Shield className="w-3 h-3 text-violet-500" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {m.username ? `@${m.username}` : ""}
                    {m.email ? (m.username ? ` · ${m.email}` : m.email) : ""}
                  </p>
                </div>
                {isAdmin && !m.is_master_admin ? (
                  <select
                    value={m.role}
                    onChange={(e) => updateRole(m.id, e.target.value)}
                    className="text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 outline-none cursor-pointer hidden sm:block"
                  >
                    <option value="admin">Admin</option>
                    <option value="agent">Sales Person</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium hidden sm:inline-flex ${
                    m.is_master_admin || m.role === "admin"
                      ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  }`}>
                    {m.is_master_admin ? "Master Admin" : ROLE_LABELS[m.role]}
                  </span>
                )}
                {isAdmin && !m.is_master_admin && (
                  <button
                    onClick={() => removeMember(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lead Assignment */}
      {isAdmin && (
        <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Auto-Assign Leads</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {autoAssign
                  ? "New leads are equally distributed to sales persons (fewest leads first)"
                  : "Admin manually assigns each lead to a sales person"}
              </p>
            </div>
            <button
              onClick={toggleAutoAssign}
              disabled={togglingAutoAssign}
              className="shrink-0 ml-4 disabled:opacity-50 transition-opacity"
              title={autoAssign ? "Turn off auto-assign" : "Turn on auto-assign"}
            >
              {autoAssign
                ? <ToggleRight className="w-9 h-9 text-[#1E6FEB]" />
                : <ToggleLeft className="w-9 h-9 text-gray-300 dark:text-gray-600" />}
            </button>
          </div>
          {autoAssign && (
            <p className="mt-3 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-lg">
              Auto-assign is ON — new leads from manual entry, Google Sheet sync, and Meta Ads will be equally distributed.
            </p>
          )}
        </div>
      )}

      {/* Role legend */}
      <div className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Role Permissions</p>
        <div className="space-y-1.5">
          {[
            { role: "Master Admin", desc: "Full control — cannot be removed, can change password" },
            { role: "Admin",        desc: "Full access — settings, all leads, manage team" },
            { role: "Sales Person",  desc: "Can only see and edit leads assigned to them" },
            { role: "Viewer",       desc: "Read-only access to dashboard and leads" },
          ].map(({ role, desc }) => (
            <div key={role} className="flex items-start gap-2 text-xs">
              <span className="font-medium text-gray-700 dark:text-gray-300 w-24 shrink-0">{role}</span>
              <span className="text-gray-400 dark:text-gray-500">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
