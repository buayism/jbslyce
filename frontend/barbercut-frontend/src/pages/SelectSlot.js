import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { createReservation, getSlotsForBarber, mediaUrl } from '../lib/api';

function SelectSlot() {
  const navigate = useNavigate();
  const { service, barber, slot, selectSlot, setPendingBooking } = useBooking();
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingInfo, setPendingInfo] = useState(null);

  // Load real slots for selected barber (with polling)
  useEffect(() => {
    const barberKey = barber?.id || barber?.barberId;
    // Load last pending reservation info for this barber (if any)
    try {
      const raw = sessionStorage.getItem('bc_last_pending_reservation');
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.barberId === barberKey) {
          setPendingInfo(obj);
        } else {
          setPendingInfo(null);
        }
      } else {
        setPendingInfo(null);
      }
    } catch {}
    const load = async () => {
      if (!barberKey) return;
      try {
        setLoading(true);
        setError('');
        const data = await getSlotsForBarber(barberKey);
        setSlots(data);
        // If we had a pending reservation for this barber and its slot is now visible, clear pending info
        try {
          const raw = sessionStorage.getItem('bc_last_pending_reservation');
          if (raw) {
            const obj = JSON.parse(raw);
            const reappeared = data.find(s => new Date(s.start).toISOString() === obj.slotISO);
            if (reappeared) {
              sessionStorage.removeItem('bc_last_pending_reservation');
              setPendingInfo(null);
              // Optionally auto-select the reappeared slot to help the user rebook quickly
              setSelected(reappeared);
              selectSlot(new Date(reappeared.start).toLocaleString());
            }
          }
        } catch {}
        // try restore saved slot by ISO
        try {
          const saved = sessionStorage.getItem('bc_pending_booking');
          if (saved) {
            const pb = JSON.parse(saved);
            if (pb?.slotISO) {
              const found = data.find(s => new Date(s.start).toISOString() === pb.slotISO);
              if (found) {
                setSelected(found);
                selectSlot(new Date(found.start).toLocaleString());
              }
            }
          }
        } catch {}
      } catch (e) {
        setError(e.message || 'Failed to load slots');
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 5000);
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, [barber?.id, barber?.barberId]);

  const summary = useMemo(() => {
    if (!service) return null;
    return [
      `- service: ${service.name}`,
      `- Duration: ${service.duration}`,
      `- Price: $${Number(service.price).toLocaleString()}`
    ];
  }, [service]);

  const onPick = (slotObj) => {
    setSelected(slotObj);
    const label = new Date(slotObj.start).toLocaleString();
    selectSlot(label);
  };

  // Helper function to extract duration in minutes from service duration string
  const parseDuration = (durationStr) => {
    if (!durationStr) return 40; // default
    
    // Parse strings like "30–45m", "15–30m", "45m"
    const match = durationStr.match(/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 40; // default fallback
  };

  const onConfirm = async () => {
    if (!selected) return;
    
    // Extract duration from service
    const durationMinutes = parseDuration(service?.duration);
    
    const pending = {
      barberId: barber?.id || barber?.barberId,
      slotLabel: new Date(selected.start).toLocaleString(),
      slotISO: new Date(selected.start).toISOString(),
      notes: service?.name || '',
      serviceName: service?.name || '',
      serviceDurationMinutes: durationMinutes
    };
    if (!user) {
      setPendingBooking(pending);
      try { sessionStorage.setItem('bc_pending_booking', JSON.stringify(pending)); } catch {}
      try { sessionStorage.setItem('bc_post_login_redirect', '/select-slot'); } catch {}
      navigate('/signin');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const created = await createReservation({
        barberId: pending.barberId,
        clientId: user.id,
        slotISO: pending.slotISO,
        notes: pending.notes,
        serviceName: pending.serviceName,
        serviceDurationMinutes: pending.serviceDurationMinutes
      });
      // After booking, clear saved and reload slots to reflect taken slot
      try { sessionStorage.removeItem('bc_pending_booking'); } catch {}
      try { sessionStorage.setItem('bc_last_pending_reservation', JSON.stringify({ id: created.id, barberId: pending.barberId, slotISO: pending.slotISO })); } catch {}
      navigate('/booking-success');
    } catch (e) {
      setError(e.message || 'Failed to book');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="home">
      <div className="bc-container">
        <div className="panel slot-layout">
          <aside className="summary">
            <h3>Booking Summary</h3>
            {summary ? (
              <>
                <ul>
                  {summary.map((line, i) => (<li key={i}>{line}</li>))}
                </ul>
                <div className="barber-summary">
                  <div className="avatar lg" style={{ backgroundImage: barber?.avatarUrl ? `url(${mediaUrl(barber.avatarUrl)})` : undefined, backgroundSize:'cover', backgroundPosition:'center' }} />
                  <div>
                    <div className="barber-summary__name">{barber ? barber.name : 'Select a barber'}</div>
                    {barber?.bio && <div className="muted" style={{ marginTop: 4 }}>{barber.bio}</div>}
                  </div>
                </div>
              </>
            ) : (
              <p className="muted">Pick a service to start.</p>
            )}
          </aside>

          <section className="selection">
            <h2 className="selection-title">3. Select Available Time Slot</h2>
            {pendingInfo && (
              <div className="notice" style={{ background:'#eff6ff', border:'1px solid #bfdbfe', padding:'10px 12px', borderRadius:8, marginBottom:12 }}>
                <div style={{ color:'#1d4ed8' }}>
                  Awaiting barber approval for {new Date(pendingInfo.slotISO).toLocaleString()}. We'll update when it's decided.
                </div>
              </div>
            )}
            {loading ? (
              <p className="muted">Loading slots…</p>
            ) : slots.length === 0 ? (
              <p className="muted">No available slots for this barber yet. Please check back later.</p>
            ) : (
              <div className="slot-section">
                <div className="slot-row" style={{ flexWrap:'wrap' }}>
                  {slots
                    .filter(s => new Date(s.start).getTime() > Date.now())
                    .map(s => {
                      const label = new Date(s.start).toLocaleString();
                      const isActive = selected && new Date(selected.start).toISOString() === new Date(s.start).toISOString();
                      return (
                        <button
                          key={s.id}
                          className={`slot ${isActive ? 'active' : ''}`}
                          onClick={() => onPick(s)}
                        >
                          {label}
                          {isActive && <span className="check" aria-hidden>✓</span>}
                        </button>
                      );
                  })}
                </div>
              </div>
            )}

            {error && <p className="error">{error}</p>}
            <div className="next-cta">
              <button className="btn btn-primary next" disabled={!selected || saving} onClick={onConfirm}>{saving ? 'Booking…' : 'Review & Confirm'}</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default SelectSlot;
