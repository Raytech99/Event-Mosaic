import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const TrianglePattern: React.FC = () => (
  <svg width="100%" height="100%" viewBox="0 0 400 400">
    {/* Navy triangles - reduced quantity */}
    <polygon points="0,0 50,50 0,50" fill="#1a237e" opacity="0.7" />
    <polygon points="300,200 350,250 300,250" fill="#1a237e" opacity="0.7" />
    <polygon points="50,300 100,350 50,350" fill="#1a237e" opacity="0.7" />

    {/* Gold triangles - reduced quantity */}
    <polygon points="150,150 200,200 150,200" fill="#f9a825" opacity="0.7" />
    <polygon points="350,350 400,400 350,400" fill="#f9a825" opacity="0.7" />

    {/* Maroon triangles - reduced quantity */}
    <polygon points="200,0 250,50 200,50" fill="#7f0000" opacity="0.7" />
    <polygon points="100,200 150,250 100,250" fill="#7f0000" opacity="0.7" />
  </svg>
);

const LandingPage: React.FC = () => {
  useEffect(() => {
    // Add animation classes after component mounts
    const elements = document.querySelectorAll('.animate-on-mount');
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('animate-in');
      }, index * 200); // Stagger animations
    });
  }, []);

  return (
    <div className="landing-page">
      {/* Background Triangles - reduced to two patterns */}
      <div className="triangle-background">
        <div className="triangle-top-left">
          <TrianglePattern />
        </div>
        <div className="triangle-bottom-right">
          <TrianglePattern />
        </div>
      </div>

      {/* Main Content */}
      <main className="landing-main">
        <div className="hero-content">
          {/* Logo */}
          <div className="hero-logo animate-on-mount">
            <img src="/images/logo.png" alt="Event Mosaic Logo" />
          </div>

          {/* Headline and Tagline */}
          <h1 className="hero-title animate-on-mount">
            <span className="title-word navy">Organize,</span>
            <span className="title-word maroon">Customize,</span>
            <span className="title-word gold">Visualize</span>
          </h1>
          <p className="hero-subtitle animate-on-mount">
            The smartest way to keep up with campus events.
          </p>

          {/* CTA Buttons */}
          <div className="cta-buttons animate-on-mount">
            <Link to="/login" className="cta-button login">
              Login
            </Link>
            <Link to="/register" className="cta-button register">
              Register
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage; 