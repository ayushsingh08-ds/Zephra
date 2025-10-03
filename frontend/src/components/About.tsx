import React from 'react';
import './About.css';

const About: React.FC = () => {
  return (
    <div className="about-container">
      {/* Global Animated Background for Entire Page */}
      <div className="global-background">
        <div className="floating-particles">
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
        </div>
        <div className="gradient-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
          <div className="orb orb-4"></div>
          <div className="orb orb-5"></div>
        </div>
      </div>

      {/* Modern Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </span>
            NASA-Powered Technology
          </div>
          <div className="logo-intro">
            <img src="/logo.png" alt="Zephra Logo" className='logo-image' />
          <h1 className="hero-title">
            <span className="title-word" data-text="Zephra">Zephra</span>
          </h1>
          </div>
          
          <div className="hero-subtitle-container">
            <p className="hero-subtitle">
              <span className="highlight">Monitoring Air Quality</span> with 
              <span className="gradient-text"> NASA Satellite Technology</span>
            </p>
          </div>
          
          <div className="hero-description">
            <p>
              Empowering communities with <strong>real-time air quality insights</strong> 
              powered by cutting-edge NASA satellite data. Making environmental awareness 
              accessible to <em>everyone, everywhere</em>.
            </p>
          </div>
          
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">12+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">2+</div>
              <div className="stat-label">Countries</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Mission Section */}
      <section className="mission-section">
        <div className="mission-content">
          <div className="mission-header">
            <div className="section-badge">
              <span className="badge-pulse"></span>
              Our Purpose
            </div>
            <h2 className="mission-title">
              <span className="title-line">Democratizing</span>
              <span className="title-line gradient-text">Air Quality</span>
              <span className="title-line">Intelligence</span>
            </h2>
          </div>
          
          <div className="mission-text-container">
            <div className="mission-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8"/>
                <path d="M12 8v8"/>
              </svg>
            </div>
            
            <div className="mission-text">
              <p className="mission-intro">
                At Zephra, we believe that <strong>clean air is a fundamental right</strong>. 
                Our mission transcends traditional boundaries.
              </p>
              
              <div className="mission-points">
                <div className="point-item">
                  <div className="point-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div className="point-text">
                    <strong>Democratize</strong> access to accurate, real-time air quality information
                  </div>
                </div>
                
                <div className="point-item">
                  <div className="point-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div className="point-text">
                    <strong>Leverage</strong> NASA's advanced satellite technology for unprecedented accuracy
                  </div>
                </div>
                
                <div className="point-item">
                  <div className="point-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div className="point-text">
                    <strong>Deliver</strong> insights through an intuitive, user-friendly platform
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mission-cta">
            <div className="cta-text">Join the movement for cleaner air</div>
            <div className="cta-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17l9.2-9.2M17 17V7H7"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <h2 className="section-title">What We Offer</h2>
        <div className="features-grid">
          <div className="feature-card large">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-10L16 7.5M8 16.5l-4.5 4.5M7.5 8L3 3.5m13.5 13.5L12 12"/>
              </svg>
            </div>
            <h3>NASA Satellite Data</h3>
            <p>
              Access real-time and historical air quality data from NASA's Earth observation satellites, 
              providing unparalleled accuracy and global coverage.
            </p>
          </div>
          <div className="feature-card medium">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v5h5"/>
                <path d="M21 21v-5h-5"/>
                <path d="M21 3H3v18h18z"/>
                <path d="M7 12h10"/>
                <path d="M12 7v10"/>
              </svg>
            </div>
            <h3>Air Quality Index</h3>
            <p>
              Comprehensive AQI monitoring with detailed breakdowns of pollutants including PM2.5, PM10, 
              NO2, SO2, CO, and O3 levels.
            </p>
          </div>
          <div className="feature-card small">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <h3>Global Coverage</h3>
            <p>
              Monitor air quality anywhere in the world with our satellite-powered global monitoring system.
            </p>
          </div>
          <div className="feature-card medium">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h3>Real-time Updates</h3>
            <p>
              Get instant notifications and updates about air quality changes in your area with our 
              advanced monitoring algorithms.
            </p>
          </div>
          <div className="feature-card large">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M7 15h0M12 15h0M17 15h0"/>
                <path d="M7 11h10"/>
              </svg>
            </div>
            <h3>User-Friendly Interface</h3>
            <p>
              Our intuitive design makes complex environmental data accessible to everyone, from 
              researchers to everyday users concerned about their air quality.
            </p>
          </div>
          <div className="feature-card small">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h3>Community Driven</h3>
            <p>
              Join a global community of users working together to monitor and improve air quality worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="technology-section">
        <div className="glass-container wide">
          <div className="tech-content">
            <div className="tech-text">
              <h2>Powered by NASA Technology</h2>
              <p>
                Our platform integrates with NASA's Earth Science Division satellites including 
                MODIS, VIIRS, and TROPOMI instruments to provide the most accurate air quality 
                measurements available.
              </p>
              <ul className="tech-features">
                <li>Real-time satellite imagery processing</li>
                <li>Advanced atmospheric modeling</li>
                <li>Machine learning-powered predictions</li>
                <li>Multi-sensor data fusion</li>
              </ul>
            </div>
            <div className="tech-visual">
              <div className="satellite-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4.93 4.93l4.24 4.24"/>
                  <path d="M14.83 9.17l4.24-4.24"/>
                  <path d="M14.83 14.83l4.24 4.24"/>
                  <path d="M9.17 14.83l-4.24 4.24"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <div className="data-flow">
                <div className="data-point"></div>
                <div className="data-point"></div>
                <div className="data-point"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="impact-section">
        <h2 className="section-title">Our Impact</h2>
        <div className="impact-grid">
          <div className="impact-card">
            <div className="impact-number">50+</div>
            <div className="impact-label">Countries Covered</div>
          </div>
          <div className="impact-card">
            <div className="impact-number">24/7</div>
            <div className="impact-label">Real-time Monitoring</div>
          </div>
          <div className="impact-card">
            <div className="impact-number">99.9%</div>
            <div className="impact-label">Uptime Reliability</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
