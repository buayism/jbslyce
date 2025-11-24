import React, { useState, useEffect } from 'react';
import { API_BASE } from '../lib/api';

const AdminDashboard = () => {
  const [barberId, setBarberId] = useState('');
  const [pendingReservations, setPendingReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchPendingReservations = async () => {
    if (!barberId) {
      setError('Please enter a Barber ID');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch(`${API_BASE}/api/reservations/barber/${barberId}/pending`);
      
      if (response.ok) {
        const data = await response.json();
        setPendingReservations(data);
      } else {
        setError('Failed to fetch pending reservations');
      }
    } catch (err) {
      setError('Failed to fetch pending reservations');
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (reservationId, status) => {
    try {
      const response = await fetch(`${API_BASE}/api/reservations/${reservationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Remove the reservation from the list
        setPendingReservations(pendingReservations.filter(res => res.id !== reservationId));
        setMessage(`Reservation ${status.toLowerCase()} successfully!`);
      } else {
        setError('Failed to update reservation status');
      }
    } catch (err) {
      setError('Failed to update reservation status');
    }
  };

  const formatDateTime = (isoString) => {
    return new Date(isoString).toLocaleString();
  };

  return (
    <div>
      <h2>Barber Admin Dashboard</h2>
      <div>
        <input
          type="text"
          placeholder="Enter Barber ID"
          value={barberId}
          onChange={(e) => setBarberId(e.target.value)}
        />
        <button onClick={fetchPendingReservations}>View Pending Reservations</button>
      </div>
      
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
      {loading && <div>Loading...</div>}
      
      <div className="reservation-list">
        <h3>Pending Reservations</h3>
        {pendingReservations.map((reservation) => (
          <div key={reservation.id} className="reservation-item">
            <h3>Reservation #{reservation.id.substring(0, 8)}</h3>
            <p><strong>Client ID:</strong> {reservation.clientId}</p>
            <p><strong>Date & Time:</strong> {formatDateTime(reservation.slot)}</p>
            {reservation.notes && <p><strong>Notes:</strong> {reservation.notes}</p>}
            <div>
              <button 
                onClick={() => updateReservationStatus(reservation.id, 'APPROVED')}
                style={{ backgroundColor: '#28a745' }}
              >
                Approve
              </button>
              <button 
                onClick={() => updateReservationStatus(reservation.id, 'DECLINED')}
                style={{ backgroundColor: '#dc3545' }}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
        
        {pendingReservations.length === 0 && barberId && !loading && (
          <p>No pending reservations found for this barber.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;