-- D1 Schema for aws-question database
-- Run: npx wrangler d1 execute aws-question --file=schema.sql

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT DEFAULT '3',
  issue_type TEXT DEFAULT 'decision',
  description TEXT,
  notes TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS question_labels (
  question_id TEXT NOT NULL,
  label TEXT NOT NULL,
  PRIMARY KEY (question_id, label)
);

CREATE INDEX IF NOT EXISTS idx_questions_status_updated ON questions(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_labels_question ON question_labels(question_id);
CREATE INDEX IF NOT EXISTS idx_labels_label ON question_labels(label);
