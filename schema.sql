-- D1 Schema for aws-question database
-- Run: npx wrangler d1 execute aws-question --file=schema.sql

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  question_number INTEGER UNIQUE,
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

CREATE TABLE IF NOT EXISTS question_sequence (
  number INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS question_labels (
  question_id TEXT NOT NULL,
  label TEXT NOT NULL,
  PRIMARY KEY (question_id, label)
);

CREATE TABLE IF NOT EXISTS practice_answer_history (
  username TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_json TEXT NOT NULL DEFAULT '[]',
  submitted INTEGER NOT NULL DEFAULT 1,
  is_correct INTEGER NOT NULL DEFAULT 0,
  answered_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (username, question_id)
);

CREATE INDEX IF NOT EXISTS idx_questions_status_updated ON questions(status, updated_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_question_number ON questions(question_number);
CREATE INDEX IF NOT EXISTS idx_question_sequence_question_id ON question_sequence(question_id);
CREATE INDEX IF NOT EXISTS idx_labels_question ON question_labels(question_id);
CREATE INDEX IF NOT EXISTS idx_labels_label ON question_labels(label);
CREATE INDEX IF NOT EXISTS idx_practice_history_username_updated ON practice_answer_history(username, updated_at);
