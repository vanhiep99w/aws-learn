const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function nowISO() {
  return new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
}

function normalizeUsername(value) {
  return String(value || '').trim().slice(0, 80);
}

async function ensureTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS practice_answer_history (
      username TEXT NOT NULL,
      question_id TEXT NOT NULL,
      selected_json TEXT NOT NULL DEFAULT '[]',
      submitted INTEGER NOT NULL DEFAULT 1,
      is_correct INTEGER NOT NULL DEFAULT 0,
      answered_at TEXT,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (username, question_id)
    )`
  ).run();
  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_practice_history_username_updated
     ON practice_answer_history(username, updated_at)`
  ).run();

  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS practice_question_notes (
      username TEXT NOT NULL,
      question_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (username, question_id)
    )`
  ).run();
  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_practice_notes_username_updated
     ON practice_question_notes(username, updated_at)`
  ).run();
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  await ensureTable(env);
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const username = normalizeUsername(url.searchParams.get('username'));
    if (!username) return json({ error: 'username is required' }, 400);

    const result = await env.DB.prepare(
      `SELECT
         COALESCE(h.username, n.username) AS username,
         COALESCE(h.question_id, n.question_id) AS question_id,
         h.selected_json,
         h.submitted,
         h.is_correct,
         h.answered_at,
         h.updated_at,
         n.updated_at AS note_updated_at,
         CASE WHEN n.question_id IS NULL THEN 0 ELSE 1 END AS noted,
         COALESCE(h.updated_at, n.updated_at) AS sort_at
       FROM practice_answer_history h
       LEFT JOIN practice_question_notes n
         ON n.username = h.username AND n.question_id = h.question_id
       WHERE h.username = ?
       UNION ALL
       SELECT
         n.username,
         n.question_id,
         '[]' AS selected_json,
         0 AS submitted,
         0 AS is_correct,
         NULL AS answered_at,
         NULL AS updated_at,
         n.updated_at AS note_updated_at,
         1 AS noted,
         n.updated_at AS sort_at
       FROM practice_question_notes n
       LEFT JOIN practice_answer_history h
         ON h.username = n.username AND h.question_id = n.question_id
       WHERE n.username = ? AND h.question_id IS NULL
       ORDER BY sort_at DESC`
    ).bind(username, username).all();

    return json({
      username,
      rows: result.results.map(row => ({
        question_id: row.question_id,
        selected: JSON.parse(row.selected_json || '[]'),
        submitted: !!row.submitted,
        isCorrect: !!row.is_correct,
        answeredAt: row.answered_at,
        updatedAt: row.updated_at,
        noted: !!row.noted,
        noteUpdatedAt: row.note_updated_at,
      })),
    });
  }

  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }

    const username = normalizeUsername(body.username);
    const questionId = String(body.question_id || '').trim();
    if (!username) return json({ error: 'username is required' }, 400);
    if (!questionId) return json({ error: 'question_id is required' }, 400);

    const now = nowISO();

    if (Object.prototype.hasOwnProperty.call(body, 'noted')) {
      if (body.noted === true) {
        await env.DB.prepare(
          `INSERT INTO practice_question_notes (username, question_id, created_at, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(username, question_id) DO UPDATE SET updated_at = excluded.updated_at`
        ).bind(username, questionId, now, now).run();
      } else {
        await env.DB.prepare(
          `DELETE FROM practice_question_notes WHERE username = ? AND question_id = ?`
        ).bind(username, questionId).run();
      }
      return json({ success: true, username, question_id: questionId, noted: body.noted === true, updated_at: now });
    }

    const selected = Array.isArray(body.selected) ? body.selected.map(String) : [];
    const submitted = body.submitted === false ? 0 : 1;
    const isCorrect = body.isCorrect === true ? 1 : 0;
    const answeredAt = body.answeredAt || (submitted ? now : null);
    await env.DB.prepare(
      `INSERT INTO practice_answer_history (username, question_id, selected_json, submitted, is_correct, answered_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(username, question_id) DO UPDATE SET
         selected_json = excluded.selected_json,
         submitted = excluded.submitted,
         is_correct = excluded.is_correct,
         answered_at = excluded.answered_at,
         updated_at = excluded.updated_at`
    ).bind(username, questionId, JSON.stringify(selected), submitted, isCorrect, answeredAt, now).run();

    return json({ success: true, username, question_id: questionId, updated_at: now });
  }

  if (request.method === 'DELETE') {
    const username = normalizeUsername(url.searchParams.get('username'));
    const questionId = String(url.searchParams.get('question_id') || '').trim();
    const scope = String(url.searchParams.get('scope') || 'history').trim();
    if (!username) return json({ error: 'username is required' }, 400);

    if (questionId) {
      await env.DB.prepare(
        `DELETE FROM practice_answer_history WHERE username = ? AND question_id = ?`
      ).bind(username, questionId).run();
      return json({ success: true, username, question_id: questionId, scope: 'history' });
    }

    if (scope === 'notes') {
      await env.DB.prepare(
        `DELETE FROM practice_question_notes WHERE username = ?`
      ).bind(username).run();
      return json({ success: true, username, scope });
    }

    if (scope === 'all') {
      await env.DB.prepare(
        `DELETE FROM practice_answer_history WHERE username = ?`
      ).bind(username).run();
      await env.DB.prepare(
        `DELETE FROM practice_question_notes WHERE username = ?`
      ).bind(username).run();
      return json({ success: true, username, scope });
    }

    await env.DB.prepare(
      `DELETE FROM practice_answer_history WHERE username = ?`
    ).bind(username).run();
    return json({ success: true, username, scope: 'history' });
  }

  return json({ error: 'Method not allowed' }, 405);
}
