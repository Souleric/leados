/**
 * POST /api/leads/sync-gsheet
 * Body: { url: string }
 *
 * Reads a public Google Sheet and syncs leads into LeadOS.
 * Only uses 6 fields:
 *   Basic:  full_name, email, phone
 *   Extra:  property_type, average_tnb_bill_per_month, address
 *
 * - New phone numbers → create lead (status: "new", source: "Google Sheet")
 * - Existing phone numbers → update name + notes only (never overwrite status/assigned_to)
 * - Returns { created, updated, skipped, total }
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

function extractCsvUrl(url: string): string | null {
  const m = url.match(/\/spreadsheets\/d\/([\w-]+)/);
  if (!m) return null;
  const sheetId = m[1];
  const gidM = url.match(/[?&#]gid=(\d+)/);
  const gid = gidM?.[1] ?? "0";
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

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

  const headers = parseLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
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

function normalizePhone(raw: string): string {
  let p = raw.trim().replace(/^p:/, "").trim();
  if (p && !p.startsWith("+")) p = "+" + p;
  return p;
}

function buildNotes(row: Record<string, string>): string {
  const parts: string[] = [];
  const email = row["email"] ?? "";
  const address = row["address"] ?? "";
  const tnb = row["average_tnb_bill_per_month"] ?? row["tnb_bill"] ?? row["average_tnb"] ?? "";
  if (email) parts.push(`Email: ${email}`);
  if (address) parts.push(`Address: ${address}`);
  if (tnb) parts.push(`Avg TNB Bill: RM ${tnb}`);
  return parts.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json() as { url?: string };
    if (!url?.trim()) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const csvUrl = extractCsvUrl(url);
    if (!csvUrl) {
      return NextResponse.json({ error: "Invalid Google Sheets URL" }, { status: 400 });
    }

    const csvRes = await fetch(csvUrl, { redirect: "follow" });
    if (!csvRes.ok) {
      return NextResponse.json(
        { error: "Cannot read sheet — make sure it's set to 'Anyone with the link can view'" },
        { status: 400 }
      );
    }

    const rows = parseCSV(await csvRes.text()).filter((r) => !isTestRow(r));
    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid rows found in sheet" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) {
      return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const phone = normalizePhone(row["phone"] ?? row["phone_number"] ?? "");
      if (!phone || phone === "+") { skipped++; continue; }

      const name = (row["full_name"] ?? row["name"] ?? "").trim() || null;
      const notes = buildNotes(row);
      const tags: string[] = [];
      const propType = (row["property_type"] ?? "").trim();
      if (propType) tags.push(propType);

      // Check if lead already exists
      const { data: existing } = await supabase
        .from("leads")
        .select("id, notes, tags")
        .eq("phone", phone)
        .eq("workspace_id", workspaceId)
        .single();

      if (existing) {
        // Update: refresh name + notes + tags, never touch status/assigned_to
        await supabase
          .from("leads")
          .update({ name: name || existing.name, notes, tags })
          .eq("id", existing.id);
        updated++;
      } else {
        // Create new lead
        const { error } = await supabase.from("leads").insert({
          workspace_id: workspaceId,
          phone,
          name,
          source: "Google Sheet",
          status: "new",
          notes,
          tags,
        });
        if (error) { skipped++; } else { created++; }
      }
    }

    return NextResponse.json({
      created,
      updated,
      skipped,
      total: rows.length,
      message: `${created} new lead${created !== 1 ? "s" : ""} · ${updated} updated · ${skipped} skipped`,
    });
  } catch (err: any) {
    console.error("[POST /api/leads/sync-gsheet]", err);
    return NextResponse.json({ error: err?.message ?? "Sync failed" }, { status: 500 });
  }
}
