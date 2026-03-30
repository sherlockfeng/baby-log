-- Add ON DELETE CASCADE to foreign keys (SQLite requires table rebuild)
PRAGMA foreign_keys = OFF;

-- Rebuild babies table with CASCADE on family_id
CREATE TABLE babies_new (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);
INSERT INTO babies_new SELECT * FROM babies;
DROP TABLE babies;
ALTER TABLE babies_new RENAME TO babies;

-- Rebuild events table with CASCADE on both family_id and baby_id
CREATE TABLE events_new (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  baby_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_time TEXT NOT NULL,
  payload TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE
);
INSERT INTO events_new SELECT * FROM events;
DROP TABLE events;
ALTER TABLE events_new RENAME TO events;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_events_family_time ON events(family_id, event_time);
CREATE INDEX IF NOT EXISTS idx_events_baby_time ON events(baby_id, event_time);

PRAGMA foreign_keys = ON;
