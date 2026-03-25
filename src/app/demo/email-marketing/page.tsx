"use client";

import { DemoHeader } from "@/components/demo/header";
import { Mail, Send, BarChart2, Users, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: Send,
    title: "Campaign Composer",
    desc: "Design and send targeted email campaigns to your contacts and clients with a drag-and-drop editor.",
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
  },
  {
    icon: BarChart2,
    title: "Open & Click Tracking",
    desc: "See who opened your emails, what they clicked, and which campaigns drive the most conversions.",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    icon: Users,
    title: "Audience Segments",
    desc: "Send the right message to the right people — segment by lifecycle stage, tier, source, or assigned agent.",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
  },
  {
    icon: Zap,
    title: "Provider Integrations",
    desc: "Connect your existing email provider — Mailchimp, Brevo, SendGrid, or use our built-in mailer.",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-500/10",
  },
];

export default function DemoEmailMarketingPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <DemoHeader title="Email Marketing" />
      <main className="flex-1 overflow-y-auto px-7 pb-8 scrollbar-thin">

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-5">
            <Mail className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Email Marketing</h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mb-2">Coming soon</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mb-10">
            Send targeted campaigns to your leads and clients directly from LeadOS — no external tool needed.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl text-left">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white dark:bg-white/[0.04] rounded-lg shadow-card dark:border dark:border-white/[0.06] p-5 flex gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${f.bg}`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{f.title}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
