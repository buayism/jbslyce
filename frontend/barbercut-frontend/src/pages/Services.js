import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';

function Services() {
  const navigate = useNavigate();
  const { selectService } = useBooking();

  const handlePick = (service) => {
    selectService(service);
    navigate('/select-barber');
  };

  return (
    <div className="home">
      <div className="bc-container">
        <div className="panel">
          <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
          <h2 className="selection-title">Services</h2>
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
        </div>
      </div>
    </div>
  );
}

export default Services;
