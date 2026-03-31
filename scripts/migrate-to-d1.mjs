#!/usr/bin/env node
/**
 * Migrate data from DoltHub to Cloudflare D1
 * Usage: node scripts/migrate-to-d1.mjs
 *
 * Requires: npx wrangler d1 execute aws-question --file=schema.sql (run first)
 */

import { writeFileSync } from 'fs';
import { execSync } from 'child_process';

const DOLTHUB_API = 'https://www.dolthub.com/api/v1alpha1/vanhiep99w/aws-learn';
const DB_NAME = 'aws-question';

async function dolthubQuery(sql) {
  const res = await fetch(`${DOLTHUB_API}?q=${encodeURIComponent(sql)}`);
  if (!res.ok) throw new Error(`DoltHub API error: ${res.status}`);
  return res.json();
}

function escape(str) {
  if (str == null) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function main() {
  console.log('Fetching data from DoltHub...');

  const [issuesRes, labelsRes] = await Promise.all([
    dolthubQuery(
      "SELECT id, title, status, priority, issue_type, description, notes, metadata, created_at, updated_at FROM issues ORDER BY updated_at DESC"
    ),
    dolthubQuery('SELECT issue_id, label FROM labels'),
  ]);

  const issues = issuesRes.rows || [];
  const labels = labelsRes.rows || [];

  console.log(`Found ${issues.length} questions, ${labels.length} labels`);

  const sqlLines = [];

  // Insert questions
  for (const row of issues) {
    const meta = typeof row.metadata === 'object'
      ? JSON.stringify(row.metadata)
      : (row.metadata || '{}');

    sqlLines.push(
      `INSERT OR IGNORE INTO questions (id, title, status, priority, issue_type, description, notes, metadata, created_at, updated_at) VALUES (` +
      `${escape(row.id)}, ${escape(row.title)}, ${escape(row.status)}, ${escape(row.priority)}, ` +
      `${escape(row.issue_type)}, ${escape(row.description)}, ${escape(row.notes)}, ` +
      `${escape(meta)}, ${escape(row.created_at)}, ${escape(row.updated_at)});`
    );
  }

  // Insert labels
  for (const row of labels) {
    sqlLines.push(
      `INSERT OR IGNORE INTO question_labels (question_id, label) VALUES (${escape(row.issue_id)}, ${escape(row.label)});`
    );
  }

  const sqlFile = '/tmp/migrate-d1.sql';
  writeFileSync(sqlFile, sqlLines.join('\n') + '\n');
  console.log(`SQL written to ${sqlFile} (${sqlLines.length} statements)`);

  console.log('Applying schema...');
  execSync(`npx wrangler d1 execute ${DB_NAME} --file=schema.sql --remote`, { stdio: 'inherit' });

  console.log('Inserting data...');
  execSync(`npx wrangler d1 execute ${DB_NAME} --file=${sqlFile} --remote`, { stdio: 'inherit' });

  console.log(`\nMigration complete: ${issues.length} questions inserted into D1`);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
