#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const DB_NAME = process.env.D1_DATABASE || 'aws-question';
const remote = process.argv.includes('--remote');
const local = process.argv.includes('--local');
const scopeArgs = remote ? ['--remote'] : local ? ['--local'] : ['--remote'];

function runSql(command) {
  const args = ['wrangler', 'd1', 'execute', DB_NAME, ...scopeArgs, '--command', command];
  console.log(`\n$ npx ${args.join(' ')}`);
  execFileSync('npx', args, { stdio: 'inherit' });
}

function tryRunSql(command) {
  try {
    runSql(command);
  } catch (err) {
    return false;
  }
  return true;
}

console.log(`Migrating question numbers on D1 database: ${DB_NAME} (${scopeArgs.join(' ')})`);

// Older D1/SQLite versions may not support ADD COLUMN IF NOT EXISTS, so this
// command is intentionally allowed to fail when the column already exists.
tryRunSql('ALTER TABLE questions ADD COLUMN question_number INTEGER;');

runSql(`CREATE TABLE IF NOT EXISTS question_sequence (
  number INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id TEXT NOT NULL UNIQUE
);`);

runSql(`INSERT INTO question_sequence (question_id)
SELECT q.id
FROM questions q
LEFT JOIN question_sequence s ON s.question_id = q.id
WHERE s.question_id IS NULL
ORDER BY q.created_at ASC, q.id ASC;`);

runSql(`UPDATE questions
SET question_number = (
  SELECT number
  FROM question_sequence
  WHERE question_sequence.question_id = questions.id
)
WHERE question_number IS NULL;`);

runSql('CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_question_number ON questions(question_number);');
runSql('CREATE INDEX IF NOT EXISTS idx_question_sequence_question_id ON question_sequence(question_id);');

runSql(`SELECT COUNT(*) AS total,
  COUNT(question_number) AS numbered,
  MIN(question_number) AS min_number,
  MAX(question_number) AS max_number
FROM questions;`);

console.log('\nDone.');
