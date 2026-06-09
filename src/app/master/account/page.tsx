"use client";

import { Header } from "@/components/layout/header";
import { AccountTab } from "@/components/settings/account-tab";

export default function MasterAccountPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Account" />
      <main className="flex-1 overflow-y-auto px-7 pb-8 pt-6 scrollbar-thin">
        <div className="max-w-2xl">
          <AccountTab />
        </div>
      </main>
    </div>
  );
}
