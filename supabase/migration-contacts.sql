-- ============================================================
-- LeadOS: Contacts model migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create membership_tiers table (must exist before FK on leads)
CREATE TABLE IF NOT EXISTS membership_tiers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         text NOT NULL,
  color        text NOT NULL DEFAULT '#6366f1',
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 2. Add new columns to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lifecycle_stage  text NOT NULL DEFAULT 'active_lead',
  ADD COLUMN IF NOT EXISTS tier_id          uuid REFERENCES membership_tiers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS proposal_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS inactivity_reason text,
  ADD COLUMN IF NOT EXISTS client_since     timestamptz;

-- 3. Migrate existing status values BEFORE updating the constraint
UPDATE leads SET status = 'proposal_sent' WHERE status = 'quotation_sent';
UPDATE leads SET
  status          = 'converted',
  lifecycle_stage = 'client',
  client_since    = COALESCE(updated_at, now())
WHERE status = 'closed_won';
UPDATE leads SET
  status          = 'inactive',
  lifecycle_stage = 'inactive_lead'
WHERE status = 'lost';

-- 4. Replace old status check constraint with new values
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'contacted', 'proposal_sent', 'converted', 'inactive'));

-- 5. Add lifecycle_stage constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lifecycle_stage_check;
ALTER TABLE leads ADD CONSTRAINT leads_lifecycle_stage_check
  CHECK (lifecycle_stage IN ('active_lead', 'client', 'inactive_lead'));

-- 6. Insert default membership tier for existing workspace
INSERT INTO membership_tiers (workspace_id, name, color, sort_order)
VALUES ('80d301e3-6f64-43d5-968b-d9bfdb08788f', 'Basic Member', '#6366f1', 0)
ON CONFLICT DO NOTHING;

-- Done!
