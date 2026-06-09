#!/usr/bin/env node
// ============================================================
//  LeadOS — data restore (imports a backup made by backup-data.mjs)
//  PREREQUISITE: run supabase/setup-fresh.sql on the target project FIRST
//  (this only restores rows, not schema).
//
//  Env required:
//    SUPABASE_URL                (or NEXT_PUBLIC_SUPABASE_URL)
//    SUPABASE_SERVICE_ROLE_KEY
//  Optional:
//    BACKUP_DIR                  (default: ./_backup)
//
//  Run:  node scripts/restore-data.mjs
//  Upserts in FK-safe order. Safe to re-run (on_conflict=id, merge-duplicates).
// ============================================================
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DIR = process.env.BACKUP_DIR || "_backup";

if (!URL || !KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// FK-safe insertion order (parents before children).
const ORDER = [
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

const CHUNK = 500;

async function upsert(table, rows) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const res = await fetch(`${URL}/rest/v1/${table}?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
  }
}

for (const t of ORDER) {
  let rows;
  try {
    rows = JSON.parse(await readFile(join(DIR, `${t}.json`), "utf8"));
  } catch {
    console.log(`  ${t}: (no backup file, skipped)`);
    continue;
  }
  if (!rows.length) { console.log(`  ${t}: 0 rows`); continue; }
  await upsert(t, rows);
  console.log(`  ${t}: restored ${rows.length} rows`);
}

console.log("Restore complete.");
