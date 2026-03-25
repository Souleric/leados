"use client";

import { Header } from "@/components/layout/header";
import { Mail, Send, BarChart2, Users, Zap } from "lucide-react";

const features = [
  {
    icon: Send,
    title: "Campaign Composer",
    description: "Design and send email campaigns to your clients or active leads. Filter by membership tier, lifecycle stage, or source.",
  },
  {
    icon: BarChart2,
    title: "Open & Click Tracking",
    description: "Track who opened your emails and which links they clicked. See real-time delivery and engagement stats.",
  },
  {
    icon: Users,
    title: "Audience Segments",
    description: "Target by membership tier (Basic, VIP), lifecycle stage, or custom tags. No more blasting everyone.",
  },
  {
    icon: Zap,
    title: "Provider Integrations",
    description: "Connect Resend or Amazon SES as your email relay. Full control — no third-party campaign tool needed.",
  },
];

export default function EmailMarketingPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Email Marketing" />
      <main className="flex-1 overflow-y-auto px-7 pb-8 scrollbar-thin">

        <div className="max-w-2xl mx-auto mt-16 text-center">
          <div className="w-16 h-16 rounded-xl bg-[#EBF2FF] dark:bg-[#1E6FEB]/15 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-8 h-8 text-[#1E6FEB]" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-4">
            Coming Soon
          </div>

          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Email Marketing</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-10">
            Send targeted email campaigns to your clients and leads — directly from LeadOS.
            Track opens, clicks, and conversions without a third-party tool.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-white dark:bg-white/[0.04] shadow-card dark:border dark:border-white/[0.06] rounded-lg p-5">
                <div className="w-9 h-9 rounded-md bg-[#EBF2FF] dark:bg-[#1E6FEB]/15 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-[#1E6FEB]" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">{title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
