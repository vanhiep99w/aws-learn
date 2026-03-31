const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const [questionsResult, labelsResult] = await Promise.all([
      env.DB.prepare(
        `SELECT id, title, status, priority, issue_type, description, notes, metadata, created_at, updated_at
         FROM questions
         WHERE status = 'open'
         ORDER BY updated_at DESC
         LIMIT ? OFFSET ?`
      ).bind(limit, offset).all(),
      env.DB.prepare(
        'SELECT question_id AS issue_id, label FROM question_labels'
      ).all(),
    ]);

    return json({
      rows: questionsResult.results,
      labels: labelsResult.results,
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

  return json({ error: 'Method not allowed' }, 405);
}
