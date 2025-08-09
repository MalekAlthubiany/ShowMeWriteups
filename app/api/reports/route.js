// app/api/reports/route.js
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const q = (searchParams.get('q') || '').trim();
  const severity = (searchParams.get('severity') || '').trim(); // critical/high/...
  const platform = (searchParams.get('platform') || '').trim(); // HackerOne/...
  const since = (searchParams.get('since') || '24h').trim();
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '40', 10), 1), 200);

  const intervals = { '24h': "interval '24 hours'", '3d': "interval '3 days'", '7d': "interval '7 days'", '30d': "interval '30 days'", '90d': "interval '90 days'" };
  const interval = intervals[since] || intervals['24h'];

  const filters = [`published_at >= now() - ${interval}`];
  const values = [];
  if (severity) { values.push(severity); filters.push(`severity = $${values.length}`); }
  if (platform) { values.push(platform); filters.push(`platform = $${values.length}`); }
  if (q) {
    values.push(`%${q.toLowerCase()}%`);
    filters.push(`(lower(title) like $${values.length} or lower(coalesce(program,'')) like $${values.length} or lower(coalesce(weakness,'')) like $${values.length})`);
  }

  const where = filters.length ? `where ${filters.join(' and ')}` : '';
  const offset = (page - 1) * pageSize;

  const sql = `
    select hash as id, title, platform, severity, program, bounty, currency,
           published_at as "publishedAt", url, weakness
    from reports
    ${where}
    order by published_at desc
    limit ${pageSize} offset ${offset};
  `;
  const { rows } = await pool.query(sql, values);

  const countSql = `select count(*)::int as c from reports ${where};`;
  const { rows: [cnt] } = await pool.query(countSql, values);

  const res = NextResponse.json({ page, pageSize, total: cnt.c, items: rows });
  res.headers.set('Access-Control-Allow-Origin', '*');
  return res;
}
