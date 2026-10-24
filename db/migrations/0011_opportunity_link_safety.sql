-- La vinculación comercial de un presupuesto es única e irreversible por API.
CREATE TRIGGER IF NOT EXISTS opportunity_quote_once
BEFORE UPDATE OF quote_id ON sales_opportunities
WHEN OLD.quote_id IS NOT NULL AND NEW.quote_id IS NOT OLD.quote_id
BEGIN SELECT RAISE(ABORT,'La oportunidad ya tiene presupuesto'); END;
CREATE TRIGGER IF NOT EXISTS opportunity_quote_client_consistency
BEFORE UPDATE OF quote_id ON sales_opportunities
WHEN NEW.quote_id IS NOT NULL AND
  ((SELECT client_id FROM quotes WHERE id=NEW.quote_id) IS NOT NEW.client_id)
BEGIN SELECT RAISE(ABORT,'El presupuesto debe pertenecer al cliente de la oportunidad'); END;
CREATE TRIGGER IF NOT EXISTS opportunity_client_after_quote
BEFORE UPDATE OF client_id ON sales_opportunities
WHEN OLD.quote_id IS NOT NULL AND NEW.client_id IS NOT OLD.client_id
BEGIN SELECT RAISE(ABORT,'No puede cambiarse el cliente de un presupuesto vinculado'); END;
INSERT OR IGNORE INTO schema_migrations(version) VALUES('0011_opportunity_link_safety');
