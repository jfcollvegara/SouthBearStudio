-- SouthBear Studio OS — migration 0001: clientes y registro de actividad
-- Cloudflare D1 (SQLite), independiente del proyecto HyperDrive
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 160),
  client_type TEXT NOT NULL DEFAULT 'empresa' CHECK(client_type IN ('empresa','particular')),
  legal_name TEXT NOT NULL DEFAULT '',
  tax_id TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'España',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  archived_at TEXT DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS clients_active_name_idx ON clients(archived_at, display_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS clients_updated_idx ON clients(updated_at DESC);
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('create','update','archive','restore')),
  actor_email TEXT NOT NULL,
  field_names TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS audit_subject_idx ON audit_events(subject_type,subject_id,created_at DESC);
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT OR IGNORE INTO schema_migrations(version) VALUES ('0001_clients');
