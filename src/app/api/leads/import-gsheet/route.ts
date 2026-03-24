/**
 * POST /api/leads/import-gsheet
 * Body: { url: string }  — public Google Sheets URL (any format)
 *
 * Parses the sheet as CSV, maps columns to lead fields, and bulk-inserts
 * into the leads table. Skips test rows and duplicates (phone unique constraint).
 *
 * Column mapping (case-insensitive):
 *   full_name / name       → name
 *   phone                  → phone  (strips "p:" prefix)
 *   email                  → included in notes
 *   campaign_name          → campaign
 *   platform               → source  (fb→Facebook, ig→Instagram)
 *   property_type          → tag
 *   average_tnb_bill_per_month / tnb_bill → included in notes
 *   address                → included in notes
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

function extractSheetId(url: string): { sheetId: string; gid: string } | null {
  const m = url.match(/\/spreadsheets\/d\/([\w-]+)/);
  const gidM = url.match(/[?&#]gid=(\d+)/);
  if (!m) return null;
  return { sheetId: m[1], gid: gidM?.[1] ?? "0" };
}

function normalizePlatform(raw: string): string {
  const v = (raw ?? "").toLowerCase().trim();
  if (v === "fb" || v === "facebook") return "Facebook";
  if (v === "ig" || v === "instagram") return "Instagram";
  if (v === "tiktok") return "TikTok";
  if (v === "google") return "Google";
  return raw || "Other";
}

function normalizePhone(raw: string): string {
  // Strip "p:" prefix from Meta lead forms
  let p = raw.trim().replace(/^p:/, "").trim();
  // Ensure leading +
  if (p && !p.startsWith("+")) p = "+" + p;
  return p;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  // Parse a CSV line respecting quoted fields
  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === "," && !inQ) {
        fields.push(cur); cur = "";
      } else {
        cur += ch;
      }
    }
    fields.push(cur);
    return fields;
  }

  const headers = parseLine(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const vals = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (vals[i] ?? "").trim(); });
    return row;
  });
}

function isTestRow(row: Record<string, string>): boolean {
  return Object.values(row).some((v) => v.includes("<test lead"));
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json() as { url: string };
    if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

    const ids = extractSheetId(url);
    if (!ids) return NextResponse.json({ error: "Invalid Google Sheets URL" }, { status: 400 });

    // Fetch as CSV
    const csvUrl = `https://docs.google.com/spreadsheets/d/${ids.sheetId}/export?format=csv&gid=${ids.gid}`;
    const csvRes = await fetch(csvUrl, { redirect: "follow" });
    if (!csvRes.ok) return NextResponse.json({ error: "Could not fetch sheet — make sure sharing is set to 'Anyone with link can view'" }, { status: 400 });

    const text = await csvRes.text();
    const rows = parseCSV(text).filter((r) => !isTestRow(r));

    if (rows.length === 0) return NextResponse.json({ error: "No valid rows found in sheet" }, { status: 400 });

    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const leads = rows
      .map((row) => {
        const phone = normalizePhone(
          row["phone"] ?? row["phone_number"] ?? row["mobile"] ?? ""
        );
        if (!phone || phone === "+") return null;

        const name =
          row["full_name"] ?? row["name"] ?? row["fullname"] ?? row["nama"] ?? null;

        const campaign =
          row["campaign_name"] ?? row["campaign"] ?? null;

        const platformRaw =
          row["platform"] ?? row["channel"] ?? "";
        const source = normalizePlatform(platformRaw);

        // Build notes from extra fields
        const noteParts: string[] = [];
        const email = row["email"] ?? row["e-mail"] ?? "";
        if (email) noteParts.push(`Email: ${email}`);
        const address = row["address"] ?? row["alamat"] ?? "";
        if (address) noteParts.push(`Address: ${address}`);
        const tnb = row["average_tnb_bill_per_month"] ?? row["tnb_bill"] ?? row["bill"] ?? "";
        if (tnb) noteParts.push(`TNB Bill: RM${tnb}`);
        const propType = row["property_type"] ?? "";
        const notes = noteParts.join(" | ");

        const tags: string[] = [];
        if (propType) tags.push(propType);

        return { workspace_id: workspaceId, phone, name: name || null, source, campaign, status: "new" as const, notes, tags };
      })
      .filter(Boolean) as Array<{
        workspace_id: string; phone: string; name: string | null;
        source: string; campaign: string | null; status: "new"; notes: string; tags: string[];
      }>;

    if (leads.length === 0) return NextResponse.json({ error: "No rows with valid phone numbers found" }, { status: 400 });

    // Bulk insert — skip duplicates (phone is unique)
    const { data, error } = await supabase
      .from("leads")
      .upsert(leads, { onConflict: "phone", ignoreDuplicates: true })
      .select("id");

    if (error) throw error;

    return NextResponse.json({
      imported: data?.length ?? 0,
      total_rows: rows.length,
      message: `Imported ${data?.length ?? 0} leads (${rows.length - (data?.length ?? 0)} duplicates skipped)`,
    });
  } catch (err: any) {
    console.error("[POST /api/leads/import-gsheet]", err);
    return NextResponse.json({ error: err?.message ?? "Import failed" }, { status: 500 });
  }
}
