-- Migration: change settlements.status from pending/confirmed/transferred to active/closed
-- Also add paid_amount column to settlement_items

-- Step 1: Migrate settlements table (SQLite requires table recreation for CHECK constraint changes)
CREATE TABLE IF NOT EXISTS settlements_new (
  id INTEGER PRIMARY KEY,
  house_id INTEGER NOT NULL REFERENCES houses(id),
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'closed')),
  creator_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO settlements_new (id, house_id, title, start_date, end_date, status, creator_id, created_at, updated_at)
  SELECT id, house_id, title, start_date, end_date,
    CASE WHEN status IN ('confirmed', 'transferred') THEN 'closed' ELSE 'active' END,
    creator_id, created_at, updated_at
  FROM settlements;

DROP TABLE settlements;
ALTER TABLE settlements_new RENAME TO settlements;
CREATE INDEX IF NOT EXISTS idx_settlements_house ON settlements(house_id);

-- Step 2: Add paid_amount column to settlement_items
ALTER TABLE settlement_items ADD COLUMN paid_amount INTEGER NOT NULL DEFAULT 0;
UPDATE settlement_items SET paid_amount = final_amount WHERE status = 'transferred';
