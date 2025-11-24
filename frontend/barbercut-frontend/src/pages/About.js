import React from 'react';
import logo from '../assets/jb-slyce-logo.png';

function About() {
  return (
    <div className="about">
      <section className="about-hero">
        <div className="bc-container">
          <h1>About JB Slyce</h1>
          <p className="muted">Where tradition meets modern grooming excellence</p>
        </div>
      </section>

      <section className="about-story">
        <div className="bc-container">
          <div className="about-story__grid">
            <div className="about-story__left">
              <h2 className="about-headline">
                <span>Crafting</span>
                <br />
                <span>Excellence</span>
              </h2>
              <p className="about-copy">
                Since March 2021, JB Slyce BarberShop has been the premier destination for quality grooming at Bugema University. What started as a vision at Small Gate has grown into the most trusted barbershop on campus.
              </p>
              <p className="about-copy">
                We pride ourselves on serving a diverse clientele—from students and faculty to community members of all ages. Our skilled barbers combine traditional techniques with modern styles to deliver exceptional results every time.
              </p>
              <p className="about-copy">
                Whether you're looking for a classic cut, a fresh fade, or a luxury shave, we're committed to making you look and feel your best. Book online and experience the JB Slyce difference.
              </p>
            </div>
            <div className="about-story__right">
              <img src={logo} alt="JB Slyce emblem" className="about-logo" />
            </div>
          </div>
        </div>
      </section>

      <section className="about-location bc-container">
        <div className="panel">
          <h2 className="selection-title">Find Us</h2>
          <p className="muted" style={{ textAlign: 'center', marginBottom: 24 }}>
            Visit us at Small Gate, Bugema University
          </p>

          <div className="location-content">
            <div className="location-info">
              <div className="info-item">
                <h4>📍 Address</h4>
                <p>Small Gate, Bugema University<br />Kampala, Uganda</p>
              </div>
              <div className="info-item">
                <h4>⏰ Hours</h4>
                <p>Monday - Saturday: 8:00 AM - 8:00 PM<br />Sunday: 10:00 AM - 6:00 PM</p>
              </div>
              <div className="info-item">
                <h4>📞 Contact</h4>
                <p>Book online or walk in<br />We accept appointments and walk-ins</p>
              </div>
            </div>

            <div className="map-container">
              <iframe
                title="JB Slyce Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7565!2d32.7378!3d0.5667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMMKwMzQnMDAuMSJOIDMywrA0NCcxNi4xIkU!5e0!3m2!1sen!2sug!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: 12 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
