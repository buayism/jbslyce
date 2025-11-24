import React from 'react';
import { Link } from 'react-router-dom';

function BookingSuccess() {
  return (
    <div className="home">
      <div className="bc-container">
        <div className="panel" style={{ textAlign: 'center' }}>
          <h2>Booking Confirmed</h2>
          <p className="muted">Your reservation has been received. You'll get an update when the barber confirms.</p>
          <div style={{ marginTop: 16, display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link className="btn btn-primary" to="/my-reservations">View My Reservations</Link>
            <Link className="btn btn-secondary" to="/">Go to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingSuccess;
