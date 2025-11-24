import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="home">
      <div className="bc-container">
        <div className="panel" style={{ textAlign: 'center' }}>
          <h2 className="selection-title" style={{ marginBottom: 8 }}>Client Dashboard</h2>
          <p className="muted" style={{ marginTop: 0 }}>Welcome, {user?.username || ''}</p>
          <div className="cards" style={{ marginTop: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="card">
              <div className="muted" style={{ marginBottom: 6 }}>Quick Actions</div>
              <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                <button className="btn btn-primary sm" onClick={() => navigate('/services')}>Book a service</button>
                <button className="btn sm" onClick={() => navigate('/my-reservations')}>My reservations</button>
              </div>
            </div>
            <div className="card">
              <div className="muted" style={{ marginBottom: 6 }}>Tips</div>
              <div>Rebook with your favorite barber for consistent results.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
