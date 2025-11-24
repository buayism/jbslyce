import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { createSlot, getSlotsForBarber, getReservationsForBarberAll, getBarbers, mediaUrl, deleteSlot, getBarberRatingSummary, getBarberAverageRating } from '../lib/api';

function Home() {
  const navigate = useNavigate();
  const { selectService } = useBooking();
  const { user } = useAuth();
  const [slotForm, setSlotForm] = useState({ date: '', time: '', duration: 30 });
  const [slots, setSlots] = useState([]);
  const [sLoading, setSLoading] = useState(false); // loading existing slots
  const [creating, setCreating] = useState(false); // creating a new slot
  const [sError, setSError] = useState('');
  const [homeBarbers, setHomeBarbers] = useState([]);
  const [hbLoading, setHbLoading] = useState(false);
  const [hbError, setHbError] = useState('');
  const [reservations, setReservations] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [toast, setToast] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const fmt2 = (n) => (n < 10 ? `0${n}` : String(n));
  const todayLocal = (() => { const d = new Date(); const y = d.getFullYear(); const m = fmt2(d.getMonth() + 1); const dd = fmt2(d.getDate()); return `${y}-${m}-${dd}`; })();
  const currentHHMM = () => { const d = new Date(); return `${fmt2(d.getHours())}:${fmt2(d.getMinutes())}`; };
  const toYMD = (d) => `${d.getFullYear()}-${fmt2(d.getMonth() + 1)}-${fmt2(d.getDate())}`;
  const toHHMM = (d) => `${fmt2(d.getHours())}:${fmt2(d.getMinutes())}`;
  const [timeMin, setTimeMin] = useState('00:00');
  const timeRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.barberId) return;
      try {
        setSLoading(true);
        setSError('');
        const [slotData, resvData] = await Promise.all([
          getSlotsForBarber(user.barberId),
          getReservationsForBarberAll(user.barberId).catch(() => [])
        ]);
        setSlots(slotData);
        setReservations(resvData || []);
      } catch (e) {
        setSError(e.message || 'Failed to load slots');
      } finally {
        setSLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 5000);
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, [user?.barberId]);

  useEffect(() => {
    if (!slotForm.date) setSlotForm(prev => ({ ...prev, date: todayLocal }));
  }, [todayLocal]);

  // If user selects today, ensure time is not in the past
  useEffect(() => {
    const nowHHMM = currentHHMM();
    if (slotForm.date === todayLocal && slotForm.time && slotForm.time < nowHHMM) {
      setSlotForm(prev => ({ ...prev, time: nowHHMM }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotForm.date]);

  // Compute next available start time for selected date based on existing slots
  useEffect(() => {
    const selected = slotForm.date || todayLocal;
    let maxEnd = '00:00';
    for (const s of slots) {
      const ds = new Date(s.end);
      if (toYMD(ds) === selected) {
        const hhmm = toHHMM(ds);
        if (hhmm > maxEnd) maxEnd = hhmm;
      }
    }
    let minVal = maxEnd;
    if (selected === todayLocal) {
      const nowHHMM = currentHHMM();
      if (nowHHMM > minVal) minVal = nowHHMM;
    }
    setTimeMin(minVal || '00:00');
    // Auto-adjust picked time if it is below min
    if (slotForm.time && slotForm.time < minVal) {
      setSlotForm(prev => ({ ...prev, time: minVal }));
    }
    // If no time selected, default to min and focus time input
    if (!slotForm.time && minVal) {
      setSlotForm(prev => ({ ...prev, time: minVal }));
      // focus after microtask
      setTimeout(() => { try { timeRef.current && timeRef.current.focus(); } catch { } }, 0);
    }
  }, [slots, slotForm.date]);

  // Profile editing moved to My Profile page

  // Load real barbers for client home section
  useEffect(() => {
    const loadBarbers = async () => {
      try {
        setHbLoading(true);
        setHbError('');
        const bs = await getBarbers();
        // Prefer server-provided rating summary if present
        const prime = bs.map(b => ({
          ...b,
          ratingAvg: (typeof b.ratingAverage === 'number') ? b.ratingAverage : undefined,
          ratingCount: (typeof b.ratingCount === 'number') ? b.ratingCount : undefined
        }));
        // Fetch only for those missing
        const enriched = await Promise.all(prime.map(async b => {
          if (typeof b.ratingAvg === 'number' && typeof b.ratingCount === 'number') return b;
          try {
            const r = await getBarberAverageRating(b.id);
            return { ...b, ratingAvg: r?.average || 0, ratingCount: r?.count || 0 };
          } catch {
            try {
              const s = await getBarberRatingSummary(b.id);
              return { ...b, ratingAvg: s?.averageRating || 0, ratingCount: s?.reviewCount || 0 };
            } catch {
              return { ...b, ratingAvg: 0, ratingCount: 0 };
            }
          }
        }));
        setHomeBarbers(enriched);
      } catch (e) {
        setHbError(e.message || 'Failed to load barbers');
      } finally {
        setHbLoading(false);
      }
    };
    loadBarbers();
    // Refresh barbers list every 10 seconds
    const interval = setInterval(loadBarbers, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePick = (service) => {
    selectService(service);
    navigate('/select-barber');
  };

  const handleDeleteSlot = async (slotId, hasReservation) => {
    if (!hasReservation && !window.confirm('Are you sure you want to delete this slot?')) {
      return;
    }

    if (hasReservation) {
      if (!window.confirm('This slot has a reservation. Deleting it will make the slot unavailable for new bookings. Continue?')) {
        return;
      }
    }

    try {
      await deleteSlot(slotId);
      setSlots(prev => prev.filter(s => s.id !== slotId));
    } catch (err) {
      alert(err.message || 'Failed to delete slot');
    }
  };

  if (user?.role === 'BARBER') {
    return (
      <div className="home">
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        )}
        <section
          className="hero"
          style={{
            position: 'relative',
            minHeight: 320,
            backgroundImage: `url(${process.env.PUBLIC_URL || ''}/hero.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="hero__overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45))' }} />
          <div className="hero__content bc-container" style={{ position: 'relative', zIndex: 1, padding: '60px 0', textAlign: 'center', color: '#fff' }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, textShadow: '0 2px 6px rgba(0,0,0,.5)' }}>Welcome back {user.username}</h1>
            <p style={{ fontSize: 18, opacity: .95, marginBottom: 16 }}>Manage your schedule and client requests.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <a href="/#slots" className="btn btn-primary" style={{ background: '#f97316', borderColor: '#ea580c', color: '#111827', fontWeight: 700, padding: '10px 18px', borderRadius: 10 }}>Create Slots</a>
              <Link to="/barber/dashboard" className="btn btn-secondary" style={{ padding: '10px 18px', borderRadius: 10 }}>View Pending Reservations</Link>
            </div>
          </div>
        </section>

        <section className="bc-container" style={{ paddingTop: 24 }}>
          <div className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="selection-title" style={{ marginBottom: 0 }}>Quick Actions</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href="/#slots" className="btn btn-primary sm">Create Slots</a>
                <Link to="/barber/dashboard" className="btn btn-secondary sm">Pending</Link>
              </div>
            </div>
          </div>
        </section>

        <section id="slots" className="bc-container" style={{ scrollMarginTop: '80px' }}>
          <div className="panel">
            <h2 className="selection-title">Create Slots</h2>
            <p className="muted">Define your available time slots so clients can book you.</p>

            {!user?.barberId && (
              <div className="auth-error" style={{ marginBottom: 12 }}>
                Your account has no barberId. Please sign up again as a Barber and provide a Barber ID, or contact admin.
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!user?.barberId) return;
                try {
                  setCreating(true);
                  setSError('');
                  const sel = new Date(`${slotForm.date}T00:00:00`);
                  const nowd = new Date(); nowd.setHours(0, 0, 0, 0);
                  if (sel < nowd) { setSError('Date cannot be in the past.'); setCreating(false); return; }
                  const startLocal = new Date(`${slotForm.date}T${slotForm.time}:00`);
                  const now = new Date();
                  if (startLocal < now) { setSError('Time cannot be in the past.'); setCreating(false); return; }
                  // Overlap guard: start must be >= next available (timeMin)
                  const minCheck = new Date(`${slotForm.date}T${timeMin}:00`);
                  if (startLocal < minCheck) { setSError(`Start time must be at or after ${timeMin} due to an existing slot.`); setCreating(false); return; }
                  const startISO = new Date(`${slotForm.date}T${slotForm.time}:00`).toISOString();
                  const created = await createSlot({ barberId: user.barberId, startISO, durationMinutes: Number(slotForm.duration) });
                  // optimistic update: append and sort by start
                  setSlots(prev => {
                    const next = [...prev, created];
                    next.sort((a, b) => new Date(a.start) - new Date(b.start));
                    return next;
                  });
                  // Show success toast
                  setToast({ type: 'success', message: '✓ Slot created successfully!' });
                  setTimeout(() => setToast(null), 3000);
                  // Move picker to the next available time (end of created)
                  const nextTime = toHHMM(new Date(created.end));
                  setSlotForm(prev => ({ ...prev, time: nextTime }));
                  setTimeout(() => { try { timeRef.current && timeRef.current.focus(); } catch { } }, 0);
                } catch (err) {
                  setSError(err.message || 'Failed to create slot');
                } finally {
                  setCreating(false);
                }
              }}
              className="auth-form"
              style={{ marginBottom: 16 }}
            >
              {sError && <div className="auth-error" style={{ marginBottom: 12 }}>{sError}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                <label>
                  <span>Date</span>
                  <input type="date" name="date" value={slotForm.date}
                    min={todayLocal}
                    onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })} required disabled={!user?.barberId} />
                </label>
                <label>
                  <span>Start Time</span>
                  <input ref={timeRef} type="time" name="time" value={slotForm.time}
                    min={timeMin}
                    onChange={(e) => setSlotForm({ ...slotForm, time: e.target.value })} required disabled={!user?.barberId} />
                </label>
                <label>
                  <span>Duration (mins)</span>
                  <input type="number" min="5" step="5" name="duration" value={slotForm.duration}
                    onChange={(e) => setSlotForm({ ...slotForm, duration: e.target.value })} required disabled={!user?.barberId} />
                </label>
                <div style={{ alignSelf: 'end' }}>
                  <button className="btn btn-primary" type="submit" disabled={!user?.barberId || creating || !slotForm.date || !slotForm.time}>
                    {creating ? 'Creating…' : 'Add Slot'}
                  </button>
                </div>
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Next available start: {timeMin}</div>
            </form>

            <div>
              <h3 style={{ marginTop: 16 }}>Your Slots</h3>
              {sLoading && slots.length === 0 ? (
                <p className="muted">Loading slots…</p>
              ) : slots.length === 0 ? (
                <p className="muted">No slots yet. Create your first slot above.</p>
              ) : (
                <div className="slots-grid">
                  {slots.map(s => {
                    const match = reservations.find(r => new Date(r.slot).toISOString() === new Date(s.start).toISOString());
                    const startDate = new Date(s.start);
                    const endDate = new Date(s.end);
                    const hasReservation = !!match;
                    const isAvailable = !hasReservation;
                    return (
                      <div key={s.id} className="slot-card" onClick={() => !hasReservation && setEditingSlot(s)}>
                        <div className="slot-card__header">
                          <div className="slot-card__time">
                            <div className="slot-time-main">{startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="slot-time-sub">{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                          </div>
                          <span className={`slot-status-badge ${isAvailable ? 'available' : 'booked'}`}>
                            {isAvailable ? '● Available' : '● Booked'}
                          </span>
                        </div>
                        <div className="slot-card__body">
                          <div className="slot-info-row">
                            <span className="muted">Duration:</span>
                            <span>{Math.round((endDate - startDate) / 60000)} mins</span>
                          </div>
                          {match && match.clientUsername && (
                            <div className="slot-info-row">
                              <span className="muted">Client:</span>
                              <span>{match.clientUsername}</span>
                            </div>
                          )}
                        </div>
                        <div className="slot-card__actions">
                          <button
                            className="btn btn-secondary sm"
                            onClick={(e) => { e.stopPropagation(); handleDeleteSlot(s.id, hasReservation); }}
                            title="Delete slot"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Profile section removed; use My Profile page */}
      </div>
    );
  }

  return (
    <div className="home">
      <section
        className="hero"
        style={{
          position: 'relative',
          minHeight: 360,
          backgroundImage: `url(${process.env.PUBLIC_URL || ''}/hero.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="hero__overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45))' }} />
        <div className="hero__content bc-container" style={{ position: 'relative', zIndex: 1, padding: '80px 0', textAlign: 'center', color: '#fff' }}>
          <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 10, textShadow: '0 3px 8px rgba(0,0,0,.55)' }}>Book your next Perfect Cut</h1>
          <p style={{ fontSize: 18, opacity: .95, marginBottom: 18 }}>online booking with your favorite local barbers</p>
          <Link to="/services" className="btn btn-primary" style={{ background: '#f97316', borderColor: '#ea580c', color: '#111827', fontWeight: 700, padding: '12px 28px', borderRadius: 12 }}>Book Now</Link>
        </div>
      </section>

      <section className="services bc-container">
        <h2>Our Services</h2>
        <div className="cards">
          <button className="card clickable" onClick={() => handlePick({ name: 'Classic Haircut', duration: '30–45m', price: 40 })}>
            <div className="card__icon" aria-hidden>✂️</div>
            <h3>Classic Haircut</h3>
            <p>30–45m</p>
            <span className="muted">From $40</span>
          </button>
          <button className="card card--accent clickable" onClick={() => handlePick({ name: 'Beard Trim', duration: '15–30m', price: 10 })}>
            <div className="card__icon" aria-hidden>🧔</div>
            <h3>Beard Trim</h3>
            <p>15–30m</p>
            <span className="muted">From $10</span>
          </button>
          <button className="card clickable" onClick={() => handlePick({ name: 'Luxury Shave', duration: '45m', price: 60 })}>
            <div className="card__icon" aria-hidden>🪒</div>
            <h3>Luxury Shave</h3>
            <p>45m</p>
            <span className="muted">From $60</span>
          </button>
        </div>
      </section>

      <section id="barbers" className="barbers bc-container">
        <h2>Meet Our Barbers</h2>
        {hbLoading ? (
          <p className="muted">Loading barbers…</p>
        ) : hbError ? (
          <p className="auth-error">{hbError}</p>
        ) : (
          <div className="barber-list">
            {homeBarbers.map(b => (
              <button
                key={b.id}
                className="card clickable barber-card"
                onClick={() => setSelectedBarber(b)}
                style={{ textAlign: 'center' }}
              >
                <div className="avatar" style={{ width: 96, height: 96, borderRadius: '50%', margin: '0 auto 10px', background: 'var(--color-surface-2)', border: '2px solid var(--color-border)', backgroundImage: b.avatarUrl ? `url(${mediaUrl(b.avatarUrl)})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <h4 style={{ marginBottom: 6 }}>{b.name}</h4>
                <p className="muted" style={{ marginBottom: 8 }}>{b.bio || 'Barber'}</p>
                <div style={{ color: '#facc15', fontWeight: 700 }}>
                  {(b.ratingAvg || 0).toFixed(1)} ⭐ <span className="muted" style={{ color: '#9ca3af', fontWeight: 400 }}>({b.ratingCount || 0} reviews)</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Barber modal */}
      {selectedBarber && (
        <div onClick={() => setSelectedBarber(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: 'var(--color-surface)', color: 'var(--color-ink)', borderRadius: 16, padding: 18, boxShadow: '0 20px 60px rgba(0,0,0,0.45)', border: '1px solid var(--color-border)' }}>
            <button onClick={() => setSelectedBarber(null)} className="btn sm" style={{ position: 'absolute', transform: 'translateY(-50%)', right: 12, top: 18 }}>×</button>
            <div style={{ textAlign: 'center', paddingTop: 12 }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', margin: '0 auto 10px', background: 'var(--color-surface-2)', border: '2px solid var(--color-border)', backgroundImage: selectedBarber.avatarUrl ? `url(${mediaUrl(selectedBarber.avatarUrl)})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <h3 style={{ margin: '8px 0 6px' }}>{selectedBarber.name} ✂️</h3>
              <p className="muted" style={{ margin: 0 }}>{selectedBarber.bio || 'Barber'}</p>
              <div style={{ marginTop: 10, fontWeight: 700, color: '#facc15' }}>
                {(selectedBarber.ratingAvg || 0).toFixed(1)} ⭐ <span className="muted" style={{ color: '#9ca3af', fontWeight: 400 }}>(based on {selectedBarber.ratingCount || 0} reviews)</span>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setSelectedBarber(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <section className="testimonials bc-container">
        <h2>Client Testimonials</h2>
        <div className="testimonials-grid">
          {[
            {
              id: 1,
              name: "Michael R.",
              text: "Absolutely the best fade I've had in years. The attention to detail is unmatched!",
              rating: 5,
              avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            },
            {
              id: 2,
              name: "David K.",
              text: "Great atmosphere and professional service. Booking online made it so convenient.",
              rating: 5,
              avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            },
            {
              id: 3,
              name: "James L.",
              text: "Found my new go-to barber. Highly recommend the luxury shave package!",
              rating: 5,
              avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            }
          ].map(t => (
            <div key={t.id} className="testimonial-card">
              <div className="testimonial-header">
                <img src={t.avatar} alt={t.name} className="testimonial-avatar" />
                <div className="testimonial-info">
                  <h4>{t.name}</h4>
                  <div className="testimonial-rating">{'⭐'.repeat(t.rating)}</div>
                </div>
              </div>
              <p className="testimonial-text">"{t.text}"</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
