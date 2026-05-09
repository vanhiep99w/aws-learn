const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `aws-learn-${id}`;
}

function nowISO() {
  return new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);

  // GET /api/questions — list questions + labels
  if (request.method === 'GET') {
    const id = url.searchParams.get('id');
    if (id) {
      const [questionResult, labelsResult] = await Promise.all([
        env.DB.prepare(
          `SELECT id, title, status, priority, issue_type, description, notes, metadata, created_at, updated_at
           FROM questions
           WHERE id = ?
           LIMIT 1`
        ).bind(id).first(),
        env.DB.prepare(
          'SELECT label FROM question_labels WHERE question_id = ? ORDER BY label ASC'
        ).bind(id).all(),
      ]);

      if (!questionResult) return json({ error: 'Question not found' }, 404);

      return json({
        row: questionResult,
        labels: labelsResult.results.map(({ label }) => label),
      });
    }

    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sort = url.searchParams.get('sort');
    const listMode = url.searchParams.get('mode') === 'list';
    const includeLabels = url.searchParams.get('labels') !== '0';
    const includeCount = url.searchParams.get('count') === '1';
    const orderBy = sort === 'created-asc'
      ? 'created_at ASC, id ASC'
      : sort === 'created-desc'
        ? 'created_at DESC, id DESC'
        : 'updated_at DESC';
    const columns = listMode
      ? 'id, title, status, priority, issue_type, metadata, created_at, updated_at'
      : 'id, title, status, priority, issue_type, description, notes, metadata, created_at, updated_at';

    const questionsResult = await env.DB.prepare(
      `SELECT ${columns}
       FROM questions
       WHERE status = 'open'
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    const questionIds = questionsResult.results.map(({ id }) => id);
    let labels = [];
    if (includeLabels && questionIds.length > 0) {
      const placeholders = questionIds.map(() => '?').join(',');
      const labelsResult = await env.DB.prepare(
        `SELECT question_id AS issue_id, label
         FROM question_labels
         WHERE question_id IN (${placeholders})
         ORDER BY question_id ASC, label ASC`
      ).bind(...questionIds).all();
      labels = labelsResult.results;
    }

    let total;
    if (includeCount) {
      const countResult = await env.DB.prepare(
        `SELECT COUNT(*) AS total FROM questions WHERE status = 'open'`
      ).first();
      total = countResult.total;
    }

    return json({
      rows: questionsResult.results,
      labels,
      total,
      hasMore: questionsResult.results.length === limit,
    });
  }

  // POST /api/questions — create new question
  if (request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const { title, description, notes, metadata, labels } = body;
    if (!title) return json({ error: 'title is required' }, 400);

    const id = generateId();
    const now = nowISO();
    const metadataStr = typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {});

    await env.DB.prepare(
      `INSERT INTO questions (id, title, status, priority, issue_type, description, notes, metadata, created_at, updated_at)
       VALUES (?, ?, 'open', '3', 'decision', ?, ?, ?, ?, ?)`
    ).bind(id, title, description || '', notes || '', metadataStr, now, now).run();

    if (Array.isArray(labels) && labels.length > 0) {
      const stmt = env.DB.prepare(
        'INSERT OR IGNORE INTO question_labels (question_id, label) VALUES (?, ?)'
      );
      await env.DB.batch(labels.map(label => stmt.bind(id, label)));
    }

    return json({ id, success: true }, 201);
  }

  // PATCH /api/questions?id=... — update existing question
  if (request.method === 'PATCH') {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'id is required' }, 400);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const existing = await env.DB.prepare(
      `SELECT id, title, status, priority, issue_type, description, notes, metadata
       FROM questions
       WHERE id = ?
       LIMIT 1`
    ).bind(id).first();

    if (!existing) return json({ error: 'Question not found' }, 404);

    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(body, key);
    const next = {
      title: hasOwn('title') ? body.title : existing.title,
      status: hasOwn('status') ? body.status : existing.status,
      priority: hasOwn('priority') ? body.priority : existing.priority,
      issue_type: hasOwn('issue_type') ? body.issue_type : existing.issue_type,
      description: hasOwn('description') ? body.description : existing.description,
      notes: hasOwn('notes') ? body.notes : existing.notes,
      metadata: hasOwn('metadata')
        ? (typeof body.metadata === 'string' ? body.metadata : JSON.stringify(body.metadata || {}))
        : existing.metadata,
    };

    if (!next.title) return json({ error: 'title is required' }, 400);

    const now = nowISO();
    await env.DB.prepare(
      `UPDATE questions
       SET title = ?, status = ?, priority = ?, issue_type = ?, description = ?, notes = ?, metadata = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      next.title,
      next.status,
      next.priority,
      next.issue_type,
      next.description || '',
      next.notes || '',
      next.metadata,
      now,
      id
    ).run();

    if (hasOwn('labels')) {
      if (!Array.isArray(body.labels)) {
        return json({ error: 'labels must be an array' }, 400);
      }

      await env.DB.prepare(
        'DELETE FROM question_labels WHERE question_id = ?'
      ).bind(id).run();

      if (body.labels.length > 0) {
        const stmt = env.DB.prepare(
          'INSERT OR IGNORE INTO question_labels (question_id, label) VALUES (?, ?)'
        );
        await env.DB.batch(body.labels.map(label => stmt.bind(id, label)));
      }
    }

    return json({ id, success: true, updated_at: now });
  }

  return json({ error: 'Method not allowed' }, 405);
}
