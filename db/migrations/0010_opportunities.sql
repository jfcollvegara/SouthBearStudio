-- SouthBear OS · Embudo comercial de oportunidades
-- Las oportunidades no son facturación, contratos ni ingresos confirmados.
CREATE TABLE IF NOT EXISTS sales_opportunities (
 id TEXT PRIMARY KEY NOT NULL,
 title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
 contact_name TEXT NOT NULL CHECK(length(contact_name) BETWEEN 1 AND 160),
 company_name TEXT NOT NULL DEFAULT '',
 email TEXT NOT NULL DEFAULT '',
 phone TEXT NOT NULL DEFAULT '',
 client_id TEXT REFERENCES clients(id) ON DELETE RESTRICT,
 quote_id TEXT UNIQUE REFERENCES quotes(id) ON DELETE RESTRICT,
 category TEXT NOT NULL DEFAULT 'otro' CHECK(category IN ('diseno','web','audiovisual','otro')),
 source TEXT NOT NULL DEFAULT 'otro' CHECK(source IN ('web','referido','redes','email','telefono','presencial','otro')),
 stage TEXT NOT NULL DEFAULT 'nuevo' CHECK(stage IN ('nuevo','contactado','propuesta','negociacion','ganado','perdido')),
 probability INTEGER NOT NULL DEFAULT 10 CHECK(probability BETWEEN 0 AND 100),
 estimated_gross_cents INTEGER NOT NULL DEFAULT 0 CHECK(estimated_gross_cents BETWEEN 0 AND 100000000000),
 next_contact_date TEXT NOT NULL DEFAULT '',
 description TEXT NOT NULL DEFAULT '',
 notes TEXT NOT NULL DEFAULT '',
 loss_reason TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 archived_at TEXT DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS opportunities_stage_idx ON sales_opportunities(archived_at,stage,updated_at DESC);
CREATE INDEX IF NOT EXISTS opportunities_client_idx ON sales_opportunities(client_id,archived_at);
CREATE INDEX IF NOT EXISTS opportunities_next_contact_idx ON sales_opportunities(archived_at,next_contact_date);
CREATE INDEX IF NOT EXISTS opportunities_created_idx ON sales_opportunities(archived_at,created_at DESC);
INSERT OR IGNORE INTO schema_migrations(version) VALUES ('0010_opportunities');
