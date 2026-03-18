/**
 * GET  /api/leads          — list leads (with pagination + filters)
 * POST /api/leads          — manually create a lead
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");       // filter by status
  const source = searchParams.get("source");       // filter by source
  const search = searchParams.get("q");            // search by name/phone
  const page   = parseInt(searchParams.get("page") ?? "1");
  const limit  = parseInt(searchParams.get("limit") ?? "50");
  const from   = (page - 1) * limit;
  const to     = from + limit - 1;

  try {
    const supabase = createAdminClient();

    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) query = query.eq("status", status);
    if (source) query = query.eq("source", source);
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      leads: data,
      total: count,
      page,
      limit,
    });
  } catch (err) {
    console.error("[GET /api/leads]", err);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name, source, campaign, status } = body;

    if (!phone) {
      return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("leads")
      .insert({ phone, name, source: source ?? "Manual", campaign, status: status ?? "new" })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ lead: data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/leads]", err);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
