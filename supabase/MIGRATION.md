# LeadOS — Moving to a New Supabase Account (Fresh Rebuild)

**Why this exists:** The original Supabase project (`rxokgnnnvmykaephxvrm`) was **deleted** — its
subdomain no longer resolves in DNS, and there is no live copy or local backup. Both your local
`.env.local` and Vercel pointed to it. So we cannot *copy* the old data; we rebuild the schema on a
new account and re-seed from upstream sources.

The repo's old `supabase/*.sql` files were **incomplete** (missing the auth columns + a few others
added via dashboard migrations that died with the project). Use **`setup-fresh.sql`** instead — it is
reconstructed from the actual application code and is complete.

---

## What can / cannot be recovered

| Data | Recoverable? | How |
|---|---|---|
| Leads | ✅ Mostly | Re-sync from your original **Google Sheet** (Leads page → Sync button) |
| Campaigns | ✅ | Re-sync from **Meta Ads** (Campaigns → Sync) |
| Team members / admin login | ❌ rebuild | Recreate via `make-admin.mjs` (step 5) + Team page |
| Notes, tiers, knowledge base, manual edits, messages | ❌ lost | Were only in the deleted DB |

---

## Steps

### 1. Create the new project
- Log into your **new** Supabase account → **New project**.
- Pick region **Southeast Asia (Singapore)**. Set a strong DB password (save it).
- Wait for it to finish provisioning.

### 2. Build the schema
- Dashboard → **SQL Editor** → New query.
- Paste the entire contents of [`supabase/setup-fresh.sql`](./setup-fresh.sql) → **Run**.
- It creates all 9 tables, indexes, triggers, views, RLS, and seeds the workspace
  (reusing your old `WORKSPACE_ID` so that env var stays valid).

### 3. Create the Storage bucket
- Dashboard → **Storage** → **New bucket** → name it exactly `lead-documents` → **Private**.
- (Used by the lead document upload feature.)

### 4. Grab the new keys
- Dashboard → **Settings → API**. Copy:
  - `Project URL`  → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public`  → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`  (keep secret)

### 5. Create your admin login
From the project folder:
```bash
node scripts/make-admin.mjs <username> <password> "Your Name"
```
Copy the `INSERT` it prints → paste into SQL Editor → Run. That's your master admin.
(`AUTH_SECRET` and `WORKSPACE_ID` are unchanged — keep the existing values.)

### 6. Update environment variables
**Vercel** (Settings → Environment Variables → Production) — update these 3:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Local** `.env.local` — same 3 values. (The old ones in there are dead.)

### 7. Redeploy & verify
- Vercel → Deployments → **Redeploy** (or `git commit --allow-empty -m "rotate supabase" && git push`).
- Visit the site, log in with the admin from step 5.

### 8. Re-seed your data
- **Leads:** Leads page → **Sync** (point it at your original Google Sheet URL — saved in your
  browser localStorage if you used the same browser; otherwise re-enter the sheet URL).
- **Campaigns:** Campaigns page → **Sync** (needs Meta Ads creds in Settings → reconnect Meta).

---

## Notes
- Nothing here touches the dead old project; it's purely standing up a new one.
- After this, consider periodic backups: Supabase Pro has PITR, or schedule a `pg_dump` so a future
  deletion is recoverable.
