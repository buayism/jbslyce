import React from 'react';

function Barbers() {
  return (
    <div className="page container">
      <h1>Our Barbers</h1>
      <div className="barber-list">
        <div className="barber">
          <div className="avatar" />
          <h4>Marco</h4>
          <p className="muted">Master Barber & Stylist</p>
        </div>
        <div className="barber">
          <div className="avatar" />
          <h4>Lena</h4>
          <p className="muted">Precision Cuts & Fades</p>
        </div>
        <div className="barber">
          <div className="avatar" />
          <h4>David</h4>
          <p className="muted">Traditional Shave Expert</p>
        </div>
      </div>
    </div>
  );
}

export default Barbers;
