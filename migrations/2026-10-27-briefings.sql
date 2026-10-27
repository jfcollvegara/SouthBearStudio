-- SouthBear Studio / Briefings creativos
-- Migración aditiva aplicada a D1 (southbear-studio-os, jurisdicción UE) el 27-10-2026.
-- Mantener este archivo para reconstrucción y auditoría futura.
CREATE TABLE IF NOT EXISTS sb_briefing_forms (
 id TEXT PRIMARY KEY NOT NULL,
 token TEXT NOT NULL UNIQUE,
 company_name TEXT NOT NULL,
 service_slug TEXT NOT NULL,
 title TEXT NOT NULL,
 question_ids TEXT NOT NULL,
 answers_json TEXT,
 status TEXT NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente','recibido','cerrado','revocado')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 submitted_at TEXT,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 closed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sb_briefings_status_date
 ON sb_briefing_forms(status,created_at DESC);
