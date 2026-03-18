"use client";

import { Header } from "@/components/layout/header";
import { useState } from "react";
import { Wifi, Building2, Users, Webhook } from "lucide-react";
import { WhatsAppSettingsTab } from "@/components/settings/whatsapp-tab";
import { BusinessSettingsTab } from "@/components/settings/business-tab";
import { TeamSettingsTab } from "@/components/settings/team-tab";
import { WebhookSettingsTab } from "@/components/settings/webhook-tab";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "whatsapp", label: "WhatsApp", icon: Wifi },
  { id: "business", label: "Business Profile", icon: Building2 },
  { id: "team", label: "Team", icon: Users },
  { id: "webhook", label: "Webhook", icon: Webhook },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function SettingsPage() {
  const [active, setActive] = useState<TabId>("whatsapp");

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Settings" />
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Configure your WhatsApp connection and workspace
            </p>
          </div>

          {/* Tab nav */}
          <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-xl w-fit">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all",
                  active === id
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div>
            {active === "whatsapp" && <WhatsAppSettingsTab />}
            {active === "business" && <BusinessSettingsTab />}
            {active === "team"     && <TeamSettingsTab />}
            {active === "webhook"  && <WebhookSettingsTab />}
          </div>
        </div>
      </main>
    </div>
  );
}
