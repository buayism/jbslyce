import React, { useEffect, useState } from 'react';
import Countdown from '../components/Countdown';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getClientReservations, cancelReservation, getBarbers, mediaUrl, createRating, getMyRatingForReservation, getRatingsForClient } from '../lib/api';

function MyReservations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [declinedNotice, setDeclinedNotice] = useState(null);
  const [barberMap, setBarberMap] = useState({});
  const [rateTarget, setRateTarget] = useState(null); // { reservationId, barberId }
  const [rateValue, setRateValue] = useState(5);
  const [rateFeedback, setRateFeedback] = useState('');
  const [rateSubmitting, setRateSubmitting] = useState(false);
  const [rateError, setRateError] = useState('');
  const [ratedMap, setRatedMap] = useState({}); // reservationId -> true if already rated
  const [tab, setTab] = useState('reservations'); // 'reservations' | 'reviews'
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Submit rating (component scope)
  const submitRating = async () => {
    if (!rateTarget) return;
    try {
      setRateSubmitting(true);
      setRateError('');
      await createRating({
        barberId: rateTarget.barberId,
        clientId: user.id,
        reservationId: rateTarget.reservationId,
        rating: rateValue,
        feedback: rateFeedback
      });
      setRateTarget(null);
      setRateFeedback('');
      setRatedMap(prev => ({ ...prev, [rateTarget.reservationId]: true }));
    } catch (e) {
      setRateError(e.message || 'Failed to submit rating');
    } finally {
      setRateSubmitting(false);
    }
  };

  useEffect(() => {
    if (!user) {
      try { sessionStorage.setItem('bc_post_login_redirect', '/my-reservations'); } catch {}
      navigate('/signin');
      return;
    }
    loadReservations();
    const iv = setInterval(() => { loadReservations({ silent: true }); }, 5000);
    const onVis = () => { if (document.visibilityState === 'visible') loadReservations({ silent: true }); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, [user]);

  useEffect(() => {
    const loadBarbers = async () => {
      try {
        const list = await getBarbers();
        const map = {};
        for (const b of list) map[b.id] = b;
        setBarberMap(map);
      } catch {}
    };
    loadBarbers();
  }, []);

  useEffect(() => {
    const loadReviews = async () => {
      if (!user?.id) return;
      try {
        setLoadingReviews(true);
        const data = await getRatingsForClient(user.id);
        setReviews(Array.isArray(data) ? data : []);
      } catch {
        // non-fatal
      } finally {
        setLoadingReviews(false);
      }
    };
    if (tab === 'reviews') loadReviews();
  }, [tab, user?.id]);

  const loadReservations = async ({ silent } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const data = await getClientReservations(user.id);
      setReservations(data);
      try {
        const prevRaw = sessionStorage.getItem('bc_prev_res_status');
        const prev = prevRaw ? JSON.parse(prevRaw) : {};
        const curr = {};
        let foundNewDecline = null;
        let foundCompleted = null;
        for (const r of data) {
          curr[r.id] = r.status;
          if (r.status === 'DECLINED' && prev[r.id] && prev[r.id] !== 'DECLINED') {
            foundNewDecline = r;
          }
          if (r.status === 'COMPLETED' && prev[r.id] && prev[r.id] !== 'COMPLETED') {
            foundCompleted = r;
          }
        }
        sessionStorage.setItem('bc_prev_res_status', JSON.stringify(curr));
        if (foundNewDecline) {
          setDeclinedNotice({ id: foundNewDecline.id, slot: foundNewDecline.slot, barberId: foundNewDecline.barberId });
          try { sessionStorage.setItem('bc_last_declined', JSON.stringify(foundNewDecline)); } catch {}
        }
        if (foundCompleted) {
          // Before showing rating, ensure not already rated
          try {
            const existing = await getMyRatingForReservation(foundCompleted.id, user.id);
            if (!existing) {
              setRateTarget({ reservationId: foundCompleted.id, barberId: foundCompleted.barberId });
              setRateValue(5);
              setRateFeedback('');
              setRateError('');
            } else {
              setRatedMap(prev => ({ ...prev, [foundCompleted.id]: true }));
            }
          } catch {}
        }
      } catch {}

      // Refresh rated map for all completed reservations (best-effort)
      try {
        const completed = (data || []).filter(r => r.status === 'COMPLETED');
        const checks = await Promise.all(completed.map(async r => {
          try {
            const ex = await getMyRatingForReservation(r.id, user.id);
            return [r.id, !!ex];
          } catch { return [r.id, false]; }
        }));
        const map = { ...ratedMap };
        for (const [id, flag] of checks) if (flag) map[id] = true;
        setRatedMap(map);
      } catch {}
    } catch (err) {
      setError(err.message || 'Failed to load reservations');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCancel = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }
    try {
      await cancelReservation(reservationId);
      // Refresh the list
      await loadReservations();
    } catch (err) {
      alert(err.message || 'Failed to cancel reservation');
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatBooked = (createdAt) => {
    if (!createdAt) return '—';
    const d = new Date(createdAt);
    return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { label: 'Pending', color: '#f59e0b', icon: '⏳' },
      APPROVED: { label: 'Approved', color: '#10b981', icon: '✓' },
      IN_PROGRESS: { label: 'In Progress', color: '#3b82f6', icon: '⚡' },
      COMPLETED: { label: 'Completed', color: '#10b981', icon: '✓' },
      DECLINED: { label: 'Declined', color: '#ef4444', icon: '✗' },
      CANCELLED: { label: 'Cancelled', color: '#6b7280', icon: '✕' }
    };
    return badges[status] || badges.PENDING;
  };

  if (!user) {
    return (
      <div className="home">
        <div className="bc-container">
          <div className="panel">
            <h2 className="selection-title">My Reservations</h2>
            <p className="muted" style={{ textAlign: 'center' }}>Redirecting to sign in...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="home">
        <div className="bc-container">
          <div className="panel">
            <h2 className="selection-title">My Reservations</h2>
            <p className="muted" style={{ textAlign: 'center' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      <div className="bc-container">
        <div className="panel">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 className="selection-title" style={{ marginBottom: '8px' }}>My Reservations</h2>
            <p className="muted">Welcome, {user?.username || ''}</p>
          </div>
          {/* Tab Selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
            <button
              onClick={() => setTab('reservations')}
              className="btn sm"
              style={{
                borderRadius: 14,
                padding: '8px 14px',
                background: tab === 'reservations' ? '#ffffff' : '#2a2f36',
                color: tab === 'reservations' ? '#111827' : '#e5e7eb',
                border: '1px solid #3b4148'
              }}
            >Reservations</button>
            <button
              onClick={() => setTab('reviews')}
              className="btn sm"
              style={{
                borderRadius: 14,
                padding: '8px 14px',
                background: tab === 'reviews' ? '#ffffff' : '#2a2f36',
                color: tab === 'reviews' ? '#111827' : '#e5e7eb',
                border: '1px solid #3b4148'
              }}
            >My Reviews</button>
          </div>
          {error && tab === 'reservations' && <p className="error">{error}</p>}
          
          {tab === 'reviews' ? (
            <div>
              {loadingReviews ? (
                <p className="muted" style={{ textAlign: 'center' }}>Loading reviews…</p>
              ) : reviews.length === 0 ? (
                <p className="muted" style={{ textAlign: 'center' }}>You haven't submitted any reviews yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {reviews.map((rev, idx) => (
                    <div key={idx} style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 16, background: 'var(--color-surface)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        {(() => {
                          const b0 = barberMap[rev.barberId];
                          const b = b0 || Object.values(barberMap).find(x => x?.username === rev.barberName || x?.name === rev.barberName);
                          return (
                          <>
                            <div
                              className="avatar"
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                background: 'var(--color-surface-2)',
                                backgroundImage: b?.avatarUrl
                                  ? `url(${mediaUrl(b.avatarUrl)})`
                                  : (rev.barberAvatarUrl ? `url(${mediaUrl(rev.barberAvatarUrl)})` : undefined),
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: 700 }}>Barber: {b?.name || rev.barberName || 'Unknown'} ✂️</div>
                              <div className="muted" style={{ fontSize: 12 }}>Rated on {formatReviewDate(rev.createdAt)}</div>
                            </div>
                          </>
                        ); })()}
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <ReviewStars value={rev.rating} />
                      </div>
                      {rev.feedback && (
                        <div style={{ fontStyle: 'italic', color: '#d1d5db', marginBottom: 8 }}>
                          "{rev.feedback}"
                        </div>
                      )}
                      {rev.reply && (
                        <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: '2px solid #10b981' }}>
                          <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 4 }}>→ Barber reply:</div>
                          <div style={{ color: '#e5e7eb' }}>{rev.reply}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
          <div>
          {declinedNotice && (
            <div className="notice" style={{ background:'#fff7ed', border:'1px solid #fed7aa', padding:'12px 14px', borderRadius:8, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <div style={{ color:'#9a3412' }}>
                  The barber declined your request for {new Date(declinedNotice.slot).toLocaleString()}. Please choose another time.
                </div>
                <button
                  className="btn btn-secondary sm"
                  onClick={() => {
                    try { sessionStorage.setItem('bc_rebook_from_decline', JSON.stringify({ barberId: declinedNotice.barberId })); } catch {}
                    navigate('/select-slot');
                  }}
                >Find another time</button>
              </div>
            </div>
          )}
          
          {reservations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap: 12 }}>
                <p className="muted" style={{ margin: 0 }}>You haven't made any reservations yet.</p>
                <button className="btn btn-primary sm" onClick={() => navigate('/services')}>Make a reservation</button>
              </div>
            </div>
          ) : (
            <div className="reservations-grid">
              {reservations.map((res) => {
                const badge = getStatusBadge(res.status);
                return (
                  <div key={res.id} className="reservation-card">
                    <div className="reservation-card__cols">
                      <div className="res-col">
                        <div className="res-col__title">{res.notes || 'Luxury Shave'}</div>
                        <ul className="res-list">
                          <li>🗓️ Date: {formatDate(res.slot)}</li>
                          <li>🕒 Time: {formatTime(res.slot)}</li>
                          <li>✂️ Duration: {res.serviceDurationMinutes ? `${res.serviceDurationMinutes} mins` : '—'}</li>
                          <li>💲 Price: $40</li>
                        </ul>
                      </div>
                      <div className="res-col res-col--center">
                        <div className="res-col__title">Barber</div>
                        {(() => { const b = barberMap[res.barberId]; return (
                          <>
                            <div
                              className="avatar lg"
                              style={{ backgroundImage: b?.avatarUrl ? `url(${mediaUrl(b.avatarUrl)})` : undefined, backgroundSize:'cover', backgroundPosition:'center' }}
                            />
                            <div className="reservation-card__barber-name">{b?.name || res.barberId || 'Barber'}</div>
                            <div className="muted" style={{ fontSize: 12 }}>{b?.bio || 'every bro deserves a fresh cut'}</div>
                          </>
                        ); })()}
                      </div>
                      <div className="res-col">
                        <div className="res-col__title">Status</div>
                        <ul className="res-list">
                          <li>🧾 Date booked: {formatBooked(res.createdAt)}</li>
                        </ul>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <div className="res-status" style={{ color: badge.color }}>
                            {badge.label}{res.status === 'PENDING' ? '...' : ''}
                          </div>
                          {res.status === 'APPROVED' && new Date(res.slot).getTime() > Date.now() && (
                            <Countdown startIso={res.slot} serviceDuration={res.serviceDurationMinutes} badge />
                          )}
                          {res.status === 'IN_PROGRESS' && (
                            <Countdown startIso={res.slot} serviceDuration={res.serviceDurationMinutes} badge />
                          )}
                          {res.status === 'COMPLETED' && (
                            <div style={{ display:'flex', gap:8, alignItems:'center', marginTop: 6 }}>
                              <div style={{ padding: '4px 8px', borderRadius: 6, backgroundColor: '#10b981', color: '#ffffff', fontWeight: 700 }}>
                                ✓ Service Done
                              </div>
                              {ratedMap[res.id] ? (
                                <button className="btn sm" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>Rated</button>
                              ) : (
                                <button
                                  className="btn btn-primary sm"
                                  onClick={async () => {
                                    try {
                                      const existing = await getMyRatingForReservation(res.id, user.id);
                                      if (!existing) {
                                        setRateTarget({ reservationId: res.id, barberId: res.barberId });
                                        setRateValue(5);
                                        setRateFeedback('');
                                        setRateError('');
                                      } else {
                                        setRatedMap(prev => ({ ...prev, [res.id]: true }));
                                      }
                                    } catch (e) {
                                      alert(e.message || 'Unable to start rating');
                                    }
                                  }}
                                >Rate now</button>
                              )}
                            </div>
                          )}
                        </div>
                        {res.status === 'PENDING' && (
                          <button
                            className="btn btn-secondary sm"
                            onClick={() => handleCancel(res.id)}
                          >Cancel</button>
                        )}
                        {res.status === 'DECLINED' && (
                          <button
                            className="btn btn-secondary sm"
                            onClick={() => {
                              try { sessionStorage.setItem('bc_rebook_from_decline', JSON.stringify({ barberId: res.barberId })); } catch {}
                              navigate('/select-slot');
                            }}
                          >Find another time</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
          )}
        </div>
      </div>
      {/* Rating Modal */}
      <RatingModal
        open={!!rateTarget}
        onClose={() => setRateTarget(null)}
        onSubmit={submitRating}
        value={rateValue}
        setValue={setRateValue}
        feedback={rateFeedback}
        setFeedback={setRateFeedback}
        submitting={rateSubmitting}
        error={rateError}
      />
    </div>
  );
}

function Star({ filled, onClick, onMouseEnter, onMouseLeave }) {
  return (
    <span
      style={{ cursor:'pointer', color: filled ? '#facc15' : '#9ca3af', fontSize: 24 }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >★</span>
  );
}

function ReviewStars({ value = 0 }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    let ch = '☆';
    if (i <= full) ch = '★';
    else if (i === full + 1 && hasHalf) ch = '★';
    stars.push(<span key={i} style={{ color: '#facc15', fontSize: 18 }}>{ch}</span>);
  }
  return <span>{stars}</span>;
}

function formatReviewDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

// Rating Modal (inline for simplicity)
export function RatingModal({ open, onClose, onSubmit, value, setValue, feedback, setFeedback, submitting, error }) {
  const [hover, setHover] = React.useState(0);
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'#1f2937', color:'#e5e7eb', width:'100%', maxWidth:420, borderRadius:12, padding:16, border:'1px solid #374151' }}>
        <h3 style={{ marginTop:0 }}>Rate your barber</h3>
        <p className="muted" style={{ marginTop:0 }}>How was your experience?</p>
        <div style={{ display:'flex', gap:6, margin:'8px 0 12px' }}>
          {[1,2,3,4,5].map(n => (
            <Star
              key={n}
              filled={(hover || value) >= n}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setValue(n)}
            />
          ))}
          <div style={{ marginLeft:8, fontWeight:700, color:'#facc15' }}>{(value || 0).toFixed(1)} ⭐</div>
        </div>
        <textarea
          rows={4}
          placeholder="Optional feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          style={{ width:'100%', resize:'vertical', borderRadius:8, border:'1px solid #374151', background:'#111827', color:'#e5e7eb', padding:8 }}
        />
        {error && <div className="error" style={{ marginTop:8 }}>{error}</div>}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
          <button className="btn btn-secondary sm" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary sm" onClick={onSubmit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</button>
        </div>
      </div>
    </div>
  );
}

export default MyReservations;