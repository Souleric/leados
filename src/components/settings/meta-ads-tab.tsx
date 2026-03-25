"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, RefreshCw, BarChart2, ExternalLink, Zap } from "lucide-react";

type SaveState = "idle" | "saving" | "saved" | "error";
type TestState = "idle" | "testing" | "ok" | "fail";

export function MetaAdsSettingsTab() {
  const [adAccountId, setAdAccountId] = useState("");
  const [adsToken, setAdsToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [testState, setTestState] = useState<TestState>("idle");
  const [testResult, setTestResult] = useState<{ name?: string; status?: string; error?: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings/workspace")
      .then((r) => r.json())
      .then(({ workspace }) => {
        if (workspace) {
          setAdAccountId(workspace.meta_ad_account_id ?? "");
          if (workspace.meta_ads_access_token) {
            setAdsToken(`${workspace.meta_ads_access_token.slice(0, 8)}${"•".repeat(20)}`);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaveState("saving");
    try {
      const body: Record<string, string> = { meta_ad_account_id: adAccountId };
      if (adsToken && !adsToken.includes("•")) {
        body.meta_ads_access_token = adsToken;
      }
      const res = await fetch("/api/settings/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  };

  const handleTest = async () => {
    if (!adAccountId) {
      setTestResult({ error: "Enter an Ad Account ID first" });
      setTestState("fail");
      return;
    }
    setTestState("testing");
    setTestResult(null);
    try {
      const tokenToUse = adsToken.includes("•") ? "__use_saved_ads__" : adsToken;
      const res = await fetch("/api/settings/test-ads-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adAccountId, adsToken: tokenToUse }),
      });
      const result = await res.json();
      if (result.success) {
        setTestState("ok");
        setTestResult({ name: result.name, status: result.status });
      } else {
        setTestState("fail");
        setTestResult({ error: result.error });
      }
    } catch {
      setTestState("fail");
      setTestResult({ error: "Request failed" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Info banner */}
      <div className="rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 p-4 flex items-start gap-3">
        <BarChart2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Standalone Meta Ads Integration</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            Connect your Meta Ad Account to sync campaign performance — spend, CPL, impressions, clicks.
            Works independently from WhatsApp. No WhatsApp Business Account required.
          </p>
        </div>
      </div>

      {/* Credentials */}
      <div className="bg-white dark:bg-white/[0.04] rounded-lg border border-slate-100/80 dark:border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Ad Account Credentials</h3>
        </div>
        <div className="p-5 space-y-4">

          {/* Ad Account ID */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Ad Account ID
            </label>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">
              Meta Business Manager → Ad Accounts → Account ID (numbers only, e.g. 123456789)
            </p>
            <input
              type="text"
              value={adAccountId}
              onChange={(e) => setAdAccountId(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="123456789"
              className="w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none focus:border-indigo-300 dark:focus:border-indigo-700 transition-colors font-mono"
            />
          </div>

          {/* Ads Access Token */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Access Token <span className="text-[10px] font-normal text-gray-400">(requires <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">ads_read</code> permission)</span>
            </label>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">
              Meta Business Settings → System Users → Generate Token → add <strong>ads_read</strong> permission.
              Can be the same token as WhatsApp if it has both permissions.
            </p>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={adsToken}
                onChange={(e) => setAdsToken(e.target.value)}
                placeholder="EAAx..."
                className="w-full text-xs px-3.5 py-2.5 pr-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none focus:border-indigo-300 dark:focus:border-indigo-700 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`rounded-xl px-4 py-3 text-xs flex items-center gap-2 ${
              testState === "ok"
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
            }`}>
              {testState === "ok"
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <XCircle className="w-4 h-4 shrink-0" />}
              {testState === "ok"
                ? `Connected ✓  Account: ${testResult.name} · Status: ${testResult.status}`
                : `Error: ${testResult.error}`}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleTest}
              disabled={testState === "testing"}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {testState === "testing"
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />}
              Test Connection
            </button>
            <button
              onClick={handleSave}
              disabled={saveState === "saving"}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
                saveState === "saved"  ? "bg-emerald-600 text-white" :
                saveState === "error" ? "bg-red-500 text-white" :
                "bg-indigo-600 hover:bg-indigo-700 text-white"
              } disabled:opacity-50`}
            >
              {saveState === "saving" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
               saveState === "saved"  ? <CheckCircle2 className="w-3.5 h-3.5" /> :
               <Zap className="w-3.5 h-3.5" />}
              {saveState === "saved" ? "Saved!" : saveState === "error" ? "Failed" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Setup guide */}
      <div className="bg-white dark:bg-white/[0.04] rounded-lg border border-slate-100/80 dark:border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">How to Get Your Ad Account Credentials</h3>
        </div>
        <div className="p-5">
          <ol className="space-y-4">
            {[
              {
                step: 1,
                title: "Find your Ad Account ID",
                desc: "Go to business.facebook.com → Business Settings → Ad Accounts. Copy the Account ID (numbers only).",
              },
              {
                step: 2,
                title: "Create or use a System User",
                desc: "Business Settings → System Users → Add System User (or use existing). Assign the Ad Account to this user with Advertiser access.",
              },
              {
                step: 3,
                title: "Generate a token with ads_read",
                desc: 'Click "Generate New Token" → select your app → tick "ads_read" → Generate. If you also use WhatsApp, add both ads_read and whatsapp_business_messaging to the same token.',
              },
              {
                step: 4,
                title: "Save and test",
                desc: 'Paste the Account ID and token above → click "Test Connection" → if successful, click Save.',
              },
              {
                step: 5,
                title: "Sync campaigns",
                desc: 'Go to Campaigns page → click "Sync from Meta" to pull your campaign data.',
              },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{step}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Useful links */}
      <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/30">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Useful links</p>
        <div className="space-y-1.5">
          {[
            { label: "Meta Business Manager — Ad Accounts", href: "https://business.facebook.com/settings/ad-accounts" },
            { label: "Meta Business Manager — System Users", href: "https://business.facebook.com/settings/system-users" },
            { label: "Meta Marketing API documentation", href: "https://developers.facebook.com/docs/marketing-apis" },
          ].map(({ label, href }) => (
            <a key={href} href={href} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              {label}
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
