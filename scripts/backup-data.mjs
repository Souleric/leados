#!/usr/bin/env node
// ============================================================
//  LeadOS — data backup (exports every table to JSON via the REST API)
//  Pairs with supabase/setup-fresh.sql (schema) for a full restore.
//
//  Env required:
//    SUPABASE_URL                (or NEXT_PUBLIC_SUPABASE_URL)
//    SUPABASE_SERVICE_ROLE_KEY
//  Optional:
//    BACKUP_DIR                  (default: ./_backup)
//
//  Run locally:  node scripts/backup-data.mjs
//  In CI:        see .github/workflows/backup.yml
// ============================================================
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DIR = process.env.BACKUP_DIR || "_backup";

if (!URL || !KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Every data table (schema itself lives in supabase/setup-fresh.sql).
const TABLES = [
  "workspaces",
  "team_members",
  "membership_tiers",
  "leads",
  "messages",
  "campaigns",
  "integrations",
  "lead_documents",
  "knowledge_base",
];

const PAGE = 1000;

async function fetchAll(table) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const to = from + PAGE - 1;
    const res = await fetch(`${URL}/rest/v1/${table}?select=*`, {
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        Range: `${from}-${to}`,
        "Range-Unit": "items",
      },
    });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return rows;
}

const stamp = new Date().toISOString();
await mkdir(DIR, { recursive: true });

const manifest = { exported_at: stamp, project: URL, tables: {} };
let grandTotal = 0;

for (const t of TABLES) {
  const rows = await fetchAll(t);
  await writeFile(join(DIR, `${t}.json`), JSON.stringify(rows, null, 2));
  manifest.tables[t] = rows.length;
  grandTotal += rows.length;
  console.log(`  ${t}: ${rows.length} rows`);
}

await writeFile(join(DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Backup complete — ${grandTotal} rows across ${TABLES.length} tables → ${DIR}/`);
