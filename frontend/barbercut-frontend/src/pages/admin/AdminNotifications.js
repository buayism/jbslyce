import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../lib/api';

export default function AdminNotifications() {
  const seed = useMemo(() => {
    const now = Date.now();
    const ago = (mins) => new Date(now - mins * 60 * 1000).toISOString();
    return [
      { id:'s1', type:'SLOT_CREATED', title:'New slot created', body:'Barber barber1 created a new slot for today 4:00 PM.', at: ago(15), read:false },
      { id:'b1', type:'BOOKED', title:'New reservation booked', body:'Client John booked a slot with barber1 for tomorrow 10:30 AM.', at: ago(120), read:false },
      { id:'r1', type:'RESERVATION_COMPLETED', title:'Reservation completed', body:'Reservation #A13 completed successfully.', at: ago(60*26), read:true },
      { id:'u1', type:'USER_SIGNUP', title:'New user signup', body:'New client account created: alice@example.com.', at: ago(60*30), read:false },
      { id:'rev1', type:'RATING_REVIEW', title:'New rating & review', body:'Barber Noah received 5★ – “Great service!”', at: ago(60*48), read:true },
      { id:'d1', type:'RESERVATION_DECISION', title:'Reservation approved', body:'Barber barber2 approved reservation #B22.', at: ago(9), read:false },
      { id:'d2', type:'RESERVATION_DECISION', title:'Reservation declined', body:'Barber barber3 declined reservation #B19.', at: ago(60*5), read:true },
      { id:'p1', type:'PROFILE_UPDATE', title:'Barber profile updated', body:'barber2 updated profile picture.', at: ago(60*72), read:true }
    ];
  }, []);

  const [notes, setNotes] = useState([]);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  const typeToTab = (t) => {
    if (t === 'SLOT_CREATED' || t === 'BOOKED' || t === 'RESERVATION_COMPLETED' || t === 'RESERVATION_DECISION') return 'RESERVATIONS';
    if (t === 'USER_SIGNUP') return 'USERS';
    if (t === 'RATING_REVIEW') return 'REVIEWS';
    if (t === 'PROFILE_UPDATE') return 'UPDATES';
    return 'UPDATES';
  };

  const rel = (iso) => {
    try {
      const ms = Date.now() - new Date(iso).getTime();
      const m = Math.round(ms / 60000);
      if (m < 60) return `${m} minute${m===1?'':'s'} ago`;
      const h = Math.round(m / 60);
      if (h < 24) return `${h} hour${h===1?'':'s'} ago`;
      const d = Math.round(h / 24);
      return `${d} day${d===1?'':'s'} ago`;
    } catch { return '—'; }
  };

  const icons = {
    SLOT_CREATED: '🗓️', BOOKED: '📝', RESERVATION_COMPLETED: '✅', USER_SIGNUP: '👤', RATING_REVIEW: '⭐', RESERVATION_DECISION: '✳️', PROFILE_UPDATE: '🖼️'
  };

  const tabs = [
    { id:'ALL', label:'All' },
    { id:'RESERVATIONS', label:'Reservations' },
    { id:'REVIEWS', label:'Reviews' },
    { id:'USERS', label:'Users' },
    { id:'UPDATES', label:'Updates' }
  ];

  const list = useMemo(() => {
    let arr = [...notes];
    if (tab !== 'ALL') arr = arr.filter(n => typeToTab(n.type) === tab);
    if (q.trim()) {
      const qc = q.trim().toLowerCase();
      arr = arr.filter(n => (n.title+' '+n.body).toLowerCase().includes(qc));
    }
    arr.sort((a,b) => sortBy === 'NEWEST' ? (new Date(b.at)-new Date(a.at)) : (new Date(a.at)-new Date(b.at)));
    return arr;
  }, [notes, q, tab, sortBy]);

  // Map server notification to UI shape
  const mapServer = (n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    at: n.createdAt || new Date().toISOString(),
    read: !!n.read,
  });

  // Initial load
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/notifications`);
        if (!res.ok) throw new Error('Failed to load notifications');
        const data = await res.json();
        if (!cancelled) setNotes(Array.isArray(data) ? data.map(mapServer) : []);
      } catch (e) {
        // Fallback to seed if backend not ready
        if (!cancelled) setNotes(seed);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [seed]);

  // Live updates via SSE
  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/admin/notifications/stream`);
    const onMsg = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setNotes(prev => {
          const exists = prev.some(n => n.id === data.id);
          const mapped = mapServer(data);
          return exists ? prev.map(n => n.id === data.id ? mapped : n) : [mapped, ...prev];
        });
      } catch {}
    };
    es.addEventListener('notification', onMsg);
    es.onmessage = onMsg; // fallback
    es.onerror = () => { /* keep connection, browser will retry */ };
    return () => { es.close(); };
  }, []);

  const markAll = async () => {
    try { await fetch(`${API_BASE}/api/admin/notifications/mark-read`, { method:'PUT' }); } catch {}
    setNotes(prev => prev.map(n => ({ ...n, read:true })));
  };
  const toggle = async (id) => {
    const item = notes.find(n => n.id === id);
    const next = item ? !item.read : true;
    try { await fetch(`${API_BASE}/api/admin/notifications/${encodeURIComponent(id)}/read?value=${String(next)}`, { method:'PUT' }); } catch {}
    setNotes(prev => prev.map(n => n.id === id ? { ...n, read: next } : n));
  };

  const Chip = ({active, onClick, children}) => (
    <button onClick={onClick} style={{ padding:'8px 12px', borderRadius:10, border:'1px solid var(--color-border)', background: active ? '#374151' : 'var(--color-surface-2)', color:'var(--color-ink)', fontWeight:700 }}>
      {children}
    </button>
  );

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div>
          <h2 style={{ margin:'0 0 6px', fontSize:28, fontWeight:800 }}>Notifications</h2>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={markAll} style={{ background:'#1f2937', color:'#e5e7eb', border:'1px solid var(--color-border)' }}>Mark all as read</button>
          <button className="btn" style={{ background:'var(--color-brand)', color:'#111827', border:'1px solid var(--color-brand-600)' }}>Settings</button>
        </div>
      </div>

      <div className="card" style={{ padding:12, marginBottom:12 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ flex:'1 1 280px' }}>
            <input type="text" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search notifications..." />
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {tabs.map(t => (
              <Chip key={t.id} active={tab===t.id} onClick={()=>setTab(t.id)}>{t.label}</Chip>
            ))}
          </div>
          <div style={{ marginLeft:'auto' }}>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)}>
              <option value="NEWEST">Sort by: Newest</option>
              <option value="OLDEST">Sort by: Oldest</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding:0 }}>
        <div>
          {list.map((n, idx) => (
            <div key={n.id} style={{ display:'grid', gridTemplateColumns:'40px 1fr auto', gap:12, alignItems:'center', padding:'14px 16px', borderBottom: idx<list.length-1 ? '1px solid var(--color-border)' : 'none', background: n.read ? 'transparent' : 'rgba(249,115,22,0.06)' }}>
              <div style={{ fontSize:18, textAlign:'center' }}>{icons[n.type] || '🔔'}</div>
              <div style={{ textAlign:'left' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {!n.read && <span title="Unread" style={{ width:8, height:8, borderRadius:'50%', background:'#f59e0b', display:'inline-block' }} />}
                  <div style={{ fontWeight:800 }}>{n.title}</div>
                </div>
                <div className="muted" style={{ marginTop:4 }}>{n.body}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div className="muted" style={{ fontSize:12 }}>{rel(n.at)}</div>
                <div>
                  <button className="btn sm" onClick={()=>toggle(n.id)}>{n.read ? 'Mark unread' : 'Mark read'}</button>
                </div>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div style={{ padding:18, textAlign:'center' }} className="muted">No notifications.</div>
          )}
        </div>
      </div>
    </div>
  );
}
