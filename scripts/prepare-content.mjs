#!/usr/bin/env node

/**
 * Prepare AWS Learning markdown files for Astro Starlight.
 *
 * 1. Parse README.md → extract file-to-category/title/description/order mapping
 * 2. For each .md file: add YAML frontmatter, strip manual TOC, rewrite cross-doc links
 * 3. Copy files into src/content/docs/{category}/
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

// ── Category mapping ───────────────────────────────────────────────────────────
const SECTION_TO_DIR = {
  'Fundamentals': 'fundamentals',
  'Compute': 'compute',
  'Storage': 'storage',
  'Database': 'database',
  'Migration': 'migration',
  'Data Integration': 'data-integration',
  'Analytics': 'analytics',
  'Networking': 'networking',
  'Account Management': 'account-management',
  'Security': 'security',
  'Partner & Marketplace': 'partner-marketplace',
  'Monitoring & Management': 'monitoring-management',
  'Developer Tools': 'developer-tools',
  'Infrastructure as Code': 'iac',
  'Messaging & Streaming': 'messaging-streaming',
  'Global Applications Architecture': 'global-architecture',
  'Cost Management': 'cost-management',
  'Support': 'support',
  'AI/ML Services': 'ai-ml',
  'End User Computing': 'end-user-computing',
  'Application Integration': 'application-integration',
};

// ── Step 1: Parse README.md ────────────────────────────────────────────────────

const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
const lines = readme.split('\n');

/** @type {Map<string, {category: string, dir: string, title: string, description: string, order: number}>} */
const fileMap = new Map();

let currentSection = null;
let orderInSection = 0;

for (const line of lines) {
  // Detect section headers: ## Fundamentals, ## Compute, etc.
  const sectionMatch = line.match(/^## (.+)$/);
  if (sectionMatch) {
    const sectionName = sectionMatch[1].trim();
    if (SECTION_TO_DIR[sectionName]) {
      currentSection = sectionName;
      orderInSection = 0;
    } else {
      currentSection = null;
    }
    continue;
  }

  if (!currentSection) continue;

  // Detect file entries: - [x] [Title](filename.md) - Description
  const entryMatch = line.match(/^- \[x\] \[(.+?)\]\((.+?\.md)\)\s*-\s*(.+)$/);
  if (entryMatch) {
    orderInSection++;
    const [, readmeTitle, filename, description] = entryMatch;
    fileMap.set(filename, {
      category: currentSection,
      dir: SECTION_TO_DIR[currentSection],
      title: readmeTitle,
      description: description.trim(),
      order: orderInSection,
    });
  }
}

console.log(`Parsed ${fileMap.size} files from README.md`);

// ── Build lookup: filename.md → /category-dir/slug/ ──────────────────────────

/** @type {Map<string, string>} */
const linkMap = new Map();
for (const [filename, meta] of fileMap) {
  const slug = basename(filename, '.md');
  linkMap.set(filename, `/${meta.dir}/${slug}/`);
}

// ── Step 2–3: Process each file ────────────────────────────────────────────────

const docsBase = join(ROOT, 'src', 'content', 'docs');

for (const [filename, meta] of fileMap) {
  const srcPath = join(ROOT, filename);
  if (!existsSync(srcPath)) {
    console.warn(`  SKIP (not found): ${filename}`);
    continue;
  }

  let content = readFileSync(srcPath, 'utf8');

  // 2a. Extract title from first # heading
  const titleMatch = content.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : meta.title;

  // 2b. Remove manual TOC section: from "## Mục lục" to next "---"
  content = content.replace(
    /\n## Mục lục\n[\s\S]*?\n---\n/,
    '\n'
  );

  // 2c. Rewrite cross-document links: [text](./filename.md) or [text](filename.md)
  content = content.replace(
    /\[([^\]]+)\]\(\.?\/?([a-z][a-z0-9\-]*\.md)\)/g,
    (match, text, linkedFile) => {
      const target = linkMap.get(linkedFile);
      if (target) {
        return `[${text}](${target})`;
      }
      return match; // leave unchanged if not in our map
    }
  );

  // 2d. Build frontmatter
  const frontmatter = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `description: "${meta.description.replace(/"/g, '\\"')}"`,
    'sidebar:',
    `  order: ${meta.order}`,
    '---',
  ].join('\n');

  // 2e. Remove existing title line (first # heading) since frontmatter provides it
  content = content.replace(/^# .+\n+/, '');

  // 2f. Combine
  const finalContent = frontmatter + '\n\n' + content.trimStart();

  // 2g. Write to target directory
  const targetDir = join(docsBase, meta.dir);
  mkdirSync(targetDir, { recursive: true });
  const targetPath = join(targetDir, filename.replace(/.*\//, ''));
  writeFileSync(targetPath, finalContent, 'utf8');
  console.log(`  ✓ ${filename} → ${meta.dir}/`);
}

console.log(`\nDone! Files written to src/content/docs/`);
