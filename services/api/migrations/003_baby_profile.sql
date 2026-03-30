-- Extend babies table with profile fields
-- SQLite requires table rebuild to add columns with constraints
CREATE TABLE babies_new (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  gender TEXT,            -- 'male' | 'female' | 'other'
  height_cm REAL,
  blood_type TEXT,        -- 'A' | 'B' | 'AB' | 'O' | 'unknown'
  allergies TEXT,
  avatar_url TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

INSERT INTO babies_new (id, family_id, name, birth_date, created_at)
  SELECT id, family_id, name, birth_date, created_at FROM babies;

DROP TABLE babies;
ALTER TABLE babies_new RENAME TO babies;

-- Re-create the events foreign key cascade (events references babies)
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

CREATE INDEX IF NOT EXISTS idx_events_family_time ON events(family_id, event_time);
CREATE INDEX IF NOT EXISTS idx_events_baby_time ON events(baby_id, event_time);
