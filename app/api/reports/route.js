import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since') ?? '24h';
  const map = {
    '24h': "interval '24 hours'",
    '3d': "interval '3 days'",
    '7d': "interval '7 days'",
    '30d': "interval '30 days'",
  };
  const interval = map[since] ?? map['24h'];

  const { rows } = await pool.query(`
    select
      hash as id, title, platform, severity, program, bounty, currency,
      published_at as "publishedAt", url, weakness
    from reports
    where severity = 'critical' and published_at >= now() - ${interval}
    order by published_at desc
    limit 200
  `);

  return NextResponse.json(rows);
}
