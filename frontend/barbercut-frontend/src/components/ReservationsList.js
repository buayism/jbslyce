import React, { useState, useEffect } from 'react';
import { API_BASE } from '../lib/api';

const ReservationsList = () => {
  const [clientId, setClientId] = useState('');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReservations = async () => {
    if (!clientId) {
      setError('Please enter a Client ID');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/reservations/client/${clientId}`);
      
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      } else {
        setError('Failed to fetch reservations');
      }
    } catch (err) {
      setError('Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString) => {
    return new Date(isoString).toLocaleString();
  };

  const getStatusClass = (status) => {
    return `reservation-status status-${status}`;
  };

  return (
    <div>
      <h2>My Reservations</h2>
      <div>
        <input
          type="text"
          placeholder="Enter Client ID"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        />
        <button onClick={fetchReservations}>View Reservations</button>
      </div>
      
      {loading && <div>Loading...</div>}
      {error && <div className="error">{error}</div>}
      
      <div className="reservation-list">
        {reservations.map((reservation) => (
          <div key={reservation.id} className="reservation-item">
            <h3>Reservation #{reservation.id.substring(0, 8)}</h3>
            <p><strong>Barber ID:</strong> {reservation.barberId}</p>
            <p><strong>Date & Time:</strong> {formatDateTime(reservation.slot)}</p>
            <p><strong>Status:</strong> <span className={getStatusClass(reservation.status)}>{reservation.status}</span></p>
            {reservation.notes && <p><strong>Notes:</strong> {reservation.notes}</p>}
          </div>
        ))}
        
        {reservations.length === 0 && clientId && !loading && (
          <p>No reservations found for this client.</p>
        )}
      </div>
    </div>
  );
};

export default ReservationsList;