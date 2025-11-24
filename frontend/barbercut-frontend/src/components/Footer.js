import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <div className="bc-container">
        <p>© {new Date().getFullYear()} BarberCut</p>
      </div>
    </footer>
  );
}

export default Footer;
