import React, { useEffect, useMemo, useState } from 'react';

export default function Countdown({ startIso, emphasis = false, badge = false, serviceDuration = 40 }) {
  const startTs = useMemo(() => new Date(startIso).getTime(), [startIso]);
  const endTs = useMemo(() => startTs + (serviceDuration * 60 * 1000), [startTs, serviceDuration]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let raf;
    const tick = () => {
      setNow(Date.now());
      raf = setTimeout(tick, 1000);
    };
    tick();
    const onVis = () => { if (document.visibilityState === 'visible') setNow(Date.now()); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearTimeout(raf); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const diff = startTs - now;
  const elapsed = now - startTs;
  const remaining = endTs - now;
  
  if (isNaN(startTs)) return null;

  const format = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatServiceTime = (ms) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}m ${s}s`;
  };

  // Before service starts
  if (diff > 0) {
    const style = badge
      ? { display: 'inline-block', padding: '4px 8px', borderRadius: 6, backgroundColor: 'var(--color-brand)', color: 'var(--color-ink)', fontWeight: 700, border: '1px solid var(--color-brand-600)' }
      : (emphasis ? { color: 'var(--color-brand-600)', fontWeight: 700 } : { color: 'var(--color-muted)', fontWeight: 600 });

    return (
      <div className="countdown" style={{ marginTop: 6, ...style }} aria-live="polite">
        Starts in {format(diff)}
      </div>
    );
  }

  // After service ends
  if (remaining <= 0) {
    return (
      <div className="countdown" style={{ marginTop: 6, ...(badge ? { display: 'inline-block', padding: '4px 8px', borderRadius: 6, backgroundColor: 'var(--color-brand)', color: 'var(--color-ink)', fontWeight: 800, border: '1px solid var(--color-brand-600)' } : { color: 'var(--color-brand-600)', fontWeight: 700 }) }} aria-live="polite">
        Service Done
      </div>
    );
  }

  // During service (IN_PROGRESS)
  const style = badge
    ? { display: 'inline-block', padding: '4px 8px', borderRadius: 6, backgroundColor: 'var(--color-brand)', color: 'var(--color-ink)', fontWeight: 700, border: '1px solid var(--color-brand-600)' }
    : (emphasis ? { color: 'var(--color-brand-600)', fontWeight: 700 } : { color: 'var(--color-brand-600)', fontWeight: 600 });

  return (
    <div className="countdown" style={{ marginTop: 6, ...style }} aria-live="polite">
      In progress: {formatServiceTime(elapsed)}
    </div>
  );
}

