-- =============================================
-- 0007_agenda.sql — Agenda / Calendar module
-- =============================================

CREATE TABLE IF NOT EXISTS agenda_events (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT DEFAULT '',
  event_date      TEXT,                          -- YYYY-MM-DD, NULL for pending items
  start_time      TEXT,                          -- HH:MM, NULL for all-day or pending
  end_time        TEXT,                          -- HH:MM, NULL for open-ended
  all_day         INTEGER DEFAULT 0,             -- 1 = all day event
  category        TEXT DEFAULT 'Pendiente por coordinar',
  status          TEXT DEFAULT 'Pendiente',      -- Pendiente, Confirmado, Reprogramar, Realizado, Suspendido
  priority        TEXT DEFAULT 'Media',          -- Alta, Media, Baja
  responsible     TEXT,
  location_mode   TEXT,                          -- presencial, virtual, mixto
  location_text   TEXT,                          -- free text: address, zoom link, room name
  related_project_id TEXT,                       -- FK to projects.id (optional)
  recurrence_rule TEXT,                          -- JSON: {"freq":"weekly","interval":1,"weekday":"TU","until":"2026-12-31"}
  notes           TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  completed_at    TEXT,
  archived_at     TEXT,
  deleted_at      TEXT
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_agenda_event_date    ON agenda_events(event_date);
CREATE INDEX IF NOT EXISTS idx_agenda_deleted        ON agenda_events(deleted_at);
CREATE INDEX IF NOT EXISTS idx_agenda_status          ON agenda_events(status);
CREATE INDEX IF NOT EXISTS idx_agenda_category        ON agenda_events(category);
CREATE INDEX IF NOT EXISTS idx_agenda_project         ON agenda_events(related_project_id);
CREATE INDEX IF NOT EXISTS idx_agenda_date_deleted    ON agenda_events(event_date, deleted_at);
