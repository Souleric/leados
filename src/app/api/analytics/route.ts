import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const [leadsRes, perDayRes, perSourceRes] = await Promise.all([
      supabase.from("leads").select("status"),
      supabase.from("leads_per_day").select("*").limit(30),
      supabase.from("leads_per_source").select("*"),
    ]);

    if (leadsRes.error) throw leadsRes.error;

    const counts: Record<string, number> = {};
    for (const row of (leadsRes.data ?? []) as Array<{ status: string }>) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }

    const closedWon = counts["closed_won"] ?? 0;
    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    const qualified =
      (counts["contacted"] ?? 0) +
      (counts["quotation_sent"] ?? 0) +
      closedWon;

    return NextResponse.json({
      kpis: {
        totalLeads: total,
        qualifiedLeads: qualified,
        closedWon,
        conversionRate: total > 0 ? Math.round((closedWon / total) * 100) : 0,
      },
      perDay: perDayRes.data ?? [],
      perSource: perSourceRes.data ?? [],
    });
  } catch (err) {
    console.error("[GET /api/analytics]", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
