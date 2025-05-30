import React from 'react';

function About() {
  return (
    <div>
      <header className="page-header">
        <h1>About Family Hub</h1>
      </header>

      <blockquote className="intro-text">
        Family Hub is a central place for all your family's needs.
        We created this platform to help families stay connected and organized.
        With features like weather forecasts, shared wishlists, and family plans,
        you'll never miss an important event or forget a birthday gift again.
      </blockquote>

      <section className="features">
        <div className="feature-item">
          <h3>
            Weather
            <img src="../../public/images/weather-icon-blue.svg" alt="Weather icon" className="feature-icon" />
          </h3>
        </div>
        <div className="feature-item">
          <h3>
            Shared Wishlists
            <img src="../../public/images/wishlist-icon-blue.svg" alt="Wishlist illustration" className="feature-icon" />
          </h3>
        </div>
        <div className="feature-item">
          <h3>
            Plans
            <img src="../../public/images/plans-icon-blue.svg" alt="Plans illustration" className="feature-icon" />
          </h3>
        </div>
      </section>
    </div>
  );
}

export default About;