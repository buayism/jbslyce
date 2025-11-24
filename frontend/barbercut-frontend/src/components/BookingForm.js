import React, { useState } from 'react';

const BookingForm = () => {
  const [formData, setFormData] = useState({
    barberId: '',
    clientId: '',
    slot: '',
    notes: ''
  });
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert date string to ISO format
    const reservationData = {
      ...formData,
      slot: new Date(formData.slot).toISOString()
    };

    try {
      const response = await fetch('http://localhost:8080/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData)
      });

      const result = await response.text();
      
      if (response.ok) {
        setMessage('Reservation created successfully!');
        setError('');
        // Reset form
        setFormData({
          barberId: '',
          clientId: '',
          slot: '',
          notes: ''
        });
      } else {
        setError(result);
        setMessage('');
      }
    } catch (err) {
      setError('Failed to create reservation. Please try again.');
      setMessage('');
    }
  };

  return (
    <div>
      <h2>Book a Reservation</h2>
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="barberId">Barber ID:</label>
          <input
            type="text"
            id="barberId"
            name="barberId"
            value={formData.barberId}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label htmlFor="clientId">Client ID:</label>
          <input
            type="text"
            id="clientId"
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label htmlFor="slot">Date and Time:</label>
          <input
            type="datetime-local"
            id="slot"
            name="slot"
            value={formData.slot}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label htmlFor="notes">Notes:</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
          />
        </div>
        
        <button type="submit">Book Reservation</button>
      </form>
    </div>
  );
};

export default BookingForm;