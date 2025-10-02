import React, { useState, useEffect } from 'react';
import './Home.css';
import OfflineIndicator from './OfflineIndicator';

interface AirQualityData {
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  location: string;
  timestamp: string;
  status: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
}

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
}

interface AlertData {
  id: string;
  type: 'warning' | 'info' | 'critical';
  message: string;
  timestamp: string;
}

const Home: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState('New York, NY');
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulated API endpoints - Replace with real NASA API calls
  const fetchAirQualityData = async () => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with real NASA API
      const mockData: AirQualityData = {
        aqi: Math.floor(Math.random() * 200) + 20,
        pm25: Math.floor(Math.random() * 50) + 5,
        pm10: Math.floor(Math.random() * 80) + 10,
        o3: Math.floor(Math.random() * 150) + 20,
        no2: Math.floor(Math.random() * 100) + 10,
        so2: Math.floor(Math.random() * 80) + 5,
        co: Math.floor(Math.random() * 2000) + 100,
        location: currentLocation,
        timestamp: new Date().toISOString(),
        status: getAQIStatus(Math.floor(Math.random() * 200) + 20)
      };
      
      setAirQualityData(mockData);
    } catch (error) {
      console.error('Error fetching air quality data:', error);
    }
  };

  const fetchWeatherData = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockWeather: WeatherData = {
        temperature: Math.floor(Math.random() * 30) + 10,
        humidity: Math.floor(Math.random() * 60) + 30,
        windSpeed: Math.floor(Math.random() * 20) + 2,
        pressure: Math.floor(Math.random() * 100) + 1000,
        visibility: Math.floor(Math.random() * 15) + 5
      };
      
      setWeatherData(mockWeather);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const mockAlerts: AlertData[] = [
        {
          id: '1',
          type: 'warning',
          message: 'Air quality may be unhealthy for sensitive groups',
          timestamp: new Date().toISOString()
        },
        {
          id: '2', 
          type: 'info',
          message: 'Wind patterns favorable for air quality improvement',
          timestamp: new Date().toISOString()
        }
      ];
      
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const getAQIStatus = (aqi: number): AirQualityData['status'] => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return '#1976d2';      // Good - Standard Blue
    if (aqi <= 100) return '#1565c0';    // Moderate - Medium Blue  
    if (aqi <= 150) return '#0d47a1';    // Unhealthy for Sensitive - Dark Blue
    if (aqi <= 200) return '#0a3d91';    // Unhealthy - Darker Blue
    if (aqi <= 300) return '#083680';    // Very Unhealthy - Very Dark Blue
    return '#051f4a';                     // Hazardous - Deepest Blue
  };

  const getAQIBackgroundColor = (aqi: number) => {
    if (aqi <= 50) return 'rgba(25, 118, 210, 0.1)';
    if (aqi <= 100) return 'rgba(21, 101, 192, 0.15)';
    if (aqi <= 150) return 'rgba(13, 71, 161, 0.2)';
    if (aqi <= 200) return 'rgba(10, 61, 145, 0.25)';
    if (aqi <= 300) return 'rgba(8, 54, 128, 0.3)';
    return 'rgba(5, 31, 74, 0.35)';
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAirQualityData(),
      fetchWeatherData(),
      fetchAlerts()
    ]);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(refreshData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentLocation]);

  return (
    <div className="home-container">
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Global Animated Background */}
      <div className="global-background">
        <div className="floating-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
        <div className="gradient-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
          <div className="orb orb-4"></div>
          <div className="orb orb-5"></div>
        </div>
      </div>

      {/* Enhanced Header Section */}
      <section className="home-header">
        <div className="header-content">
          <div className="profile-section">
            <div className="user-profile">
              <div className="user-avatar">
                <div className="avatar-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              </div>
              <div className="profile-info">
                <div className="greeting-text">
                  <h1 className="greeting-title">Hi! How's Your Air Today?</h1>
                  <p className="greeting-subtitle">Monitor your environment in real-time</p>
                </div>
                <div className="quick-stats-preview">
                  <div className="mini-stat">
                    <span className="mini-value">{airQualityData?.aqi || '--'}</span>
                    <span className="mini-label">AQI</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-value">{weatherData?.temperature || '--'}°</span>
                    <span className="mini-label">Temp</span>
                  </div>
                  <div className="mini-stat">
                    <span className="mini-value">{weatherData?.humidity || '--'}%</span>
                    <span className="mini-label">Humidity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="header-controls">
            <div className="location-selector">
              <div className="location-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <select 
                value={currentLocation} 
                onChange={(e) => setCurrentLocation(e.target.value)}
                className="location-dropdown"
              >
                <option value="New York, NY">New York, NY</option>
                <option value="Los Angeles, CA">Los Angeles, CA</option>
                <option value="Chicago, IL">Chicago, IL</option>
                <option value="Houston, TX">Houston, TX</option>
                <option value="Phoenix, AZ">Phoenix, AZ</option>
                <option value="Philadelphia, PA">Philadelphia, PA</option>
                <option value="San Antonio, TX">San Antonio, TX</option>
                <option value="San Diego, CA">San Diego, CA</option>
              </select>
            </div>
            
            <div className="header-actions">
              <button className="notification-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </button>
              
              <button className="settings-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="time-info">
          <div className="current-time">
            <span className="time-label">Last updated</span>
            <span className="time-value">{lastUpdated.toLocaleTimeString()}</span>
          </div>
          <div className="data-source">
            <span className="source-badge">
              <div className="live-indicator"></div>
              NASA Satellite Data
            </span>
          </div>
        </div>
      </section>

      {/* Enhanced Main AQI Display */}
      <section className="aqi-main-display">
        <div className="aqi-dashboard">
          <div className="aqi-primary-card">
            <div className="aqi-card-header">
              <div className="header-left">
                <h2>Air Quality Index</h2>
                <div className="aqi-location">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{airQualityData?.location}</span>
                </div>
              </div>
              <div className="aqi-badge">
                <span className="badge-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/>
                  </svg>
                </span>
                Real-time
              </div>
            </div>
            
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <span>Fetching latest data...</span>
              </div>
            ) : (
              <div className={`aqi-main-content ${airQualityData ? 'data-loaded' : ''}`}>
                <div className="aqi-visual">
                  <div className="aqi-circle-container">
                    <div 
                      className="aqi-circle" 
                      style={{ 
                        borderColor: getAQIColor(airQualityData?.aqi || 0),
                        background: getAQIBackgroundColor(airQualityData?.aqi || 0)
                      }}
                    >
                      <div className="aqi-number" style={{ color: getAQIColor(airQualityData?.aqi || 0) }}>
                        {airQualityData?.aqi || 0}
                      </div>
                      <div className="aqi-unit">AQI</div>
                    </div>
                    <div className="aqi-ring" style={{ borderColor: getAQIColor(airQualityData?.aqi || 0) }}></div>
                  </div>
                  
                  <div className="aqi-description">
                    <div className="status-text" style={{ color: getAQIColor(airQualityData?.aqi || 0) }}>
                      {airQualityData?.status || 'Unknown'}
                    </div>
                    <div className="status-details">
                      <p>Current air quality is suitable for most people</p>
                      <div className="recommendation">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 12l2 2 4-4"/>
                          <circle cx="12" cy="12" r="9"/>
                        </svg>
                        Outdoor activities recommended
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="aqi-trend">
                  <div className="trend-title">24h Trend</div>
                  <div className="trend-chart">
                    <div className="trend-bars">
                      {[45, 52, 48, 55, 60, 58, 62, 59].map((value, index) => (
                        <div 
                          key={index} 
                          className="trend-bar" 
                          style={{ 
                            height: `${(value / 100) * 100}%`,
                            backgroundColor: getAQIColor(value)
                          }}
                        ></div>
                      ))}
                    </div>
                    <div className="trend-labels">
                      <span>6h ago</span>
                      <span>Now</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="aqi-secondary-cards">
            <div className="quick-insight-card">
              <div className="insight-header">
                <h4>Health Impact</h4>
                <div className="health-icon" style={{ color: getAQIColor(airQualityData?.aqi || 0) }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/>
                  </svg>
                </div>
              </div>
              <div className="insight-content">
                <div className="impact-level" style={{ color: getAQIColor(airQualityData?.aqi || 0) }}>
                  Minimal Impact
                </div>
                <p>Air quality is good. Perfect for outdoor activities and exercise.</p>
              </div>
            </div>
            
            <div className="forecast-card">
              <div className="forecast-header">
                <h4>Today's Forecast</h4>
                <div className="forecast-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                  </svg>
                </div>
              </div>
              <div className="forecast-content">
                <div className="forecast-range">
                  <span>40-65 AQI</span>
                </div>
                <div className="forecast-trend">
                  <span className="trend-indicator improving">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    </svg>
                    Improving
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="quick-stats">
        <h3 className="section-title">Air Quality Metrics</h3>
        <div className={`stats-grid ${airQualityData ? 'data-loaded' : ''}`}>
          <div className="stat-card">
            <div className="stat-icon pm25">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <circle cx="12" cy="12" r="8"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{airQualityData?.pm25 || '--'}</div>
              <div className="stat-label">PM2.5</div>
              <div className="stat-unit">μg/m³</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon pm10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{airQualityData?.pm10 || '--'}</div>
              <div className="stat-label">PM10</div>
              <div className="stat-unit">μg/m³</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon ozone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/>
                <path d="M8 12h8"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{airQualityData?.o3 || '--'}</div>
              <div className="stat-label">Ozone</div>
              <div className="stat-unit">μg/m³</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon no2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{airQualityData?.no2 || '--'}</div>
              <div className="stat-label">NO2</div>
              <div className="stat-unit">μg/m³</div>
            </div>
          </div>
        </div>
      </section>

      {/* Weather & Environmental Data */}
      <section className="environmental-data">
        <div className={`data-grid ${weatherData || alerts.length > 0 ? 'data-loaded' : ''}`}>
          <div className="data-card weather-card">
            <div className="card-header">
              <h4>Weather Conditions</h4>
              <div className="weather-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                </svg>
              </div>
            </div>
            <div className="weather-data">
              <div className="weather-item">
                <span className="weather-label">Temperature</span>
                <span className="weather-value">{weatherData?.temperature || '--'}°C</span>
              </div>
              <div className="weather-item">
                <span className="weather-label">Humidity</span>
                <span className="weather-value">{weatherData?.humidity || '--'}%</span>
              </div>
              <div className="weather-item">
                <span className="weather-label">Wind Speed</span>
                <span className="weather-value">{weatherData?.windSpeed || '--'} km/h</span>
              </div>
              <div className="weather-item">
                <span className="weather-label">Pressure</span>
                <span className="weather-value">{weatherData?.pressure || '--'} hPa</span>
              </div>
            </div>
          </div>
          
          <div className="data-card alerts-card">
            <div className="card-header">
              <h4>Air Quality Alerts</h4>
              <div className="alert-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
            </div>
            <div className="alerts-list">
              {alerts.length > 0 ? (
                alerts.map(alert => (
                  <div key={alert.id} className={`alert-item ${alert.type}`}>
                    <div className="alert-content">
                      <span className="alert-message">{alert.message}</span>
                      <span className="alert-time">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-alerts">
                  <div className="no-alerts-icon">✓</div>
                  <span>No active alerts</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Quick Actions */}
      <section className="quick-actions">
        <div className="actions-header">
          <h3 className="section-title">Quick Actions</h3>
          <button className="view-all-btn">
            View All
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
        
        <div className="actions-grid">
          <button className="action-card primary">
            <div className="action-content">
              <div className="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div className="action-text">
                <span className="action-title">View Map</span>
                <span className="action-subtitle">Interactive air quality map</span>
              </div>
            </div>
            <div className="action-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </button>
          
          <button className="action-card">
            <div className="action-content">
              <div className="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div className="action-text">
                <span className="action-title">Set Alerts</span>
                <span className="action-subtitle">Custom notifications</span>
              </div>
            </div>
            <div className="action-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </button>
          
          <button className="action-card">
            <div className="action-content">
              <div className="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v5h5"/>
                  <path d="M21 21v-5h-5"/>
                  <path d="M21 3H3v18h18z"/>
                  <path d="M7 12h10"/>
                  <path d="M12 7v10"/>
                </svg>
              </div>
              <div className="action-text">
                <span className="action-title">Analytics</span>
                <span className="action-subtitle">Detailed insights</span>
              </div>
            </div>
            <div className="action-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </button>
          
          <button className="action-card">
            <div className="action-content">
              <div className="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                </svg>
              </div>
              <div className="action-text">
                <span className="action-title">API Access</span>
                <span className="action-subtitle">Developer tools</span>
              </div>
            </div>
            <div className="action-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </button>
    
        </div>
      </section>
    </div>
  );
};

export default Home;
