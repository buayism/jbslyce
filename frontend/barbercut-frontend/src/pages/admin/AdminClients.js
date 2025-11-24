import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../lib/api';

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState(null);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/admin/clients`);
      if (!res.ok) throw new Error('Failed to load clients');
      const data = await res.json();
      setClients(data);
    } catch (e) {
      setError(e.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClients(); }, []);

  const handleBan = async (id) => {
    if (!window.confirm('Ban this client? They will not be able to log in or make reservations.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/clients/${id}/ban`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to ban client');
      await loadClients();
    } catch (e) {
      alert(e.message || 'Failed to ban client');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this client? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete client');
      await loadClients();
    } catch (e) {
      alert(e.message || 'Failed to delete client');
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  return (
    <div>
      <h2 className="selection-title" style={{ marginTop: 0 }}>Clients</h2>
      {loading && <p className="muted">Loading clients...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
      <div className="card" style={{ padding: 0, background:'var(--color-surface-2)' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, color:'var(--color-ink)' }}>
            <thead>
              <tr style={{ textAlign:'left', background:'var(--color-surface-2)', borderBottom:'2px solid var(--color-brand)' }}>
                <th style={{ padding:12, color:'var(--color-brand)', fontWeight:800, textTransform:'uppercase', fontSize:12, letterSpacing:0.6 }}>Name</th>
                <th style={{ padding:12, color:'var(--color-brand)', fontWeight:800, textTransform:'uppercase', fontSize:12, letterSpacing:0.6 }}>Email</th>
                <th style={{ padding:12, color:'var(--color-brand)', fontWeight:800, textTransform:'uppercase', fontSize:12, letterSpacing:0.6 }}>Joined</th>
                <th style={{ padding:12, color:'var(--color-brand)', fontWeight:800, textTransform:'uppercase', fontSize:12, letterSpacing:0.6 }}>Status</th>
                <th style={{ padding:12, color:'var(--color-brand)', fontWeight:800, textTransform:'uppercase', fontSize:12, letterSpacing:0.6, textAlign:'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding:12, textAlign:'center' }} className="muted">No clients found</td>
                </tr>
              ) : (
                clients.map(c => (
                  <tr
                    key={c.id}
                    onMouseEnter={() => setHovered(c.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ borderTop:'1px solid var(--color-border)', background: hovered === c.id ? 'rgba(59,130,246,0.08)' : 'transparent', boxShadow: hovered === c.id ? 'inset 3px 0 0 var(--color-brand)' : undefined }}
                  >
                    <td style={{ padding:12 }}>
                      <div style={{ fontWeight:600 }}>{c.name}</div>
                    </td>
                    <td style={{ padding:12 }}>{c.email}</td>
                    <td style={{ padding:12 }}>{formatDate(c.createdAt)}</td>
                    <td style={{ padding:12 }}>
                      <span 
                        className="muted" 
                        style={{ 
                          textTransform:'capitalize',
                          color: c.status === 'banned' ? '#ef4444' : '#10b981',
                          fontWeight: 600
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding:12, textAlign:'right' }}>
                      <div style={{ display: hovered === c.id ? 'flex' : 'none', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
                        {c.status !== 'banned' && (
                          <button className="btn sm btn-secondary" onClick={(e)=>{e.stopPropagation(); handleBan(c.id);}}>Ban</button>
                        )}
                        <button className="btn sm" onClick={(e)=>{e.stopPropagation(); handleDelete(c.id);}}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
