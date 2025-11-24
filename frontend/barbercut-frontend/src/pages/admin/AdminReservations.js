import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../lib/api';

const STATUS_MAP = {
  'PENDING': 'Pending',
  'APPROVED': 'Approved',
  'IN_PROGRESS': 'In Progress',
  'COMPLETED': 'Completed',
  'DECLINED': 'Declined',
  'CANCELLED': 'Cancelled'
};

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hovered, setHovered] = useState(null);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError('');
      let url = `${API_BASE}/api/admin/reservations?sortBy=date`;
      if (statusFilter !== 'All') {
        url += `&status=${statusFilter}`;
      }
      if (dateFrom) {
        url += `&dateFrom=${dateFrom}`;
      }
      if (dateTo) {
        url += `&dateTo=${dateTo}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load reservations');
      const data = await res.json();
      setReservations(data);
    } catch (e) {
      setError(e.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReservations(); }, [statusFilter, dateFrom, dateTo]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/reservations/${id}/cancel`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to cancel');
      await loadReservations();
    } catch (e) {
      alert(e.message || 'Failed to cancel reservation');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this reservation?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/reservations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await loadReservations();
    } catch (e) {
      alert(e.message || 'Failed to delete reservation');
    }
  };


  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <h2 className="selection-title" style={{ marginTop: 0 }}>Reservations</h2>
      {loading && <p className="muted">Loading reservations...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <>
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth:120 }}>
              <option value="All">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="DECLINED">Declined</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <label style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span className="muted" style={{ fontSize:14 }}>From:</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span className="muted" style={{ fontSize:14 }}>To:</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </label>
            {(dateFrom || dateTo) && (
              <button className="btn sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>Clear Dates</button>
            )}
          </div>
          <div className="card" style={{ padding: 0, background:'var(--color-surface-2)', color:'var(--color-ink)' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, color:'var(--color-ink)' }}>
                <thead>
                  <tr style={{ textAlign:'left', background:'var(--color-surface-2)', borderBottom:'2px solid var(--color-brand)' }}>
                    <th style={{ padding:12, color:'var(--color-brand)', fontWeight:800, textTransform:'uppercase', fontSize:12, letterSpacing:0.6 }}>Client</th>
                    <th style={{ padding:12, color:'var(--color-brand)', fontWeight:800, textTransform:'uppercase', fontSize:12, letterSpacing:0.6 }}>Barber</th>
                    <th style={{ padding:12, color:'var(--color-brand)', fontWeight:800, textTransform:'uppercase', fontSize:12, letterSpacing:0.6 }}>Date</th>
                    <th style={{ padding:12, color:'var(--color-brand)', fontWeight:800, textTransform:'uppercase', fontSize:12, letterSpacing:0.6 }}>Time</th>
                    <th style={{ padding:12, color:'var(--color-brand)', fontWeight:800, textTransform:'uppercase', fontSize:12, letterSpacing:0.6 }}>Status</th>
                    <th style={{ padding:12, color:'var(--color-brand)', fontWeight:800, textTransform:'uppercase', fontSize:12, letterSpacing:0.6, textAlign:'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding:12, textAlign:'center' }} className="muted">No reservations found</td>
                    </tr>
                  ) : (
                    reservations.map(r => (
                      <tr
                        key={r.id}
                        onMouseEnter={() => setHovered(r.id)}
                        onMouseLeave={() => setHovered(null)}
                        style={{ borderTop:'1px solid var(--color-border)', background: hovered === r.id ? 'rgba(59,130,246,0.08)' : 'transparent', boxShadow: hovered === r.id ? 'inset 3px 0 0 var(--color-brand)' : undefined }}
                      >
                        <td style={{ padding:12 }}>
                          <div style={{ fontWeight:600 }}>{r.clientName}</div>
                          {r.serviceName && <div className="muted" style={{ fontSize:12 }}>{r.serviceName}</div>}
                        </td>
                        <td style={{ padding:12 }}>{r.barberName}</td>
                        <td style={{ padding:12 }}>{formatDate(r.slot)}</td>
                        <td style={{ padding:12 }}>{formatTime(r.slot)}</td>
                        <td style={{ padding:12 }}>
                          <span className="muted" style={{ textTransform:'capitalize' }}>{STATUS_MAP[r.status] || r.status}</span>
                        </td>
                        <td style={{ padding:12, textAlign:'right' }}>
                          <div style={{ display: hovered === r.id ? 'flex' : 'none', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
                            {r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && (
                              <button className="btn sm btn-secondary" onClick={(e)=>{e.stopPropagation(); handleCancel(r.id);}}>Cancel</button>
                            )}
                            <button className="btn sm" onClick={(e)=>{e.stopPropagation(); handleDelete(r.id);}}>Delete</button>
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
    </div>
  );
}
