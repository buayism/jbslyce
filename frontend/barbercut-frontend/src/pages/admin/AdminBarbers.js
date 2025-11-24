import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE, mediaUrl } from '../../lib/api';

export default function AdminBarbers() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('DATE_NEWEST');
  const [createdMap, setCreatedMap] = useState({});
  const [bookCounts, setBookCounts] = useState({});
  const [hovered, setHovered] = useState(null);

  const loadBarbers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/admin/barbers`);
      if (!res.ok) throw new Error('Failed to load barbers');
      const data = await res.json();
      setBarbers(data);
    } catch (e) {
      setError(e.message || 'Failed to load barbers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBarbers(); }, []);

  useEffect(() => {
    const loadExtras = async () => {
      try {
        const [usersRes, resRes] = await Promise.all([
          fetch(`${API_BASE}/api/users/barbers`).catch(() => null),
          fetch(`${API_BASE}/api/admin/reservations?status=COMPLETED`).catch(() => null)
        ]);
        if (usersRes && usersRes.ok) {
          const arr = await usersRes.json();
          const map = {};
          if (Array.isArray(arr)) {
            for (const u of arr) {
              if (u && u.id) map[u.id] = u.createdAt || null;
            }
          }
          setCreatedMap(map);
        }
        if (resRes && resRes.ok) {
          const list = await resRes.json();
          const counts = {};
          if (Array.isArray(list)) {
            for (const r of list) {
              if (!r || !r.barberId) continue;
              counts[r.barberId] = (counts[r.barberId] || 0) + 1;
            }
          }
          setBookCounts(counts);
        }
      } catch { }
    };
    loadExtras();
  }, []);

  const filteredSorted = useMemo(() => {
    let arr = Array.isArray(barbers) ? [...barbers] : [];
    if (statusFilter !== 'All') arr = arr.filter(b => (b.status || '').toLowerCase() === statusFilter.toLowerCase());
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter(b => (b.name || '').toLowerCase().includes(q) || (b.email || '').toLowerCase().includes(q));
    }
    if (sortBy === 'DATE_NEWEST' || sortBy === 'DATE_OLDEST') {
      arr.sort((a, b) => {
        const da = createdMap[a.id] ? new Date(createdMap[a.id]).getTime() : 0;
        const db = createdMap[b.id] ? new Date(createdMap[b.id]).getTime() : 0;
        return sortBy === 'DATE_NEWEST' ? (db - da) : (da - db);
      });
    } else if (sortBy === 'MOST_BOOKED') {
      arr.sort((a, b) => {
        const ca = bookCounts[a.id] || 0;
        const cb = bookCounts[b.id] || 0;
        if (cb !== ca) return cb - ca;
        const da = createdMap[a.id] ? new Date(createdMap[a.id]).getTime() : 0;
        const db = createdMap[b.id] ? new Date(createdMap[b.id]).getTime() : 0;
        return db - da;
      });
    }
    return arr;
  }, [barbers, statusFilter, query, sortBy, createdMap, bookCounts]);

  const formatDate = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toISOString().slice(0, 10); } catch { return '—'; }
  };

  const StatusPill = ({ value }) => {
    const v = (value || '').toLowerCase();
    const color = v === 'approved' ? '#16a34a' : v === 'rejected' ? '#ef4444' : '#f59e0b';
    const bg = v === 'approved' ? 'rgba(22,163,74,0.15)' : v === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)';
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 999, background: bg, color, fontWeight: 700 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
        <span style={{ textTransform: 'capitalize' }}>{value}</span>
      </span>
    );
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/barbers/${id}/approve`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to approve');
      await loadBarbers();
    } catch (e) {
      alert(e.message || 'Failed to approve barber');
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/barbers/${id}/reject`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to reject');
      await loadBarbers();
    } catch (e) {
      alert(e.message || 'Failed to reject barber');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this barber?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/barbers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await loadBarbers();
    } catch (e) {
      alert(e.message || 'Failed to delete barber');
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'left', marginBottom: 12 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800 }}>Manage Barbers</h2>
        <div className="muted">View or manage all barbers.</div>
      </div>
      {loading && <p className="muted">Loading barbers...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <>
          <div className="card" style={{ padding: 12, marginBottom: 12, background: 'var(--color-surface-2)', color: 'var(--color-ink)' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 280px' }}>
                <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search barbers by name or email..." />
              </div>
              <div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="All">Status: All</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="DATE_NEWEST">Sort: Date added (Newest)</option>
                  <option value="DATE_OLDEST">Sort: Date added (Oldest)</option>
                  <option value="MOST_BOOKED">Sort: Most booked</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, background: 'var(--color-surface-2)', color: 'var(--color-ink)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: 'var(--color-surface-2)', borderBottom: '2px solid var(--color-brand)' }}>
                    <th style={{ padding: 12, color: 'var(--color-brand)', fontWeight: 800, textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.6 }}></th>
                    <th style={{ padding: 12, color: 'var(--color-brand)', fontWeight: 800, textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.6 }}>Name</th>
                    <th style={{ padding: 12, color: 'var(--color-brand)', fontWeight: 800, textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.6 }}>Email</th>
                    <th style={{ padding: 12, color: 'var(--color-brand)', fontWeight: 800, textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.6 }}>Status</th>
                    <th style={{ padding: 12, color: 'var(--color-brand)', fontWeight: 800, textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.6 }}>Date Joined</th>
                    <th style={{ padding: 12, color: 'var(--color-brand)', fontWeight: 800, textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.6 }}>Bookings</th>
                    <th style={{ padding: 12, color: 'var(--color-brand)', fontWeight: 800, textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.6, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSorted.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: 12 }} className="muted">No barbers found</td>
                    </tr>
                  ) : (
                    filteredSorted.map(b => (
                      <tr
                        key={b.id}
                        onMouseEnter={() => setHovered(b.id)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => setModal(b)}
                        title="Click to view profile picture"
                        style={{ borderTop: '1px solid var(--color-border)', cursor: 'pointer', background: hovered === b.id ? 'rgba(59,130,246,0.08)' : 'transparent', boxShadow: hovered === b.id ? 'inset 3px 0 0 var(--color-brand)' : undefined }}
                      >
                        <td style={{ padding: 12 }} onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label={`Select ${b.name}`} onClick={(e) => e.stopPropagation()} /></td>
                        <td style={{ padding: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              className="avatar"
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: 'var(--color-surface-2)',
                                backgroundImage: b.avatar ? `url(${mediaUrl(b.avatar)})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: 700 }}>{b.name}</div>
                              <div className="muted" style={{ fontSize: 12 }}>{b.phone || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: 12 }}>{b.email || '—'}</td>
                        <td style={{ padding: 12 }}><StatusPill value={b.status} /></td>
                        <td style={{ padding: 12 }}>{formatDate(createdMap[b.id])}</td>
                        <td style={{ padding: 12 }}>{bookCounts[b.id] || 0}</td>
                        <td style={{ padding: 12, textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', visibility: hovered === b.id ? 'visible' : 'hidden' }}>
                            {b.status && b.status.toLowerCase() === 'pending' && (
                              <button
                                className="btn btn-primary sm"
                                onClick={(e) => { e.stopPropagation(); handleApprove(b.id); }}
                                title="Approve barber"
                              >
                                ✓ Approve
                              </button>
                            )}
                            <button className="btn sm" onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {modal && (
        <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 720, background: 'var(--color-surface)', color: 'var(--color-ink)', borderRadius: 16, padding: 18, boxShadow: '0 20px 60px rgba(0,0,0,0.45)', border: '1px solid var(--color-border)', position: 'relative' }}>
            <button onClick={() => setModal(null)} className="btn sm" style={{ position: 'absolute', right: 12, top: 12 }}>×</button>
            <div style={{ textAlign: 'center' }}>
              {modal.avatar ? (
                <img
                  src={mediaUrl(modal.avatar)}
                  alt="Profile"
                  style={{ maxWidth: '100%', maxHeight: '60vh', display: 'block', margin: '0 auto 10px', borderRadius: 12, border: '2px solid var(--color-border)', objectFit: 'contain' }}
                />
              ) : (
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    margin: '0 auto 10px',
                    background: 'var(--color-surface-2)',
                    border: '2px solid var(--color-border)'
                  }}
                />
              )}
              <h3 style={{ margin: '8px 0 6px' }}>{modal.name} ✂️</h3>
              <p className="muted" style={{ margin: 0 }}>{modal.bio || 'No bio available.'}</p>
              <div style={{ marginTop: 10, fontWeight: 700, textTransform: 'capitalize' }}>
                Status: <span style={{ color: modal.status === 'approved' ? '#10b981' : modal.status === 'rejected' ? '#ef4444' : '#f59e0b' }}>{modal.status}</span>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
