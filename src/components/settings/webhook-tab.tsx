"use client";

import { useState, useEffect } from "react";
import { Copy, Check, RefreshCw, Webhook, ShieldCheck, Loader2 } from "lucide-react";

function CopyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {hint && <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">{hint}</p>}
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-violet-700 dark:text-violet-300 font-mono truncate">
          {value}
        </code>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function randomToken(len = 32) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function WebhookSettingsTab() {
  const [verifyToken, setVerifyToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    setAppUrl(window.location.origin);

    fetch("/api/settings/workspace")
      .then((r) => r.json())
      .then(({ workspace }) => {
        if (workspace?.meta_webhook_verify_token) {
          setVerifyToken(workspace.meta_webhook_verify_token);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const generateToken = () => {
    setVerifyToken(randomToken());
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meta_webhook_verify_token: verifyToken }),
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

  const webhookUrl = `${appUrl}/api/webhook/whatsapp`;

  return (
    <div className="space-y-5">
      {/* Webhook URL + verify token */}
      <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <Webhook className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Webhook Endpoint</h3>
        </div>
        <div className="p-5 space-y-5">
          <CopyField
            label="Callback URL"
            hint='Paste this into Meta Developer Console → WhatsApp → Configuration → "Callback URL"'
            value={webhookUrl}
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Verify Token
            </label>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">
              Paste this into Meta Developer Console → "Verify Token". Keep it secret.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-violet-700 dark:text-violet-300 font-mono truncate">
                {verifyToken || "— not set —"}
              </code>
              <button
                onClick={() => {
                  if (verifyToken) {
                    navigator.clipboard.writeText(verifyToken);
                  }
                }}
                className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-400"
                title="Copy"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={generateToken}
                className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-400"
                title="Generate new token"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
              Click ↑ to generate a random secure token, then save.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !verifyToken}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
              saved
                ? "bg-emerald-600 text-white"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            } disabled:opacity-50`}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
            {saved ? "Saved!" : "Save Verify Token"}
          </button>
        </div>
      </div>

      {/* Step-by-step guide */}
      <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">How to Register the Webhook in Meta</h3>
        </div>
        <div className="p-5">
          <ol className="space-y-4">
            {[
              {
                step: 1,
                title: "Open Meta Developer Console",
                desc: "Go to developers.facebook.com → Your App → WhatsApp → Configuration",
              },
              {
                step: 2,
                title: 'Click "Edit" next to Webhook',
                desc: 'Paste the Callback URL above into "Callback URL" field',
              },
              {
                step: 3,
                title: "Enter the Verify Token",
                desc: 'Paste the Verify Token above into "Verify Token" field. Click "Verify and Save"',
              },
              {
                step: 4,
                title: 'Subscribe to "messages"',
                desc: 'After saving, click "Manage" next to Webhook Fields. Turn on the "messages" toggle.',
              },
              {
                step: 5,
                title: "Send a test message",
                desc: "Send a WhatsApp message to your business number. Within seconds it should appear as a new lead in your dashboard.",
              },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400">{step}</span>
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

      {/* Subscriptions reminder */}
      <div className="rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4">
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Required webhook field</p>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Make sure you subscribe to the <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">messages</code> field only.
          Other fields (message_template_status_update, etc.) are optional.
        </p>
      </div>
    </div>
  );
}
