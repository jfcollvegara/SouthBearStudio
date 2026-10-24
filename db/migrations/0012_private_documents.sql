-- SouthBear OS | Archivo documental privado - solo metadatos.
-- Los archivos binarios se almacenan exclusivamente en R2 privado.
CREATE TABLE IF NOT EXISTS studio_documents (
 id TEXT PRIMARY KEY NOT NULL,
 title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
 category TEXT NOT NULL CHECK(category IN ('contrato','entregable','justificante','autorizacion','otro')),
 original_name TEXT NOT NULL CHECK(length(original_name) BETWEEN 1 AND 180),
 mime_type TEXT NOT NULL,
 size_bytes INTEGER NOT NULL CHECK(size_bytes BETWEEN 1 AND 10485760),
 checksum_sha256 TEXT NOT NULL CHECK(length(checksum_sha256)=64),
 object_key TEXT NOT NULL UNIQUE,
 client_id TEXT REFERENCES clients(id) ON DELETE RESTRICT,
 project_id TEXT REFERENCES projects(id) ON DELETE RESTRICT,
 quote_id TEXT REFERENCES quotes(id) ON DELETE RESTRICT,
 expense_id TEXT REFERENCES expenses(id) ON DELETE RESTRICT,
 notes TEXT NOT NULL DEFAULT '',
 uploaded_by TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 archived_at TEXT DEFAULT NULL,
 CHECK((client_id IS NOT NULL)+(project_id IS NOT NULL)+(quote_id IS NOT NULL)+(expense_id IS NOT NULL)<=1)
);
CREATE INDEX IF NOT EXISTS studio_documents_created_idx ON studio_documents(archived_at,created_at DESC);
CREATE INDEX IF NOT EXISTS studio_documents_category_idx ON studio_documents(archived_at,category);
CREATE INDEX IF NOT EXISTS studio_documents_client_idx ON studio_documents(client_id);
CREATE INDEX IF NOT EXISTS studio_documents_project_idx ON studio_documents(project_id);
CREATE INDEX IF NOT EXISTS studio_documents_quote_idx ON studio_documents(quote_id);
CREATE INDEX IF NOT EXISTS studio_documents_expense_idx ON studio_documents(expense_id);
INSERT OR IGNORE INTO schema_migrations(version) VALUES('0012_private_documents');
