"use client";

import { Header } from "@/components/layout/header";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Wifi, Building2, Users, Webhook, BarChart2, BookOpen, Plug, UserCircle } from "lucide-react";
import { WhatsAppSettingsTab } from "@/components/settings/whatsapp-tab";
import { MetaAdsSettingsTab } from "@/components/settings/meta-ads-tab";
import { BusinessSettingsTab } from "@/components/settings/business-tab";
import { TeamSettingsTab } from "@/components/settings/team-tab";
import { WebhookSettingsTab } from "@/components/settings/webhook-tab";
import { KnowledgeBaseTab } from "@/components/settings/knowledge-base-tab";
import { IntegrationsTab } from "@/components/settings/integrations-tab";
import { AccountTab } from "@/components/settings/account-tab";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "whatsapp",       label: "WhatsApp",       icon: Wifi,       desc: "WhatsApp Business API" },
  { id: "meta-ads",       label: "Meta Ads",        icon: BarChart2,  desc: "Facebook & Instagram Ads" },
  { id: "business",       label: "Business",        icon: Building2,  desc: "Business profile" },
  { id: "team",           label: "Team",            icon: Users,      desc: "Manage members" },
  { id: "knowledge-base", label: "Knowledge Base",  icon: BookOpen,   desc: "Bot FAQ & product info" },
  { id: "integrations",   label: "Integrations",    icon: Plug,       desc: "AutoCount & Bukku" },
  { id: "webhook",        label: "Webhook",         icon: Webhook,    desc: "Webhook endpoint" },
  { id: "account",        label: "My Account",      icon: UserCircle, desc: "Password & sign out" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [active, setActive] = useState<TabId>("whatsapp");

  // Support ?tab= query param (e.g. from "Add Member" button on Team page)
  useEffect(() => {
    const tab = searchParams.get("tab") as TabId | null;
    if (tab && tabs.find((t) => t.id === tab)) {
      setActive(tab);
    }
  }, [searchParams]);

  const handleTabChange = (id: TabId) => {
    setActive(id);
    router.replace(`/settings?tab=${id}`, { scroll: false });
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Settings" />
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Configure your integrations and workspace
            </p>
          </div>

          {/* Tab nav */}
          <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-xl w-fit">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
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
            {active === "whatsapp"       && <WhatsAppSettingsTab />}
            {active === "meta-ads"       && <MetaAdsSettingsTab />}
            {active === "business"       && <BusinessSettingsTab />}
            {active === "team"           && <TeamSettingsTab />}
            {active === "knowledge-base" && <KnowledgeBaseTab />}
            {active === "integrations"   && <IntegrationsTab />}
            {active === "webhook"        && <WebhookSettingsTab />}
            {active === "account"        && <AccountTab />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex flex-col flex-1 overflow-hidden" />}>
      <SettingsContent />
    </Suspense>
  );
}
