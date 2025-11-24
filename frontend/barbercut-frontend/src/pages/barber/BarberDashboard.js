import React, { useEffect, useState } from 'react';
import Countdown from '../../components/Countdown';
import { useAuth } from '../../context/AuthContext';
import { getReservationsForBarberAllMerged, updateReservationStatus, getBarberAverageRating } from '../../lib/api';

export default function BarberDashboard() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [inProgress, setInProgress] = useState([]);
  const [declined, setDeclined] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('PENDING'); // PENDING | APPROVED | IN_PROGRESS | DECLINED | PAST
  const [avg, setAvg] = useState({ average: 0, count: 0 });

  const loadAll = async () => {
    if (!user?.barberId) return;
    try {
      setLoading(true);
      setError('');
      // Fetch all once to derive all groupings
      const all = await getReservationsForBarberAllMerged(user.barberId);
      const now = Date.now();
      
      // Past items: reservations that are completed, declined, or have passed their slot time
      const pastItems = all.filter(r => 
        r.status === 'COMPLETED' || 
        r.status === 'DECLINED' || 
        new Date(r.slot).getTime() < now
      ).sort((a, b) => new Date(b.slot) - new Date(a.slot));
      setPast(pastItems);
      
      // Show ALL pending (regardless of time) so barber can take action
      setPending(
        all
          .filter(r => r.status === 'PENDING')
          .sort((a,b) => new Date(a.slot) - new Date(b.slot))
      );
      
      // Approved: approved reservations that haven't started yet
      setApproved(
        all
          .filter(r => r.status === 'APPROVED' && new Date(r.slot).getTime() >= now)
          .sort((a,b) => new Date(a.slot) - new Date(b.slot))
      );
      
      // In Progress: reservations currently in progress
      setInProgress(
        all
          .filter(r => r.status === 'IN_PROGRESS')
          .sort((a,b) => new Date(a.slot) - new Date(b.slot))
      );
      
      setDeclined(
        all
          .filter(r => r.status === 'DECLINED' && new Date(r.slot).getTime() >= now)
          .sort((a,b) => new Date(a.slot) - new Date(b.slot))
      );
    } catch (e) {
      setError(e.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const iv = setInterval(loadAll, 5000);
    const onVis = () => { if (document.visibilityState === 'visible') loadAll(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.barberId]);

  useEffect(() => {
    const fetchAvg = async () => {
      if (!user?.barberId) return;
      try {
        const r = await getBarberAverageRating(user.barberId);
        setAvg(r);
      } catch {}
    };
    fetchAvg();
    const iv = setInterval(fetchAvg, 10000);
    return () => clearInterval(iv);
  }, [user?.barberId]);

  const handleAction = async (id, status) => {
    try {
      await updateReservationStatus(id, status);
      await loadAll();
    } catch (e) {
      alert(e.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="home"><div className="bc-container"><div className="panel">
        <h2 className="selection-title">Barber Dashboard</h2>
        <p className="muted" style={{textAlign:'center'}}>Loading...</p>
      </div></div></div>
    );
  }

  return (
    <div className="home">
      <div className="bc-container">
        <div className="panel">
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <h2 className="selection-title" style={{ marginBottom: 6 }}>Barber Dashboard</h2>
            <p className="muted">Welcome, {user?.username} • Barber ID: {user?.barberId}</p>
            <div style={{ marginTop: 6, fontWeight:700, color:'#facc15' }}>{(avg.average || 0).toFixed(1)} ⭐ <span className="muted" style={{ fontWeight:400, color:'#9ca3af' }}>({avg.count || 0})</span></div>
          </div>
          {error && <p className="error">{error}</p>}

          {/* Status filter tabs */}
          <div className="tabs" style={{ display:'flex', gap:8, marginBottom:16, justifyContent:'center', flexWrap:'wrap' }}>
            {[
              { key:'PENDING', label:'Pending' },
              { key:'APPROVED', label:'Approved' },
              { key:'IN_PROGRESS', label:'In Progress' },
              { key:'DECLINED', label:'Declined' },
              { key:'PAST', label:'Past' },
            ].map(t => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="btn sm"
                  style={{
                    borderRadius:14,
                    padding:'8px 14px',
                    background: active ? '#ffffff' : '#2a2f36',
                    color: active ? '#111827' : '#e5e7eb',
                    border:'1px solid #3b4148'
                  }}
                >{t.label}</button>
              );
            })}
          </div>

          {tab === 'PENDING' && (
          <>
          <h3 style={{ marginTop: 0 }}>Pending Requests</h3>
          {pending.length === 0 ? (
            <p className="muted">No pending reservations.</p>
          ) : (
            <div className="reservations-grid" style={{ display:'block' }}>
              {pending.map(res => (
                <div
                  key={res.id}
                  className="reservation-card"
                  style={{ border:'1px solid var(--color-border)', borderRadius:12, padding:12, width:'100%', maxWidth:'100%', boxSizing:'border-box', marginBottom:12 }}
                >
                  <div className="reservation-card__content">
                    <h3 className="reservation-card__service">{res.notes || 'Haircut Service'}</h3>
                    <div className="reservation-card__date muted">{new Date(res.slot).toLocaleString()}</div>
                    <div className="reservation-card__price">Client: {res.clientUsername || res.clientId}</div>
                    <div style={{ display:'flex', gap:8, marginTop:12, justifyContent:'flex-end' }}>
                      <button className="btn btn-primary sm" onClick={() => handleAction(res.id, 'APPROVED')}>Approve</button>
                      <button className="btn btn-secondary sm" onClick={() => handleAction(res.id, 'DECLINED')}>Decline</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}

          {tab === 'APPROVED' && (
          <>
          <h3 style={{ marginTop: 0 }}>Approved</h3>
          {approved.length === 0 ? (
            <p className="muted">No approved upcoming reservations.</p>
          ) : (
            <div className="reservations-grid" style={{ display:'block' }}>
              {approved.map(res => (
                <div key={res.id} className="reservation-card" style={{ position:'relative', border:'1px solid var(--color-border)', borderRadius:12, padding:12, width:'100%', maxWidth:'100%', boxSizing:'border-box', marginBottom:12 }}>
                  <div style={{ position:'absolute', top:8, right:12, color:'var(--color-brand-600)', fontWeight:700, letterSpacing:0.5 }}>APPROVED</div>
                  <div className="reservation-card__content">
                    <h3 className="reservation-card__service">{res.notes || 'Haircut Service'}</h3>
                    <div className="reservation-card__date muted">{new Date(res.slot).toLocaleString()}</div>
                    <div className="reservation-card__price">Client: {res.clientUsername || res.clientId}</div>
                    <Countdown startIso={res.slot} serviceDuration={res.serviceDurationMinutes} emphasis={true} />
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}

          {tab === 'IN_PROGRESS' && (
          <>
          <h3 style={{ marginTop: 0 }}>In Progress</h3>
          {inProgress.length === 0 ? (
            <p className="muted">No services in progress.</p>
          ) : (
            <div className="reservations-grid" style={{ display:'block' }}>
              {inProgress.map(res => (
                <div
                  key={res.id}
                  className="reservation-card"
                  style={{ border:'1px solid var(--color-border)', borderRadius:12, padding:12, width:'100%', maxWidth:'100%', boxSizing:'border-box', marginBottom:12, position:'relative' }}
                >
                  <div className="reservation-card__content">
                    <h3 className="reservation-card__service">{res.notes || 'Haircut Service'}</h3>
                    <div className="reservation-card__date muted">{new Date(res.slot).toLocaleString()}</div>
                    <div className="reservation-card__price">Client: {res.clientUsername || res.clientId}</div>
                    <div style={{ position:'absolute', top:8, right:12, color:'var(--color-brand-600)', fontWeight:700, letterSpacing:0.5 }}>IN PROGRESS</div>
                    <Countdown startIso={res.slot} serviceDuration={res.serviceDurationMinutes} emphasis={true} />
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}

          {tab === 'DECLINED' && (
          <>
          <h3 style={{ marginTop: 0 }}>Declined</h3>
          {declined.length === 0 ? (
            <p className="muted">No declined upcoming reservations.</p>
          ) : (
            <div className="reservations-grid" style={{ display:'block' }}>
              {declined.map(res => (
                <div key={res.id} className="reservation-card" style={{ position:'relative', border:'1px solid var(--color-border)', borderRadius:12, padding:12, width:'100%', maxWidth:'100%', boxSizing:'border-box', marginBottom:12 }}>
                  <div style={{ position:'absolute', top:8, right:12, color:'var(--color-danger)', fontWeight:700, letterSpacing:0.5 }}>DECLINED</div>
                  <div className="reservation-card__content">
                    <h3 className="reservation-card__service">{res.notes || 'Haircut Service'}</h3>
                    <div className="reservation-card__date muted">{new Date(res.slot).toLocaleString()}</div>
                    <div className="reservation-card__price">Client: {res.clientUsername || res.clientId}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}

          {tab === 'PAST' && (
          <>
          <h3 style={{ marginTop: 0 }}>Past Reservations</h3>
          {past.length === 0 ? (
            <p className="muted">No past reservations.</p>
          ) : (
            <div className="reservations-grid" style={{ display:'block' }}>
              {past.map(res => {
                const color = res.status === 'DECLINED' ? 'var(--color-danger)' : res.status === 'APPROVED' ? 'var(--color-brand-600)' : 'var(--color-muted)';
                return (
                  <div key={res.id} className="reservation-card" style={{ position:'relative', border:'1px solid var(--color-border)', borderRadius:12, padding:12, width:'100%', maxWidth:'100%', boxSizing:'border-box', marginBottom:12 }}>
                    <div style={{ position:'absolute', top:8, right:12, fontWeight:700, letterSpacing:0.5, color }}>
                      {res.status}
                    </div>
                    <div className="reservation-card__content">
                      <h3 className="reservation-card__service">{res.notes || 'Haircut Service'}</h3>
                      <div className="reservation-card__date muted">{new Date(res.slot).toLocaleString()}</div>
                      <div className="reservation-card__price">Client: {res.clientUsername || res.clientId}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}
