-- SouthBear OS: preparación comercial de facturación.
-- Esta tabla NO almacena facturas emitidas y NO genera números de factura.
CREATE TABLE IF NOT EXISTS invoice_drafts (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  quote_id TEXT REFERENCES quotes(id) ON DELETE RESTRICT,
  project_id TEXT REFERENCES projects(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
  planned_date TEXT NOT NULL,
  due_date TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  subtotal_cents INTEGER NOT NULL CHECK(subtotal_cents >= 0),
  tax_cents INTEGER NOT NULL CHECK(tax_cents >= 0),
  total_cents INTEGER NOT NULL CHECK(total_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK(currency = 'EUR'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  archived_at TEXT DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS invoice_drafts_client_idx ON invoice_drafts(client_id,archived_at);
CREATE INDEX IF NOT EXISTS invoice_drafts_updated_idx ON invoice_drafts(archived_at,updated_at DESC);
CREATE INDEX IF NOT EXISTS invoice_drafts_quote_idx ON invoice_drafts(quote_id);
CREATE TABLE IF NOT EXISTS invoice_draft_lines (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL REFERENCES invoice_drafts(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  concept TEXT NOT NULL CHECK(length(concept) BETWEEN 1 AND 240),
  details TEXT NOT NULL DEFAULT '',
  quantity_milli INTEGER NOT NULL CHECK(quantity_milli BETWEEN 1 AND 100000000),
  unit_gross_cents INTEGER NOT NULL CHECK(unit_gross_cents BETWEEN 0 AND 1000000000),
  vat_bps INTEGER NOT NULL CHECK(vat_bps IN (0,400,1000,2100)),
  base_cents INTEGER NOT NULL CHECK(base_cents >= 0),
  vat_cents INTEGER NOT NULL CHECK(vat_cents >= 0),
  total_cents INTEGER NOT NULL CHECK(total_cents >= 0),
  UNIQUE(draft_id,position)
);
CREATE INDEX IF NOT EXISTS invoice_draft_lines_draft_idx ON invoice_draft_lines(draft_id,position);
INSERT OR IGNORE INTO schema_migrations(version) VALUES('0005_invoice_drafts');
