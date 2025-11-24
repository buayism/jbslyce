import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid #3b4148',
    background: isActive ? '#ffffff' : '#2a2f36',
    color: isActive ? '#111827' : '#e5e7eb',
    fontWeight: isActive ? 700 : 600,
    justifyContent: 'flex-start'
  });

  return (
    <div className="home">
      <div className="bc-container">
        <div className="panel" style={{ padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 520 }}>
            <aside style={{ borderRight: '1px solid var(--color-border)', padding: 16 }}>
              <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 18 }}>Admin</div>
              <nav style={{ display: 'grid', gap: 8 }}>
                <NavLink to="/admin/dashboard" style={linkStyle}>🏠 Dashboard</NavLink>
                <NavLink to="/admin/barbers" style={linkStyle}>💈 Barbers</NavLink>
                <NavLink to="/admin/clients" style={linkStyle}>👤 Clients</NavLink>
                <NavLink to="/admin/reservations" style={linkStyle}>📋 Reservations</NavLink>
                <NavLink to="/admin/notifications" style={linkStyle}>🔔 Notifications</NavLink>
                <NavLink to="/admin/settings" style={linkStyle}>⚙️ Settings</NavLink>
              </nav>
            </aside>
            <section style={{ padding: 16 }}>
              <Outlet />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
