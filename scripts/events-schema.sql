-- Schema for the /layoff/ cluster's anonymous event log.
-- Apply with:
--   npx wrangler d1 execute auaha-events --remote --file=scripts/events-schema.sql
--
-- No cookies, no cross-session identifier, and none of what anyone wrote.
-- `session` is a random id that lives in sessionStorage and dies with the tab —
-- it exists so a single visit isn't counted as five people.

CREATE TABLE IF NOT EXISTS events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  event        TEXT NOT NULL,
  session      TEXT,
  path         TEXT,
  referrer     TEXT,
  words        INTEGER,
  seconds      INTEGER,
  rating       INTEGER,
  values_count INTEGER,
  country      TEXT,
  created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_event   ON events (event);
CREATE INDEX IF NOT EXISTS idx_events_created ON events (created_at);
CREATE INDEX IF NOT EXISTS idx_events_session ON events (session);

-- Addresses given voluntarily at the end of the exercise, for a single
-- two-week check-in. UNIQUE so a double tap doesn't duplicate.
CREATE TABLE IF NOT EXISTS checkins (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
