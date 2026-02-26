-- BabyLog D1 schema
-- families: one per family, token for auth
CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  name TEXT,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- babies: belong to a family
CREATE TABLE IF NOT EXISTS babies (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id)
);

-- events: timeline entries per baby
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  baby_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_time TEXT NOT NULL,
  payload TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (family_id) REFERENCES families(id),
  FOREIGN KEY (baby_id) REFERENCES babies(id)
);

CREATE INDEX IF NOT EXISTS idx_events_family_time ON events(family_id, event_time);
CREATE INDEX IF NOT EXISTS idx_events_baby_time ON events(baby_id, event_time);
CREATE INDEX IF NOT EXISTS idx_families_token_hash ON families(token_hash);
