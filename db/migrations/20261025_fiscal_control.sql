-- SOUTHBEAR OS · Control interno fiscal (no es software de emisión de facturas).
-- Migración aditiva: conserva íntegros los borradores, clientes, gastos y cobros existentes.
ALTER TABLE invoice_drafts ADD COLUMN withholding_bps INTEGER DEFAULT NULL
  CHECK (withholding_bps IS NULL OR withholding_bps BETWEEN 0 AND 10000);

CREATE TABLE IF NOT EXISTS sb_tax_invoices (
  id TEXT PRIMARY KEY NOT NULL,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  reference TEXT NOT NULL UNIQUE CHECK (length(reference) BETWEEN 1 AND 100),
  issue_date TEXT NOT NULL,
  tax_date TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('ordinaria','simplificada','anticipo','final','rectificativa')),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 300),
  base_cents INTEGER NOT NULL CHECK (base_cents BETWEEN 0 AND 100000000000),
  vat_bps INTEGER NOT NULL CHECK (vat_bps IN (0,400,1000,2100)),
  vat_cents INTEGER NOT NULL CHECK (vat_cents >= 0),
  withholding_bps INTEGER NOT NULL CHECK (withholding_bps BETWEEN 0 AND 10000),
  withholding_cents INTEGER NOT NULL CHECK (withholding_cents >= 0),
  total_cents INTEGER NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  archived_at TEXT DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_sb_tax_invoice_date ON sb_tax_invoices(tax_date,archived_at);

CREATE TABLE IF NOT EXISTS sb_tax_expense_flags (
  expense_id TEXT PRIMARY KEY NOT NULL REFERENCES expenses(id) ON DELETE RESTRICT,
  vat_deductible_cents INTEGER NOT NULL DEFAULT 0 CHECK (vat_deductible_cents >= 0),
  irpf_deductible_cents INTEGER NOT NULL DEFAULT 0 CHECK (irpf_deductible_cents >= 0),
  notes TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
