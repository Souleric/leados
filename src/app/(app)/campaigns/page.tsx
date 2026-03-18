import { Header } from "@/components/layout/header";
import { campaigns } from "@/lib/mock-data";
import { CampaignChart } from "@/components/charts/campaign-chart";
import { TrendingUp, DollarSign, Users, Target, Plus } from "lucide-react";

const platformColors: Record<string, string> = {
  Facebook: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  Instagram: "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300",
  TikTok: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  ended: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

export default function CampaignsPage() {
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leadsGenerated, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const avgCPL = (totalSpend / totalLeads).toFixed(2);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Campaigns" />
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Campaigns</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{campaigns.length} active campaigns</p>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors">
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Spend", value: `RM ${totalSpend.toLocaleString()}`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
            { label: "Leads Generated", value: String(totalLeads), icon: Users, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
            { label: "Conversions", value: String(totalConversions), icon: Target, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
            { label: "Avg Cost / Lead", value: `RM ${avgCPL}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1.5">{kpi.value}</p>
                </div>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="mb-6">
          <CampaignChart />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {["Campaign Name", "Platform", "Status", "Spend (RM)", "Leads", "Conversions", "CPL (RM)", "Conv. Rate"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const cpl = (c.spend / c.leadsGenerated).toFixed(2);
                  const convRate = ((c.conversions / c.leadsGenerated) * 100).toFixed(1);
                  return (
                    <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{c.startDate} → {c.endDate}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${platformColors[c.platform]}`}>
                          {c.platform}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[c.status]}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {c.spend.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">{c.leadsGenerated}</td>
                      <td className="px-5 py-3.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">{c.conversions}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">{cpl}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden max-w-[60px]">
                            <div
                              className="h-full bg-violet-500 rounded-full"
                              style={{ width: `${Math.min(parseFloat(convRate) * 3, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{convRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
