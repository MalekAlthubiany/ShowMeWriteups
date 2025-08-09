'use client';
import { useEffect, useMemo, useState } from 'react';

export default function Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [dateRange, setDateRange] = useState('24h');
  const [lang, setLang] = useState('en');
  const isArabic = lang === 'ar';

  const t = useMemo(() => isArabic ? ({
    title: 'BugDaily',
    subtitle: 'تقارير علنية يومية لثغرات حرجة في برامج المكافآت',
    search: 'ابحث ...',
    severity: 'شدة',
    allSev: 'الكل',
    platform: 'المنصة',
    allPlatforms: 'الكل',
    since: 'منذ',
    last24h: 'آخر ٢٤ ساعة',
    last3d: 'آخر ٣ أيام',
    last7d: 'آخر ٧ أيام',
    last30d: 'آخر ٣٠ يوماً',
    refresh: 'تحديث',
    view: 'عرض',
    bounty: 'المكافأة',
    noResults: 'لا توجد تقارير مطابقة',
    loading: 'جاري التحميل…',
    sources: 'المصادر: HackerOne Hacktivity, Bugcrowd CrowdStream وغيرها وفق سياسات النشر والـ robots.txt',
    live: 'تحديث تلقائي',
  }) : ({
    title: 'BugDaily',
    subtitle: 'Daily public write‑ups of critical bounty reports',
    search: 'Search…',
    severity: 'Severity',
    allSev: 'All',
    platform: 'Platform',
    allPlatforms: 'All',
    since: 'Since',
    last24h: 'Last 24h',
    last3d: 'Last 3 days',
    last7d: 'Last 7 days',
    last30d: 'Last 30 days',
    refresh: 'Refresh',
    view: 'View',
    bounty: 'Bounty',
    noResults: 'No reports found.',
    loading: 'Loading…',
    sources: 'Sources: HackerOne Hacktivity, Bugcrowd CrowdStream, public write‑ups',
    live: 'Live auto‑update',
  }), [isArabic]);

  async function fetchReports() {
    try {
      setLoading(true);
      const res = await fetch('/api/reports?since=' + dateRange, { cache: 'no-store' });
      if (!res.ok) throw new Error('failed');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setData([
        { id:'demo-1', title: isArabic ? 'الاستحواذ على الحساب عبر رمز إعادة التعيين' : 'Account takeover via reset token', platform:'HackerOne', severity:'critical', program: isArabic?'شركة أكمي':'Acme', bounty:5000, currency:'USD', publishedAt:new Date().toISOString(), url:'https://hackerone.com/hacktivity', weakness:isArabic?'مصادقة مكسورة':'Broken Authentication' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchReports(); }, [dateRange]);

  useEffect(() => {
    const id = setInterval(() => {
      fetch('/api/reports?since=' + dateRange, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : [])
        .then(json => { if (Array.isArray(json) && json.length) setData(json); })
        .catch(()=>{});
    }, 60000);
    return () => clearInterval(id);
  }, [dateRange]);

  const filtered = useMemo(() => {
    return data
      .filter(r => severity==='all' ? true : r.severity===severity)
      .filter(r => platform==='all' ? true : r.platform===platform)
      .filter(r => query ? (r.title + ' ' + (r.weakness||'') + ' ' + (r.program||'')).toLowerCase().includes(query.toLowerCase()) : true)
      .sort((a,b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  }, [data, severity, platform, query]);

  const locale = isArabic ? 'ar-SA' : undefined;
  const dir = isArabic ? 'rtl' : 'ltr';

  const pill = { padding:'2px 8px', borderRadius:999, background:'#0f172a', color:'#fff', fontSize:12 };

  return (
    <div style={{minHeight:'100vh'}} dir={dir}>
      <header style={{position:'sticky', top:0, background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'12px 0', zIndex:10}}>
        <div style={{maxWidth:960, margin:'0 auto', padding:'0 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12}}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <div style={{height:36, width:36, borderRadius:12, background:'#0f172a', color:'#fff', display:'grid', placeItems:'center', fontWeight:700}}>BD</div>
            <div>
              <div style={{fontWeight:600}}>BugDaily</div>
              <div style={{fontSize:12, color:'#64748b'}}>{t.subtitle} <span style={{marginInlineStart:8, ...pill, background:'#059669'}}>●</span> <span style={{fontSize:12, color:'#059669'}}>{t.live}</span></div>
            </div>
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <button onClick={()=>setLang(isArabic ? 'en':'ar')} style={{padding:'6px 10px', border:'1px solid #cbd5e1', borderRadius:8, background:'#fff'}}>{isArabic?'English':'العربية'}</button>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search} style={{padding:'8px 12px', border:'1px solid #cbd5e1', borderRadius:8, width:220}}/>
            <select value={severity} onChange={e=>setSeverity(e.target.value)} style={{padding:'8px', border:'1px solid #cbd5e1', borderRadius:8}}>
              <option value="all">{t.allSev}</option>
              <option value="critical">{isArabic?'حرجة':'Critical'}</option>
              <option value="high">{isArabic?'عالية':'High'}</option>
              <option value="medium">{isArabic?'متوسطة':'Medium'}</option>
              <option value="low">{isArabic?'منخفضة':'Low'}</option>
              <option value="info">{isArabic?'معلومات':'Info'}</option>
            </select>
            <select value={platform} onChange={e=>setPlatform(e.target.value)} style={{padding:'8px', border:'1px solid #cbd5e1', borderRadius:8}}>
              <option value="all">{t.allPlatforms}</option>
              <option value="HackerOne">HackerOne</option>
              <option value="Bugcrowd">Bugcrowd</option>
              <option value="Intigriti">Intigriti</option>
              <option value="YesWeHack">YesWeHack</option>
              <option value="Other">{isArabic?'أخرى':'Other'}</option>
            </select>
            <select value={dateRange} onChange={e=>setDateRange(e.target.value)} style={{padding:'8px', border:'1px solid #cbd5e1', borderRadius:8}}>
              <option value="24h">{t.last24h}</option>
              <option value="3d">{t.last3d}</option>
              <option value="7d">{t.last7d}</option>
              <option value="30d">{t.last30d}</option>
            </select>
            <button onClick={fetchReports} style={{padding:'8px 10px', border:'1px solid #cbd5e1', borderRadius:8, background:'#f8fafc'}}>{t.refresh}</button>
          </div>
        </div>
      </header>

      <main style={{maxWidth:960, margin:'0 auto', padding:'16px'}}>
        {loading ? (
          <div style={{textAlign:'center', color:'#64748b', padding:'40px 0'}}>{t.loading}</div>
        ) : (filtered.length===0 ? (
          <div style={{textAlign:'center', color:'#64748b', padding:'40px 0'}}>{t.noResults}</div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            {filtered.map(r => (
              <div key={r.id} style={{background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:12}}>
                <div style={{display:'flex', justifyContent:'space-between', gap:12}}>
                  <div style={{textAlign:isArabic?'right':'left'}}>
                    <div style={{display:'flex', flexWrap:'wrap', gap:8, alignItems:'center'}}>
                      <div style={{fontWeight:600}}>{r.title}</div>
                      <span style={{...pill}}>{r.platform}</span>
                      <span style={{...pill, background:r.severity==='critical'?'#dc2626':'#0f172a', color:'#fff'}}>{isArabic && r.severity==='critical' ? 'حرجة' : r.severity}</span>
                    </div>
                    <div style={{marginTop:6, fontSize:14, color:'#334155', display:'flex', flexWrap:'wrap', gap:8}}>
                      {r.program && <span style={{fontWeight:600}}>{r.program}</span>}
                      {r.weakness && <span>• {r.weakness}</span>}
                      <span>• {new Date(r.publishedAt).toLocaleString(locale)}</span>
                      {typeof r.bounty==='number' && <span>• {t.bounty}: {r.currency|| (isArabic?'دولار':'USD')} {r.bounty.toLocaleString(locale)}</span>}
                    </div>
                  </div>
                  <a href={r.url} target="_blank" style={{color:'#4338ca', textDecoration:'underline'}} rel="noreferrer">{t.view}</a>
                </div>
              </div>
            ))}
          </div>
        ))}
      </main>

      <footer style={{maxWidth:960, margin:'0 auto', padding:'20px 16px', fontSize:12, color:'#64748b'}}>
        <p>{t.sources}</p>
      </footer>
    </div>
  );
}
