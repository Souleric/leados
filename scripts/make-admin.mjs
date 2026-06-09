#!/usr/bin/env node
// ============================================================
//  LeadOS — generate the bootstrap admin INSERT
//  Usage:  node scripts/make-admin.mjs <username> <password> ["Display Name"]
//  Prints a SQL INSERT you paste into the new project's SQL Editor.
//  Your password is bcrypt-hashed locally and never leaves your machine.
// ============================================================
import bcrypt from "bcryptjs";

const [, , username, password, name] = process.argv;
const WORKSPACE_ID = "80d301e3-6f64-43d5-968b-d9bfdb08788f"; // same as setup-fresh.sql

if (!username || !password) {
  console.error("Usage: node scripts/make-admin.mjs <username> <password> [\"Display Name\"]");
  process.exit(1);
}
if (password.length < 6) {
  console.error("Password must be at least 6 characters.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
const displayName = (name || username).replace(/'/g, "''");
const user = username.trim().replace(/'/g, "''");

console.log(`
-- Paste this into the new project's SQL Editor (after setup-fresh.sql):
insert into public.team_members
  (workspace_id, name, username, password_hash, role, is_master_admin, status)
values
  ('${WORKSPACE_ID}', '${displayName}', '${user}', '${hash}', 'admin', true, 'offline');

-- Login with username: ${username}   password: (the one you just typed)
`);
