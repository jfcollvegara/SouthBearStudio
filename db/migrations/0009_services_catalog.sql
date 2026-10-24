-- SouthBear OS · 0009: catálogo privado de servicios y tarifas
-- Tarifa orientativa sugerida con IVA incluido. Al añadir a un presupuesto
-- se copian los valores: modificar el catálogo jamás cambia presupuestos.
CREATE TABLE IF NOT EXISTS studio_services (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 240),
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK(category IN ('diseno','web','audiovisual','otro')),
  service_kind TEXT NOT NULL CHECK(service_kind IN ('servicio','paquete','extra')),
  unit_label TEXT NOT NULL DEFAULT 'unidad',
  unit_gross_cents INTEGER NOT NULL DEFAULT 0 CHECK(unit_gross_cents BETWEEN 0 AND 1000000000),
  vat_bps INTEGER NOT NULL DEFAULT 2100 CHECK(vat_bps IN (0,400,1000,2100)),
  internal_notes TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  archived_at TEXT DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS studio_services_category_idx ON studio_services(archived_at,category,service_kind);
CREATE INDEX IF NOT EXISTS studio_services_name_idx ON studio_services(archived_at,name COLLATE NOCASE);
CREATE TABLE IF NOT EXISTS studio_service_price_history (
  id TEXT PRIMARY KEY NOT NULL,
  service_id TEXT NOT NULL REFERENCES studio_services(id) ON DELETE RESTRICT,
  gross_cents INTEGER NOT NULL CHECK(gross_cents BETWEEN 0 AND 1000000000),
  vat_bps INTEGER NOT NULL CHECK(vat_bps IN (0,400,1000,2100)),
  actor_email TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS studio_service_price_history_idx ON studio_service_price_history(service_id,changed_at DESC);
INSERT OR IGNORE INTO schema_migrations(version) VALUES('0009_services_catalog');
