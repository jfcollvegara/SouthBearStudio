-- SouthBear OS · 0007: gastos operativos y pagos asociados
-- Los importes incluyen IVA. El desglose NO determina su deducibilidad fiscal.
CREATE TABLE IF NOT EXISTS expenses (
 id TEXT PRIMARY KEY,
 supplier_name TEXT NOT NULL CHECK(length(supplier_name) BETWEEN 1 AND 180),
 title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
 category TEXT NOT NULL CHECK(category IN ('software','materiales','subcontratacion','equipo','transporte','marketing','alojamiento','otros')),
 project_id TEXT REFERENCES projects(id) ON DELETE RESTRICT,
 expense_date TEXT NOT NULL,
 due_date TEXT NOT NULL DEFAULT '',
 document_ref TEXT NOT NULL DEFAULT '',
 notes TEXT NOT NULL DEFAULT '',
 gross_cents INTEGER NOT NULL CHECK(gross_cents BETWEEN 1 AND 100000000000),
 vat_bps INTEGER NOT NULL CHECK(vat_bps IN (0,400,1000,2100)),
 base_cents INTEGER NOT NULL CHECK(base_cents>=0),
 vat_cents INTEGER NOT NULL CHECK(vat_cents>=0),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 archived_at TEXT DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(archived_at,expense_date DESC);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses(category,archived_at);
CREATE INDEX IF NOT EXISTS expenses_project_idx ON expenses(project_id,archived_at);
CREATE TABLE IF NOT EXISTS expense_payments (
 id TEXT PRIMARY KEY,
 expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE RESTRICT,
 amount_cents INTEGER NOT NULL CHECK(amount_cents BETWEEN 1 AND 100000000000),
 paid_date TEXT NOT NULL,
 method TEXT NOT NULL CHECK(method IN ('transferencia','tarjeta','efectivo','bizum','otro')),
 reference TEXT NOT NULL DEFAULT '',
 notes TEXT NOT NULL DEFAULT '',
 canceled_at TEXT DEFAULT NULL,
 cancel_reason TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS expense_payments_expense_idx ON expense_payments(expense_id,paid_date DESC);
CREATE INDEX IF NOT EXISTS expense_payments_date_idx ON expense_payments(paid_date DESC);
CREATE TRIGGER IF NOT EXISTS expense_no_overpayment BEFORE INSERT ON expense_payments
BEGIN
 SELECT CASE
 WHEN (SELECT archived_at FROM expenses WHERE id=NEW.expense_id) IS NOT NULL THEN RAISE(ABORT,'El gasto está archivado')
 WHEN NEW.amount_cents+COALESCE((SELECT SUM(amount_cents) FROM expense_payments WHERE expense_id=NEW.expense_id AND canceled_at IS NULL),0)>(SELECT gross_cents FROM expenses WHERE id=NEW.expense_id) THEN RAISE(ABORT,'El pago excede el importe pendiente')
 END;
END;
INSERT OR IGNORE INTO schema_migrations(version) VALUES ('0007_expenses');
