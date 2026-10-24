-- SouthBear OS / 0003: el precio introducido por el usuario incluye IVA
-- Conservar unit_cents como precio neto histórico y de compatibilidad.
-- NULL en unit_gross_cents identifica presupuestos anteriores a este cambio;
-- NO recalcular sus importes, especialmente si están aceptados.
ALTER TABLE quote_lines ADD COLUMN unit_gross_cents INTEGER CHECK (unit_gross_cents IS NULL OR unit_gross_cents BETWEEN 0 AND 1000000000);
INSERT OR IGNORE INTO schema_migrations(version) VALUES ('0003_quote_gross_unit_price');
