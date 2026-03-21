"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

type Provider = "autocount_cloud" | "autocount_aotg" | "bukku";
type TestState = "idle" | "testing" | "ok" | "fail";
type SaveState = "idle" | "saving" | "saved" | "error";

interface Integration {
  provider: Provider;
  config: Record<string, string>;
  is_active: boolean;
  connected_at: string | null;
}

const PROVIDER_META: Record<Provider, { label: string; description: string; logo: string; docsUrl: string }> = {
  autocount_cloud: {
    label: "AutoCount Cloud",
    description: "AutoCount Cloud Accounting — REST API",
    logo: "AC",
    docsUrl: "https://accounting-api.autocountcloud.com/documentation/",
  },
  autocount_aotg: {
    label: "AutoCount (AOTG)",
    description: "AutoCount On The Go — Desktop / On-premise",
    logo: "AC",
    docsUrl: "https://wiki.autocountsoft.com/wiki/Introduction_to_AOTG_API",
  },
  bukku: {
    label: "Bukku",
    description: "Bukku Cloud Accounting — REST API",
    logo: "BK",
    docsUrl: "https://developers.bukku.my/",
  },
};

function ProviderCard({ provider, initial }: { provider: Provider; initial?: Integration }) {
  const meta = PROVIDER_META[provider];
  const [expanded, setExpanded] = useState(false);
  const [config, setConfig] = useState<Record<string, string>>(initial?.config ?? {});
  const [isActive, setIsActive] = useState(initial?.is_active ?? false);
  const [connectedAt, setConnectedAt] = useState(initial?.connected_at ?? null);
  const [testState, setTestState] = useState<TestState>("idle");
  const [testMsg, setTestMsg] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  function setField(key: string, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaveState("saving");
    try {
      const res = await fetch("/api/settings/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, config }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2000);
    }
  }

  async function handleTest() {
    setTestState("testing");
    setTestMsg("");
    try {
      const res = await fetch("/api/settings/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, config }),
      });
      const json = await res.json();
      setTestState(json.ok ? "ok" : "fail");
      setTestMsg(json.message ?? "");
      if (json.ok) {
        setIsActive(true);
        setConnectedAt(new Date().toISOString());
      }
    } catch (err: any) {
      setTestState("fail");
      setTestMsg(err.message ?? "Connection failed");
    }
  }

  function handleDisconnect() {
    setIsActive(false);
    setConnectedAt(null);
    setConfig({});
    setTestState("idle");
    setTestMsg("");
    // Save empty config
    fetch("/api/settings/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, config: {} }),
    });
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Logo */}
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{meta.logo === "BK" ? "BK" : "AC"}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{meta.label}</span>
            {isActive ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>
            ) : (
              <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                Not connected
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{meta.description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={meta.docsUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-gray-400 hover:text-indigo-500 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
          {connectedAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Connected {new Date(connectedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}

          {/* Provider-specific fields */}
          {provider === "bukku" && (
            <>
              <Field
                label="Company Subdomain"
                placeholder="e.g. mycompany (from mycompany.bukku.my)"
                value={config.subdomain ?? ""}
                onChange={(v) => setField("subdomain", v)}
                hint="Found in your Bukku company URL"
              />
              <Field
                label="API Token"
                placeholder="Paste your Bukku API token"
                value={config.api_token ?? ""}
                onChange={(v) => setField("api_token", v)}
                secret
                hint="Control Panel → Integrations → API Access"
              />
            </>
          )}

          {provider === "autocount_cloud" && (
            <>
              <Field
                label="API Key"
                placeholder="Your AutoCount Cloud API Key"
                value={config.api_key ?? ""}
                onChange={(v) => setField("api_key", v)}
                secret
                hint="Cloud Accounting → Settings → API Keys → Create API Key"
              />
              <Field
                label="Key ID"
                placeholder="Your AutoCount Cloud Key ID"
                value={config.key_id ?? ""}
                onChange={(v) => setField("key_id", v)}
                hint="Generated alongside your API Key"
              />
            </>
          )}

          {provider === "autocount_aotg" && (
            <>
              <Field
                label="Access Token (SOTC_AUTH)"
                placeholder="Your AOTG access token"
                value={config.access_token ?? ""}
                onChange={(v) => setField("access_token", v)}
                secret
                hint="From AutoCount On The Go → API Settings"
              />
            </>
          )}

          {/* Test result */}
          {testMsg && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg ${testState === "ok" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"}`}>
              {testState === "ok" ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
              {testMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saveState === "saving"}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saveState === "saving" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {saveState === "saved" ? "Saved!" : saveState === "error" ? "Error" : "Save credentials"}
            </button>

            <button
              onClick={handleTest}
              disabled={testState === "testing"}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {testState === "testing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {testState === "testing" ? "Testing…" : "Test connection"}
            </button>

            {isActive && (
              <button
                onClick={handleDisconnect}
                className="ml-auto text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, placeholder, value, onChange, secret, hint,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  secret?: boolean;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={secret && !show ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-16"
        />
        {secret && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {hint && <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

export function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<Record<Provider, Integration | undefined>>({
    autocount_cloud: undefined,
    autocount_aotg: undefined,
    bukku: undefined,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/integrations")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, Integration> = {};
        for (const i of d.integrations ?? []) map[i.provider] = i;
        setIntegrations({
          autocount_cloud: map.autocount_cloud,
          autocount_aotg: map.autocount_aotg,
          bukku: map.bukku,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading integrations…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Accounting Integrations</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Connect your accounting software to link quotations and invoices directly to leads.
        </p>
      </div>

      {/* AutoCount Cloud */}
      <ProviderCard provider="autocount_cloud" initial={integrations.autocount_cloud} />

      {/* AutoCount AOTG */}
      <ProviderCard provider="autocount_aotg" initial={integrations.autocount_aotg} />

      {/* Bukku */}
      <ProviderCard provider="bukku" initial={integrations.bukku} />
    </div>
  );
}
