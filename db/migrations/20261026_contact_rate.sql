-- Registro anónimo de intentos del formulario: no guarda IP en claro ni mensajes.
CREATE TABLE IF NOT EXISTS sb_contact_rate_limits (
  hour_bucket INTEGER NOT NULL,
  ip_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1 CHECK(attempts >= 0),
  PRIMARY KEY (hour_bucket, ip_hash)
);
