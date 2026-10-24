-- SouthBear OS: control de cobros reales y planes de pago (sin facturas emitidas).
-- Importes en céntimos. No altera presupuestos ni borradores existentes.
CREATE TABLE IF NOT EXISTS collection_plans (
 id TEXT PRIMARY KEY,
 client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
 quote_id TEXT REFERENCES quotes(id) ON DELETE RESTRICT,
 project_id TEXT REFERENCES projects(id) ON DELETE RESTRICT,
 draft_id TEXT REFERENCES invoice_drafts(id) ON DELETE RESTRICT,
 title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
 total_cents INTEGER NOT NULL CHECK(total_cents BETWEEN 1 AND 100000000000),
 advance_cents INTEGER NOT NULL CHECK(advance_cents BETWEEN 0 AND total_cents),
 advance_due_date TEXT NOT NULL DEFAULT '',
 final_due_date TEXT NOT NULL DEFAULT '',
 notes TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 archived_at TEXT DEFAULT NULL,
 CHECK(quote_id IS NULL OR draft_id IS NULL)
);
CREATE INDEX IF NOT EXISTS collection_plans_client_idx ON collection_plans(client_id,archived_at);
CREATE INDEX IF NOT EXISTS collection_plans_updated_idx ON collection_plans(archived_at,updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS collection_plan_per_quote ON collection_plans(quote_id) WHERE quote_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS collection_plan_per_project ON collection_plans(project_id) WHERE project_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS collection_plan_per_draft ON collection_plans(draft_id) WHERE draft_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS collection_receipts (
 id TEXT PRIMARY KEY,
 plan_id TEXT NOT NULL REFERENCES collection_plans(id) ON DELETE RESTRICT,
 amount_cents INTEGER NOT NULL CHECK(amount_cents BETWEEN 1 AND 100000000000),
 paid_date TEXT NOT NULL,
 method TEXT NOT NULL CHECK(method IN ('transferencia','tarjeta','efectivo','bizum','otro')),
 reference TEXT NOT NULL DEFAULT '',
 notes TEXT NOT NULL DEFAULT '',
 canceled_at TEXT DEFAULT NULL,
 cancel_reason TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS collection_receipts_plan_idx ON collection_receipts(plan_id,created_at DESC);
CREATE INDEX IF NOT EXISTS collection_receipts_date_idx ON collection_receipts(paid_date DESC);
-- Una recepción no puede superar el importe contratado, incluyendo inserciones concurrentes.
-- La corrección de un cobro se registra anulándolo, no eliminándolo.
CREATE TRIGGER IF NOT EXISTS collection_no_overpayment BEFORE INSERT ON collection_receipts
BEGIN
 SELECT CASE
 WHEN (SELECT archived_at FROM collection_plans WHERE id=NEW.plan_id) IS NOT NULL
   THEN RAISE(ABORT,'El plan está archivado')
 WHEN NEW.amount_cents + COALESCE((SELECT SUM(amount_cents) FROM collection_receipts WHERE plan_id=NEW.plan_id AND canceled_at IS NULL),0)
     > (SELECT total_cents FROM collection_plans WHERE id=NEW.plan_id)
   THEN RAISE(ABORT,'El cobro excede el importe pendiente')
 END;
END;
INSERT OR IGNORE INTO schema_migrations(version) VALUES ('0006_collections');
