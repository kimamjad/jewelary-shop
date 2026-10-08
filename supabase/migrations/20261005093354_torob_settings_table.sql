/*
# Torob Integration Settings Table

## Purpose
Stores Torob integration configuration (enable/disable, API hostname, last sync status).
The edge function reads this table to determine if the integration is active.

## Tables
- `torob_settings`: Key-value settings store for Torob integration

## Security
- RLS enabled
- Public read (anon + authenticated) so the edge function can read config
- Admin-only writes (INSERT/UPDATE/DELETE)
*/

CREATE TABLE IF NOT EXISTS torob_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE torob_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_torob_settings" ON torob_settings;
CREATE POLICY "public_read_torob_settings" ON torob_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_torob_settings" ON torob_settings;
CREATE POLICY "admin_insert_torob_settings" ON torob_settings FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "admin_update_torob_settings" ON torob_settings;
CREATE POLICY "admin_update_torob_settings" ON torob_settings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "admin_delete_torob_settings" ON torob_settings;
CREATE POLICY "admin_delete_torob_settings" ON torob_settings FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );
