-- SouthBear OS · 0008: directorio privado de proveedores
-- Los gastos anteriores quedan sin vincular. No se deducen equivalencias por nombre.
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 180),
  legal_name TEXT NOT NULL DEFAULT '',
  tax_id TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'España',
  service_category TEXT NOT NULL DEFAULT 'otros' CHECK(service_category IN ('impresion','software','audiovisual','web','diseno','logistica','materiales','otros')),
  payment_terms TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  archived_at TEXT DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS suppliers_active_idx ON suppliers(archived_at,display_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS suppliers_updated_idx ON suppliers(updated_at DESC);
ALTER TABLE expenses ADD COLUMN supplier_id TEXT REFERENCES suppliers(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS expenses_supplier_idx ON expenses(supplier_id,archived_at);
INSERT OR IGNORE INTO schema_migrations(version) VALUES('0008_suppliers');
