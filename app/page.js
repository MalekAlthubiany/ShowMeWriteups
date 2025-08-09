'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

const ranges = [
  { v: '24h', en: 'Last 24h', ar: 'آخر ٢٤ ساعة' },
  { v: '3d',  en: 'Last 3 days', ar: 'آخر ٣ أيام' },
  { v: '7d',  en: 'Last 7 days', ar: 'آخر ٧ أيام' },
  { v: '30d', en: 'Last 30 days', ar: 'آخر ٣٠ يوماً' },
  { v: '90d', en: 'Last 90 days', ar: 'آخر ٩٠ يوماً' },
];

export default function Page() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('critical');
  const [platform, setPlatform] = useState('');
  const [since, setSince] = useState('24h');
  const [lang, setLang] = useState('en');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const isArabic = lang === 'ar';
  const perPage = 40;
  const typing = useRef();

  const t = useMemo(
    () =>
      isArabic
        ? {
            title: 'BugDaily',
            subtitle: 'تقارير علنية يومية لثغرات حرجة في برامج المكافآت',
            search: 'ابحث...',
            severity: 'الشدة',
            all: 'الكل',
            platform: 'المنصة',
            refresh: 'تحديث',
            view: 'عرض',
            live: 'تحديث تلقائي',
            loadMore: 'تحميل المزيد',
            no: 'لا توجد نتائج',
          }
        : {
            title: 'BugDaily',
            subtitle: 'Daily public write-ups of critical bounty reports',
            search: 'Search…',
            severity: 'Severity',
            all: 'All',
            platform: 'Platform',
            refresh: 'Refresh',
            view: 'View',
            live: 'Live auto-update',
            loadMore: 'Load more',
            no: 'No results',
          },
    [isArabic]
  );

  function qs(p) {
    const esc = encodeURIComponent;
    return Object.entries(p)
      .filter(([, v]) => v !== '' && v != null)
      .map(([k, v]) => `${esc(k)}=${esc(v)}`)
      .join('&');
  }

  async function fetchPage(newPage = 1, replace = false) {
    setLoading(true);
    const url = `/api/reports?${qs({
      q: query.trim(),
      severity: severity === 'all' ? '' : severity,
      platform,
      since,
      page: newPage,
      pageSize: perPage,
    })}`;
    const r = await fetch(url, { cache: 'no-store' });
    const json = await r.json();
    setTotal(json.total || 0);
    setItems(replace ? json.items : [...items, ...json.items]);
    setLoading(false);
  }

  // initial + when filters change (reset page)
  useEffect(() => {
    setPage(1);
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severity, platform, since]);

  // debounced search
  useEffect(() => {
    clearTimeout(typing.current);
    typing.current = setTimeout(() => {
      setPage(1);
      fetchPage(1, true);
    }, 400);
    return () => clearTimeout(typing.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // live refresh every 60s (keeps current filters & page 1)
  useEffect(() => {
    const id = setInterval(() => {
      setPage(1);
      fetchPage(1, true);
    }, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severity, platform, since, query]);

  const locale = isArabic ? 'ar-SA' : undefined;
  const dir = isArabic ? 'rtl' : 'ltr';
  const canLoadMore = items.length < total;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }} dir={dir}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 0',
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                height: 36,
                width: 36,
                borderRadius: 12,
                background: '#0f172a',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
              }}
            >
              BD
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{t.title}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {t.subtitle}{' '}
                <span style={{ marginInlineStart: 8, color: '#059669' }}>● {t.live}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setLang(isArabic ? 'en' : 'ar')}
              style={{
                padding: '6px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                background: '#fff',
              }}
            >
              {isArabic ? 'English' : 'العربية'}
            </button>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
              style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, width: 220 }}
            />
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: 8 }}
            >
              <option value="all">{t.all}</option>
              <option value="critical">{isArabic ? 'حرجة' : 'Critical'}</option>
              <option value="high">{isArabic ? 'عالية' : 'High'}</option>
              <option value="medium">{isArabic ? 'متوسطة' : 'Medium'}</option>
              <option value="low">{isArabic ? 'منخفضة' : 'Low'}</option>
            </select>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: 8 }}
            >
              <option value="">{t.all}</option>
              <option>HackerOne</option>
              <option>Bugcrowd</option>
              <option>Intigriti</option>
              <option>YesWeHack</option>
              <option>Other</option>
            </select>
            <select
              value={since}
              onChange={(e) => setSince(e.target.value)}
              style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: 8 }}
            >
              {ranges.map((r) => (
                <option key={r.v} value={r.v}>
                  {isArabic ? r.ar : r.en}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setPage(1);
                fetchPage(1, true);
              }}
              style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#f8fafc' }}
            >
              {t.refresh}
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '16px' }}>
        {items.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>{t.no}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {items.map((r) => (
              <div key={r.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ textAlign: isArabic ? 'right' : 'left' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <div style={{ fontWeight: 600 }}>{r.title}</div>
                      <span style={{ padding: '2px 8px', borderRadius: 999, background: '#0f172a', color: '#fff', fontSize: 12 }}>
                        {r.platform}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: r.severity === 'critical' ? '#dc2626' : '#0f172a',
                          color: '#fff',
                          fontSize: 12,
                        }}
                      >
                        {isArabic && r.severity === 'critical' ? 'حرجة' : r.severity}
                      </span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 14, color: '#334155', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {r.program && <span style={{ fontWeight: 600 }}>{r.program}</span>}
                      {r.weakness && <span>• {r.weakness}</span>}
                      <span>• {new Date(r.publishedAt).toLocaleString(locale)}</span>
                      {typeof r.bounty === 'number' && (
                        <span>• Bounty: {r.currency || 'USD'} {r.bounty.toLocaleString(locale)}</span>
                      )}
                    </div>
                  </div>
                  <a href={r.url} target="_blank" rel="noreferrer" style={{ color: '#4338ca', textDecoration: 'underline' }}>
                    {t.view}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {canLoadMore && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <button
              disabled={loading}
              onClick={() => {
                const n = page + 1;
                setPage(n);
                fetchPage(n);
              }}
              style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 10, background: '#fff' }}
            >
              {t.loadMore} {loading ? '…' : ''}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
