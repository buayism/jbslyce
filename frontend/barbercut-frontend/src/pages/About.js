import React from 'react';
import logo from '../assets/jb-slyce-logo.png';

function About() {
  return (
    <div className="about">
      <section className="about-hero">
        <div className="bc-container">
          <h1>About us</h1>
          <p className="muted">Telling our inspiring story from our very first b'ness days</p>
        </div>
      </section>

      <section className="about-story">
        <div className="bc-container">
          <div className="row g-4 align-items-center">
          <div className="col-12 col-lg-7 about-story__left">
            <h2 className="about-headline">
              <span>Behind our</span>
              <br />
              <span>Success</span>
            </h2>
            <p className="about-copy">
              JB Slyce BarberShop started in 2021 March and ever since then everything is been a success. 
              <br />
              From building our barbershop in Small gate to becoming the best barbershop in Bugema University
              <br />
              We have clients from different age groups and different professions. we have clients who are kids, youths, adults, University lecturers and all kinds of people
            </p>
          </div>
          <div className="col-12 col-lg-5 about-story__right" style={{ textAlign:'center' }}>
            <img src={logo} alt="JB Slyce emblem" className="about-logo img-fluid" />
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
