"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2, XCircle, Loader2, Eye, EyeOff,
  ExternalLink, RefreshCw, Zap, ArrowRight,
} from "lucide-react";
import Script from "next/script";

interface WorkspaceData {
  meta_connected: boolean;
  meta_phone_display: string | null;
  meta_business_name: string | null;
  meta_connected_at: string | null;
  meta_app_id: string | null;
  meta_phone_number_id: string | null;
  meta_waba_id: string | null;
  meta_access_token: string | null;
  meta_webhook_verify_token: string | null;
}

type SaveState = "idle" | "saving" | "saved" | "error";
type TestState = "idle" | "testing" | "ok" | "fail";

declare global {
  interface Window {
    FB: {
      init: (opts: object) => void;
      login: (
        cb: (res: { authResponse?: { code?: string; accessToken?: string } }) => void,
        opts: object
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

export function WhatsAppSettingsTab() {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [appId, setAppId] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [testState, setTestState] = useState<TestState>("idle");
  const [testResult, setTestResult] = useState<{ name?: string; phone?: string; error?: string } | null>(null);

  const [embeddedLoading, setEmbeddedLoading] = useState(false);
  const [fbReady, setFbReady] = useState(false);

  // Load workspace settings
  useEffect(() => {
    fetch("/api/settings/workspace")
      .then((r) => r.json())
      .then(({ workspace }) => {
        if (workspace) {
          setData(workspace);
          setAppId(workspace.meta_app_id ?? "");
          setPhoneNumberId(workspace.meta_phone_number_id ?? "");
          setWabaId(workspace.meta_waba_id ?? "");
          setVerifyToken(workspace.meta_webhook_verify_token ?? "");
          // Don't pre-fill token (it's masked)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Init Facebook SDK once appId is set
  useEffect(() => {
    if (!appId || fbReady) return;
    window.fbAsyncInit = () => {
      window.FB?.init({
        appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v19.0",
      });
      setFbReady(true);
    };
  }, [appId, fbReady]);

  // ── Embedded Signup ────────────────────────────────────────
  const handleEmbeddedSignup = () => {
    if (!window.FB) {
      alert("Facebook SDK not loaded yet. Make sure App ID is saved first.");
      return;
    }
    setEmbeddedLoading(true);

    window.FB.login(
      async (response) => {
        if (!response.authResponse?.code) {
          setEmbeddedLoading(false);
          return;
        }

        try {
          const res = await fetch("/api/meta/embedded-signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: response.authResponse.code }),
          });
          const result = await res.json();
          if (result.success) {
            setData((prev) => ({
              ...prev!,
              meta_connected: true,
              meta_phone_display: result.phoneDisplay,
              meta_business_name: result.verifiedName,
              meta_connected_at: new Date().toISOString(),
            }));
            setPhoneNumberId(result.phoneNumberId ?? "");
          } else {
            alert(result.error ?? "Connection failed");
          }
        } catch {
          alert("Connection failed");
        } finally {
          setEmbeddedLoading(false);
        }
      },
      {
        config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID ?? "",
        response_type: "code",
        override_default_response_type: true,
        extras: {
          sessionInfoVersion: 2,
          setup: {},
        },
      }
    );
  };

  // ── Save settings ──────────────────────────────────────────
  const handleSave = async () => {
    setSaveState("saving");
    try {
      const body: Record<string, string> = {
        meta_app_id: appId,
        meta_phone_number_id: phoneNumberId,
        meta_waba_id: wabaId,
        meta_webhook_verify_token: verifyToken,
      };
      // Only send token if user actually typed a new one (not the masked value)
      if (accessToken && !accessToken.includes("•")) {
        body.meta_access_token = accessToken;
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

  // ── Test connection ────────────────────────────────────────
  const handleTest = async () => {
    setTestState("testing");
    setTestResult(null);
    try {
      const tokenToTest = accessToken.includes("•")
        ? "__use_saved__"
        : accessToken;

      const res = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: tokenToTest,
          phoneNumberId,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setTestState("ok");
        setTestResult({ name: result.verifiedName, phone: result.phoneDisplay });
        setData((prev) => ({
          ...prev!,
          meta_connected: true,
          meta_phone_display: result.phoneDisplay,
          meta_business_name: result.verifiedName,
          meta_connected_at: new Date().toISOString(),
        }));
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
        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Load FB SDK */}
      <Script src="https://connect.facebook.net/en_US/sdk.js" strategy="lazyOnload" />

      <div className="space-y-5">
        {/* Connection status banner */}
        <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
          data?.meta_connected
            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40"
            : "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40"
        }`}>
          {data?.meta_connected ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-amber-500 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${data?.meta_connected ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
              {data?.meta_connected ? "WhatsApp Connected" : "WhatsApp Not Connected"}
            </p>
            {data?.meta_connected ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                {data.meta_business_name && <span className="font-medium">{data.meta_business_name}</span>}
                {data.meta_phone_display && <span> · {data.meta_phone_display}</span>}
              </p>
            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Connect your WhatsApp Business Account to start receiving leads
              </p>
            )}
          </div>
          {data?.meta_connected && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 shrink-0">
              {data.meta_connected_at
                ? `Since ${new Date(data.meta_connected_at).toLocaleDateString()}`
                : "Active"}
            </span>
          )}
        </div>

        {/* ── Option A: Embedded Signup ── */}
        <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Connect</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Recommended — connect with one click via Meta login</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-1 bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 rounded-full">
              RECOMMENDED
            </span>
          </div>
          <div className="p-5">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-5">
              {["Save your App ID below first", "Click Connect", "Log in to Meta", "Done!"].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">{i + 1}</span>
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">{step}</span>
                  </div>
                  {i < 3 && <ArrowRight className="w-3 h-3 text-gray-300 dark:text-gray-600 shrink-0" />}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleEmbeddedSignup}
                disabled={embeddedLoading || !appId}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {embeddedLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                )}
                Continue with Facebook
              </button>
              {!appId && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ↓ Enter your App ID first
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Option B: Manual setup ── */}
        <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Manual Configuration</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Enter your credentials from the{" "}
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noreferrer"
                className="text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-0.5"
              >
                Meta Developer Console
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          <div className="p-5 space-y-4">
            {/* App ID */}
            <Field
              label="Meta App ID"
              hint="Developer Console → Your App → App ID"
              value={appId}
              onChange={setAppId}
              placeholder="123456789012345"
            />

            {/* Phone Number ID */}
            <Field
              label="Phone Number ID"
              hint="WhatsApp → API Setup → Phone Number ID"
              value={phoneNumberId}
              onChange={setPhoneNumberId}
              placeholder="123456789012345"
            />

            {/* WABA ID */}
            <Field
              label="WhatsApp Business Account ID"
              hint="WhatsApp → API Setup → WhatsApp Business Account ID"
              value={wabaId}
              onChange={setWabaId}
              placeholder="123456789012345"
            />

            {/* Access Token */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Access Token
              </label>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">
                Business Settings → System Users → Generate Token (with whatsapp_business_messaging permission)
              </p>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EAAx..."
                  className="w-full text-xs px-3.5 py-2.5 pr-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none focus:border-violet-300 dark:focus:border-violet-700 transition-colors font-mono"
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
                {testState === "ok" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                {testState === "ok"
                  ? `Connected ✓  ${testResult.name} · ${testResult.phone}`
                  : `Error: ${testResult.error}`}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleTest}
                disabled={testState === "testing" || !phoneNumberId}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {testState === "testing" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Test Connection
              </button>

              <button
                onClick={handleSave}
                disabled={saveState === "saving"}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
                  saveState === "saved"
                    ? "bg-emerald-600 text-white"
                    : saveState === "error"
                    ? "bg-red-500 text-white"
                    : "bg-violet-600 hover:bg-violet-700 text-white"
                } disabled:opacity-50`}
              >
                {saveState === "saving" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : saveState === "saved" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                {saveState === "saved" ? "Saved!" : saveState === "error" ? "Failed" : "Save Settings"}
              </button>
            </div>
          </div>
        </div>

        {/* Help callout */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/30">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Need help setting up?</p>
          <div className="space-y-1.5">
            {[
              { label: "Meta WhatsApp Cloud API — Getting Started", href: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" },
              { label: "Create a System User for permanent tokens", href: "https://business.facebook.com/settings/system-users" },
              { label: "WhatsApp Embedded Signup guide", href: "https://developers.facebook.com/docs/whatsapp/embedded-signup" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:underline"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Field({
  label, hint, value, onChange, placeholder,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">{hint}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none focus:border-violet-300 dark:focus:border-violet-700 transition-colors font-mono"
      />
    </div>
  );
}
