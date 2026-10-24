-- SouthBear Studio OS — 0002: Proyectos y Presupuestos (no facturas)
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  quote_id TEXT REFERENCES quotes(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
  category TEXT NOT NULL DEFAULT 'otro' CHECK(category IN ('diseno','web','audiovisual','otro')),
  status TEXT NOT NULL DEFAULT 'planificado' CHECK(status IN ('planificado','en_curso','en_revision','entregado','cancelado')),
  start_date TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  archived_at TEXT DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS projects_client_idx ON projects(client_id,archived_at);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status,archived_at,updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS projects_quote_unique ON projects(quote_id) WHERE quote_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
  status TEXT NOT NULL DEFAULT 'borrador' CHECK(status IN ('borrador','enviado','aceptado','rechazado','caducado')),
  issue_date TEXT NOT NULL,
  valid_until TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK(subtotal_cents>=0),
  tax_cents INTEGER NOT NULL DEFAULT 0 CHECK(tax_cents>=0),
  total_cents INTEGER NOT NULL DEFAULT 0 CHECK(total_cents>=0),
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK(currency='EUR'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  archived_at TEXT DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS quotes_client_idx ON quotes(client_id,archived_at);
CREATE INDEX IF NOT EXISTS quotes_status_idx ON quotes(status,archived_at,updated_at DESC);
CREATE TABLE IF NOT EXISTS quote_lines (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  concept TEXT NOT NULL CHECK(length(concept) BETWEEN 1 AND 240),
  details TEXT NOT NULL DEFAULT '',
  quantity_milli INTEGER NOT NULL CHECK(quantity_milli BETWEEN 1 AND 100000000),
  unit_cents INTEGER NOT NULL CHECK(unit_cents BETWEEN 0 AND 1000000000),
  vat_bps INTEGER NOT NULL CHECK(vat_bps IN (0,400,1000,2100)),
  base_cents INTEGER NOT NULL CHECK(base_cents>=0),
  vat_cents INTEGER NOT NULL CHECK(vat_cents>=0),
  total_cents INTEGER NOT NULL CHECK(total_cents>=0),
  UNIQUE(quote_id,position)
);
CREATE INDEX IF NOT EXISTS quote_lines_quote_idx ON quote_lines(quote_id,position);
INSERT OR IGNORE INTO schema_migrations(version) VALUES ('0002_quotes_projects');
