import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { getBarbers, mediaUrl, getSlotsForBarber, getClientReservations, getBarberAverageRating } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function SelectBarber() {
  const navigate = useNavigate();
  const { service, selectBarber } = useBooking();
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [counts, setCounts] = useState({});
  const [freq, setFreq] = useState({});
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getBarbers();
        // fetch available slot counts per barber in parallel
        const entries = await Promise.all(
          data.map(async (b) => {
            try {
              const barberKey = b.id || b.barberId;
              const slots = await getSlotsForBarber(barberKey);
              const count = Array.isArray(slots)
                ? slots.filter(s => new Date(s.start).getTime() > Date.now()).length
                : 0;
              return [b.id, count];
            } catch {
              return [b.id, 0];
            }
          })
        );
        const map = {};
        for (const [k,v] of entries) map[k] = v;
        setCounts(map);

        const ratingEntries = await Promise.all(
          data.map(async (b) => {
            try {
              const r = await getBarberAverageRating(b.id);
              return [b.id, r];
            } catch {
              return [b.id, { average: 0, count: 0 }];
            }
          })
        );
        const rmap = {};
        for (const [k,v] of ratingEntries) rmap[k] = v;
        setRatings(rmap);

        // Familiarity based on client's booking history
        let f = {};
        if (user && user.role === 'CLIENT') {
          try {
            const resv = await getClientReservations(user.id || user.username);
            for (const r of Array.isArray(resv) ? resv : []) {
              if (r.barberId) f[r.barberId] = (f[r.barberId] || 0) + 1;
            }
          } catch {}
        }
        setFreq(f);

        // Sort barbers: by familiarity desc, then by available slots desc, then by name asc
        const sorted = [...data].sort((a, b) => {
          const fa = f[a.id] || 0; const fb = f[b.id] || 0;
          if (fb !== fa) return fb - fa;
          const ca = map[a.id] || 0; const cb = map[b.id] || 0;
          if (cb !== ca) return cb - ca;
          return (a.name || '').localeCompare(b.name || '');
        });
        setBarbers(sorted);
      } catch (e) {
        setError(e.message || 'Failed to load barbers');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Periodically refresh slot counts to reflect expiring slots
  useEffect(() => {
    let stop = false;
    const refreshCounts = async () => {
      try {
        const data = await getBarbers();
        const entries = await Promise.all(
          data.map(async (b) => {
            try {
              const barberKey = b.id || b.barberId;
              const slots = await getSlotsForBarber(barberKey);
              const count = Array.isArray(slots)
                ? slots.filter(s => new Date(s.start).getTime() > Date.now()).length
                : 0;
              return [b.id, count];
            } catch {
              return [b.id, 0];
            }
          })
        );
        if (!stop) {
          const map = {};
          for (const [k,v] of entries) map[k] = v;
          setCounts(map);
        }
      } catch {}
    };
    const iv = setInterval(refreshCounts, 5000);
    return () => { stop = true; clearInterval(iv); };
  }, []);

  const handleSelect = (b) => {
    setSelectedId(b.id);
    selectBarber(b);
    navigate('/select-slot');
  };

  const summary = useMemo(() => {
    if (!service) return null;
    return [
      `- service: ${service.name}`,
      `- Duration: ${service.duration}`,
      `- Price: $${Number(service.price).toLocaleString()}`
    ];
  }, [service]);

  const onNext = () => {
    navigate('/select-slot');
  };

  return (
    <div className="home">
      <div className="bc-container">
        <button className="back-btn" onClick={() => navigate('/services')}>← Back</button>
        <div className="panel select-layout">
          <aside className="summary">
            <h3>Booking Summary</h3>
            {summary ? (
              <ul>
                {summary.map((line, i) => (<li key={i}>{line}</li>))}
              </ul>
            ) : (
              <p className="muted">Pick a service to start.</p>
            )}
          </aside>

          <section className="selection">
            <h2 className="selection-title">Select Barber</h2>
            {loading ? (
              <p className="muted">Loading barbers…</p>
            ) : error ? (
              <p className="error">{error}</p>
            ) : barbers.length === 0 ? (
              <p className="muted">No barbers available yet.</p>
            ) : (
              <div className="barber-grid">
                {barbers.map(b => (
                  <div
                    key={b.id}
                    className={`card clickable barber-card ${selectedId === b.id ? 'active' : ''}`}
                    style={{ position:'relative' }}
                    onClick={() => handleSelect(b)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(b); } }}
                  >
                    <div className="avatar" style={{ backgroundImage: b.avatarUrl ? `url(${mediaUrl(b.avatarUrl)})` : undefined, backgroundSize:'cover', backgroundPosition:'center' }} />
                    <div style={{ position:'absolute', right:8, top:8, background:'var(--color-surface-2)', color:'var(--color-brand-600)', border:'1px solid var(--color-brand-600)', borderRadius:12, padding:'2px 8px', fontWeight:700 }}>
                      {counts[b.id] ?? 0}
                    </div>
                    <div className="barber-name">{b.name}</div>
                    <div className="barber-role muted">{b.bio || 'Barber'}</div>
                    <div className="muted" style={{ marginTop: 4, fontWeight:700, color:'#facc15' }}>
                      {((ratings[b.id]?.average ?? 0).toFixed(1))} ⭐
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="selection-note muted">Click a barber to continue</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default SelectBarber;
