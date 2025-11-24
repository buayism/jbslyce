import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { API_BASE } from '../../lib/api';

export default function AdminDashboardHome() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [servicesMap, setServicesMap] = useState({}); // name -> price

  // Load last 7 days reservations (completed preferred)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const today = new Date();
        const from = new Date(today);
        from.setDate(today.getDate() - 6);
        const fmt = (d) => d.toISOString().slice(0, 10);
        // Try to prefer COMPLETED for analytics; if backend ignores status, we'll still get data
        const url = `${API_BASE}/api/admin/reservations?sortBy=date&status=COMPLETED&dateFrom=${fmt(from)}&dateTo=${fmt(today)}`;
        const [res, svc] = await Promise.all([
          fetch(url),
          fetch(`${API_BASE}/api/services`).catch(() => null)
        ]);
        if (!res.ok) throw new Error('Failed to load analytics data');
        const data = await res.json();
        setReservations(Array.isArray(data) ? data : []);
        if (svc && svc.ok) {
          const list = await svc.json();
          const map = {};
          if (Array.isArray(list)) {
            for (const s of list) {
              if (s && s.name) map[s.name] = Number(s.price) || 0;
            }
          }
          setServicesMap(map);
        } else {
          setServicesMap({});
        }
      } catch (e) {
        setError(e.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Build week day labels for the last 7 days (oldest -> newest)
  const weekDays = useMemo(() => {
    const arr = [];
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const base = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      arr.push({ key: d.toISOString().slice(0,10), label: dayNames[d.getDay()] });
    }
    return arr;
  }, []);

  // Aggregate: reservations per day (count)
  const weeklyCountsData = useMemo(() => {
    const map = Object.create(null);
    for (const r of reservations) {
      const key = r.slot ? new Date(r.slot).toISOString().slice(0,10) : null;
      if (!key) continue;
      map[key] = (map[key] || 0) + 1;
    }
    return weekDays.map(d => ({ day: d.label, count: map[d.key] || 0 }));
  }, [reservations, weekDays]);

  // Aggregate: revenue per day using service prices
  const weeklyRevenueData = useMemo(() => {
    const map = Object.create(null);
    for (const r of reservations) {
      const key = r.slot ? new Date(r.slot).toISOString().slice(0,10) : null;
      if (!key) continue;
      const price = servicesMap[r.serviceName] || 0;
      map[key] = (map[key] || 0) + price;
    }
    return weekDays.map(d => ({ day: d.label, revenue: map[d.key] || 0 }));
  }, [reservations, servicesMap, weekDays]);

  // Aggregate: service popularity (counts)
  const servicesData = useMemo(() => {
    const counts = Object.create(null);
    for (const r of reservations) {
      const name = r.serviceName || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    }
    const arr = Object.entries(counts).map(([name, value]) => ({ name, value }));
    // Top 8 to keep legend tidy
    return arr.sort((a,b) => b.value - a.value).slice(0, 8);
  }, [reservations]);

  const donutPalette = ['#22c55e', '#3b82f6', '#ef4444', '#f59e0b', '#a855f7', '#06b6d4', '#84cc16', '#f472b6'];
  const hasRevenue = useMemo(() => Object.keys(servicesMap || {}).length > 0 && weeklyRevenueData.some(d => d.revenue > 0), [servicesMap, weeklyRevenueData]);
  const barData = hasRevenue ? weeklyRevenueData : weeklyCountsData;
  const barKey = hasRevenue ? 'revenue' : 'count';
  const barTitle = hasRevenue ? 'Weekly revenue trends' : 'Weekly reservations trend';
  return (
    <div>
      <div style={{ textAlign:'left', marginBottom: 18 }}>
        <h2 style={{ margin:'0 0 4px', fontSize: 28, fontWeight: 800 }}>Dashboard Overview</h2>
        <div className="muted" style={{ fontSize: 14 }}>Welcome, Admin!</div>
      </div>

      <div className="cards" style={{ gridTemplateColumns:'repeat(3, minmax(200px, 1fr))', gap: 18 }}>
        <div className="card" style={{ background:'#242a31', borderColor:'#3b4148' }}>
          <div className="muted" style={{ marginBottom: 8 }}>Today's Revenue</div>
          <div style={{ fontSize: 26, fontWeight: 900 }}>UGX 56,000/=</div>
          <div style={{ color:'#16a34a', marginTop: 6, fontWeight:700 }}>+5.2% vs yesterday</div>
        </div>
        <div className="card" style={{ background:'#242a31', borderColor:'#3b4148' }}>
          <div className="muted" style={{ marginBottom: 8 }}>Reservations Today</div>
          <div style={{ fontSize: 26, fontWeight: 900 }}>12</div>
          <div style={{ color:'#16a34a', marginTop: 6, fontWeight:700 }}>+2.0% vs yesterday</div>
        </div>
        <div className="card" style={{ background:'#242a31', borderColor:'#3b4148' }}>
          <div className="muted" style={{ marginBottom: 8 }}>New Clients this week</div>
          <div style={{ fontSize: 26, fontWeight: 900 }}>2</div>
          <div style={{ color:'#16a34a', marginTop: 6, fontWeight:700 }}>+10% vs last week</div>
        </div>
      </div>

      <div className="cards" style={{ gridTemplateColumns:'repeat(2, minmax(260px, 1fr))', marginTop: 28, gap: 28 }}>
        <div className="panel" style={{ background:'var(--color-surface-2)' }}>
          <div style={{ fontWeight:800, marginBottom: 12 }}>{barTitle}</div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: 'var(--color-muted)' }} stroke="var(--color-border)" />
                <YAxis tick={{ fill: 'var(--color-muted)' }} stroke="var(--color-border)" />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-ink)', borderRadius: 10 }}
                  formatter={(v) => barKey === 'revenue' ? [`UGX ${Number(v).toLocaleString()}/=`, 'Revenue'] : [v, 'Reservations']}
                />
                <Bar dataKey={barKey} fill="var(--color-brand)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel" style={{ background:'var(--color-surface-2)' }}>
          <div style={{ fontWeight:800, marginBottom: 12 }}>Most popular services</div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={servicesData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} stroke="var(--color-surface-2)">
                  {servicesData.map((entry, index) => (
                    <Cell key={`slice-${index}`} fill={donutPalette[index % donutPalette.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={24} wrapperStyle={{ color: 'var(--color-ink)' }} />
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-ink)', borderRadius: 10 }} formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
