const crypto = require('crypto');
const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Bad JSON' }) };
  }

  const { id, first_name, username, photo_url, auth_date, hash } = body;

  /* 1 — verify Telegram auth hash */
  const botToken = process.env.BOT_TOKEN; // set in Netlify env vars
  if (!botToken) {
    return { statusCode: 500, body: JSON.stringify({ error: 'BOT_TOKEN not set' }) };
  }

  const fields = { id, first_name, username, photo_url, auth_date };
  const checkString = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const expected  = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  if (expected !== hash) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid hash' }) };
  }

  /* 2 — check loyalty DB */
  const dbUrl = process.env.DATABASE_URL; // set in Netlify env vars (Neon connection string)
  if (!dbUrl) {
    return { statusCode: 500, body: JSON.stringify({ error: 'DATABASE_URL not set' }) };
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    /* Adjust table/column names to match the BrewsLee bot's schema */
    const result = await client.query(
      'SELECT belt_level, visit_count FROM users WHERE telegram_id = $1 LIMIT 1',
      [String(id)]
    );
    const is_member = result.rows.length > 0;
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_member, member: is_member ? result.rows[0] : null })
    };
  } catch (err) {
    console.error('DB error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'DB error' }) };
  } finally {
    await client.end().catch(() => {});
  }
};
