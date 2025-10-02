import React, { useState, useEffect, useRef } from 'react';
import './Home.css';
import './LocationMap.css';
import OfflineIndicator from './OfflineIndicator';
import { ServiceManager, type ServiceStatus } from '../services/ServiceManager';

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

interface AlertSettings {
  id: string;
  name: string;
  aqiThreshold: number;
  pollutant: 'aqi' | 'pm25' | 'pm10' | 'o3' | 'no2';
  condition: 'above' | 'below';
  enabled: boolean;
  notificationEnabled: boolean;
}

interface HealthProfile {
  id: string;
  hasAsthma: boolean;
  hasAllergies: boolean;
  hasHeartCondition: boolean;
  hasRespiratoryIssues: boolean;
  ageGroup: 'under-18' | '18-40' | '41-65' | 'over-65';
  exerciseOutdoors: boolean;
  sensitiveToPollution: boolean;
  takesAirQualityMeds: boolean;
  additionalConditions: string;
  createdAt: string;
  updatedAt: string;
}

const Home: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState('New York, NY');
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Service Manager state
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [syncQueueSize, setSyncQueueSize] = useState(0);
  const serviceManagerRef = useRef<ServiceManager | null>(null);
  
  // Geolocation state
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    city: string;
    accuracy: number;
  } | null>(null);
  
  // Alert management state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertSettings, setAlertSettings] = useState<AlertSettings[]>([]);
  const [newAlert, setNewAlert] = useState<Partial<AlertSettings>>({
    name: '',
    aqiThreshold: 100,
    pollutant: 'aqi',
    condition: 'above',
    enabled: true,
    notificationEnabled: true
  });
  
  // Health assessment state
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [healthForm, setHealthForm] = useState<Partial<HealthProfile>>({
    hasAsthma: false,
    hasAllergies: false,
    hasHeartCondition: false,
    hasRespiratoryIssues: false,
    ageGroup: '18-40',
    exerciseOutdoors: false,
    sensitiveToPollution: false,
    takesAirQualityMeds: false,
    additionalConditions: ''
  });

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
      
      // Check alerts with new data
      checkAlerts(mockData);
      
      // Handle air quality update through Service Manager
      if (serviceManagerRef.current) {
        await serviceManagerRef.current.handleAirQualityUpdate(mockData);
      }
      
      // Track analytics event
      if (serviceManagerRef.current) {
        await serviceManagerRef.current.trackAnalyticsEvent({
          type: 'air_quality_fetch',
          location: currentLocation,
          aqi: mockData.aqi,
          timestamp: Date.now()
        });
      }
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

  // Geolocation functions
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const { latitude, longitude, accuracy } = position.coords;
      
      // Reverse geocoding to get city name
      const cityName = await getCityFromCoordinates(latitude, longitude);
      
      const locationData = {
        latitude,
        longitude,
        city: cityName,
        accuracy
      };
      
      setUserLocation(locationData);
      
      // Update current location for air quality data
      setCurrentLocation(cityName);
      
      // Track location update through Service Manager
      if (serviceManagerRef.current) {
        await serviceManagerRef.current.handleLocationUpdate({
          latitude,
          longitude,
          city: cityName,
          timestamp: Date.now()
        });
      }
      
    } catch (error: any) {
      console.error('Geolocation error:', error);
    }
  };
  
  // Alert management functions
  const checkAlerts = async (currentData: AirQualityData) => {
    const newAlerts: AlertData[] = [];
    
    alertSettings.forEach(setting => {
      if (!setting.enabled) return;
      
      let currentValue: number;
      let pollutantName: string;
      
      switch (setting.pollutant) {
        case 'aqi':
          currentValue = currentData.aqi;
          pollutantName = 'AQI';
          break;
        case 'pm25':
          currentValue = currentData.pm25;
          pollutantName = 'PM2.5';
          break;
        case 'pm10':
          currentValue = currentData.pm10;
          pollutantName = 'PM10';
          break;
        case 'o3':
          currentValue = currentData.o3;
          pollutantName = 'Ozone';
          break;
        case 'no2':
          currentValue = currentData.no2;
          pollutantName = 'NO2';
          break;
        default:
          return;
      }
      
      const conditionMet = setting.condition === 'above' 
        ? currentValue > setting.aqiThreshold
        : currentValue < setting.aqiThreshold;
      
      if (conditionMet) {
        const alertType: AlertData['type'] = 
          currentValue > 150 ? 'critical' :
          currentValue > 100 ? 'warning' : 'info';
          
        newAlerts.push({
          id: `alert-${setting.id}-${Date.now()}`,
          type: alertType,
          message: `${setting.name}: ${pollutantName} is ${setting.condition} ${setting.aqiThreshold} (Current: ${currentValue})`,
          timestamp: new Date().toISOString()
        });
        
        // Send browser notification if enabled
        if (setting.notificationEnabled && 'Notification' in window) {
          try {
            if (Notification.permission === 'granted') {
              new Notification(`Air Quality Alert: ${setting.name}`, {
                body: `${pollutantName} level is ${currentValue}, which is ${setting.condition} your threshold of ${setting.aqiThreshold}`,
                icon: '/icon-192x192.png',
                tag: `alert-${setting.id}`
              });
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification(`Air Quality Alert: ${setting.name}`, {
                    body: `${pollutantName} level is ${currentValue}, which is ${setting.condition} your threshold of ${setting.aqiThreshold}`,
                    icon: '/icon-192x192.png',
                    tag: `alert-${setting.id}`
                  });
                }
              });
            }
          } catch (error) {
            console.error('Failed to send notification:', error);
          }
        }
      }
    });
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 4)]); // Keep max 5 alerts
    }
  };
  
  const createAlert = () => {
    if (!newAlert.name?.trim()) return;
    
    const alert: AlertSettings = {
      id: `alert-${Date.now()}`,
      name: newAlert.name,
      aqiThreshold: newAlert.aqiThreshold || 100,
      pollutant: newAlert.pollutant || 'aqi',
      condition: newAlert.condition || 'above',
      enabled: newAlert.enabled ?? true,
      notificationEnabled: newAlert.notificationEnabled ?? true
    };
    
    setAlertSettings(prev => [...prev, alert]);
    setNewAlert({
      name: '',
      aqiThreshold: 100,
      pollutant: 'aqi',
      condition: 'above',
      enabled: true,
      notificationEnabled: true
    });
    setShowAlertModal(false);
    
    // Save to localStorage
    const updatedSettings = [...alertSettings, alert];
    localStorage.setItem('airQualityAlerts', JSON.stringify(updatedSettings));
  };
  
  const toggleAlert = (id: string) => {
    setAlertSettings(prev => {
      const updated = prev.map(alert => 
        alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
      );
      localStorage.setItem('airQualityAlerts', JSON.stringify(updated));
      return updated;
    });
  };
  
  const deleteAlert = (id: string) => {
    setAlertSettings(prev => {
      const updated = prev.filter(alert => alert.id !== id);
      localStorage.setItem('airQualityAlerts', JSON.stringify(updated));
      return updated;
    });
  };
  
  // Health profile management functions
  const saveHealthProfile = () => {
    if (!healthForm.ageGroup) return;
    
    const profile: HealthProfile = {
      id: healthProfile?.id || `health-${Date.now()}`,
      hasAsthma: healthForm.hasAsthma || false,
      hasAllergies: healthForm.hasAllergies || false,
      hasHeartCondition: healthForm.hasHeartCondition || false,
      hasRespiratoryIssues: healthForm.hasRespiratoryIssues || false,
      ageGroup: healthForm.ageGroup || '18-40',
      exerciseOutdoors: healthForm.exerciseOutdoors || false,
      sensitiveToPollution: healthForm.sensitiveToPollution || false,
      takesAirQualityMeds: healthForm.takesAirQualityMeds || false,
      additionalConditions: healthForm.additionalConditions || '',
      createdAt: healthProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setHealthProfile(profile);
    localStorage.setItem('healthProfile', JSON.stringify(profile));
    setShowHealthModal(false);
    
    // Generate personalized recommendations based on profile
    generateHealthRecommendations(profile);
  };
  
  const generateHealthRecommendations = (profile: HealthProfile) => {
    const recommendations: string[] = [];
    
    if (profile.hasAsthma || profile.hasRespiratoryIssues) {
      recommendations.push('Consider staying indoors when AQI exceeds 100');
      recommendations.push('Keep rescue medications easily accessible');
    }
    
    if (profile.hasAllergies) {
      recommendations.push('Monitor pollen levels alongside air quality');
      recommendations.push('Use air purifiers indoors during high pollution days');
    }
    
    if (profile.hasHeartCondition) {
      recommendations.push('Avoid outdoor exercise when AQI is above 50');
      recommendations.push('Consult your doctor about air quality impacts on your condition');
    }
    
    if (profile.exerciseOutdoors) {
      recommendations.push('Check air quality before outdoor workouts');
      recommendations.push('Consider indoor alternatives during poor air quality days');
    }
    
    if (profile.ageGroup === 'over-65' || profile.ageGroup === 'under-18') {
      recommendations.push('Extra caution needed - you\'re in a sensitive group');
    }
    
    // Store recommendations for display
    localStorage.setItem('healthRecommendations', JSON.stringify(recommendations));
  };
  
  const getHealthRiskLevel = (aqi: number, profile: HealthProfile | null): string => {
    if (!profile) return 'Unknown';
    
    const hasConditions = profile.hasAsthma || profile.hasAllergies || 
                         profile.hasHeartCondition || profile.hasRespiratoryIssues;
    const isSensitiveAge = profile.ageGroup === 'over-65' || profile.ageGroup === 'under-18';
    
    if (hasConditions || isSensitiveAge) {
      if (aqi <= 50) return 'Low Risk';
      if (aqi <= 100) return 'Moderate Risk';
      if (aqi <= 150) return 'High Risk';
      return 'Very High Risk';
    } else {
      if (aqi <= 50) return 'Good';
      if (aqi <= 100) return 'Moderate';
      if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
      if (aqi <= 200) return 'Unhealthy';
      return 'Very Unhealthy';
    }
  };

  const getCityFromCoordinates = async (lat: number, lon: number): Promise<string> => {
    try {
      // Mock reverse geocoding - replace with actual service
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=mock_api_key`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data[0]?.name || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
    
    // Fallback to coordinates
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
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
    // Initialize Service Manager
    const initializeServices = async () => {
      try {
        serviceManagerRef.current = new ServiceManager();
        
        // Set up service callbacks
        serviceManagerRef.current.setCallbacks({
          onServiceWorkerUpdate: () => {
            console.log('Service Worker update detected');
            setUpdateAvailable(true);
          },
          onBackgroundSyncComplete: (queueSize) => {
            setSyncQueueSize(queueSize);
            console.log(`Background sync queue size: ${queueSize}`);
          },
          onNotificationPermissionChange: (permission) => {
            console.log(`Notification permission: ${permission}`);
          },
          onAppUpdateAvailable: (version) => {
            console.log(`App update available: ${version}`);
            setUpdateAvailable(true);
          },
          onServiceError: (service, error) => {
            console.error(`${service} error:`, error);
          }
        });
        
        // Initialize all services
        await serviceManagerRef.current.initialize();
        
        // Get initial service status
        const status = await serviceManagerRef.current.getStatus();
        setServiceStatus(status);
        
        console.log('Service Manager initialized successfully');
        
        // Don't get location automatically on page load
        // Location will only be updated when user clicks the location button
      } catch (error) {
        console.error('Failed to initialize Service Manager:', error);
      }
    };
    
    // Load saved alert settings
    const savedAlerts = localStorage.getItem('airQualityAlerts');
    if (savedAlerts) {
      try {
        setAlertSettings(JSON.parse(savedAlerts));
      } catch (error) {
        console.error('Failed to load saved alerts:', error);
      }
    }
    
    // Load saved health profile
    const savedHealthProfile = localStorage.getItem('healthProfile');
    if (savedHealthProfile) {
      try {
        const profile = JSON.parse(savedHealthProfile);
        setHealthProfile(profile);
        setHealthForm(profile);
      } catch (error) {
        console.error('Failed to load health profile:', error);
      }
    }
    
    initializeServices();
    
    // Cleanup on component unmount
    return () => {
      if (serviceManagerRef.current) {
        serviceManagerRef.current.destroy();
      }
    };
  }, []);

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
                {userLocation && (
                  <option value={userLocation.city}>📍 {userLocation.city} (Your Location)</option>
                )}
                <option value="New York, NY">New York, NY</option>
                <option value="Los Angeles, CA">Los Angeles, CA</option>
                <option value="Chicago, IL">Chicago, IL</option>
                <option value="Houston, TX">Houston, TX</option>
                <option value="Phoenix, AZ">Phoenix, AZ</option>
                <option value="Philadelphia, PA">Philadelphia, PA</option>
                <option value="San Antonio, TX">San Antonio, TX</option>
                <option value="San Diego, CA">San Diego, CA</option>
              </select>
              <button 
                onClick={getCurrentLocation}
                className="location-btn"
                title="Get my location"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </button>
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
              {serviceStatus && (
                <span className="service-info"> • SW: {serviceStatus.serviceWorker.isRegistered ? '✓' : '✗'}</span>
              )}
              {updateAvailable && (
                <span className="update-badge">Update Available</span>
              )}
              {syncQueueSize > 0 && (
                <span className="sync-badge">{syncQueueSize} pending</span>
              )}
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
                <h4>Health Map</h4>
                <div className="health" style={{ color: getAQIColor(airQualityData?.aqi || 0) }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/>
              </svg>
                </div>
              </div>
              <div className="insight-content">
                {/* Map Preview */}
                <div className="map-preview">
                  <div className="map-header">
                    <span className="map-title">North America Air Quality</span>
                    <button className="expand-map-btn" title="Expand Map (Coming Soon)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15,3 21,3 21,9"/>
                        <polyline points="9,21 3,21 3,15"/>
                        <line x1="21" y1="3" x2="14" y2="10"/>
                        <line x1="3" y1="21" x2="10" y2="14"/>
                      </svg>
                    </button>
                  </div>
                  <div className="map-container">
                    <div className="map-overlay">
                      <div className="map-gradient"></div>
                      <div className="map-locations">
                        <div className="location-marker location-good" style={{ top: '15%', left: '35%' }}>
                          <span className="marker-aqi">42</span>
                          <span className="marker-city">Toronto</span>
                        </div>
                        <div className="location-marker location-moderate" style={{ top: '70%', left: '18%' }}>
                          <span className="marker-aqi">78</span>
                          <span className="marker-city">Chicago</span>
                        </div>
                        <div className="location-marker location-unhealthy" style={{ top: '70%', left: '40%' }}>
                          <span className="marker-aqi">156</span>
                          <span className="marker-city">Atlanta</span>
                        </div>
                        <div className="location-marker location-good" style={{ top: '30%', left: '14%' }}>
                          <span className="marker-aqi">35</span>
                          <span className="marker-city">Seattle</span>
                        </div>
                        <div className="location-marker location-moderate" style={{ top: '65%', left: '75%' }}>
                          <span className="marker-aqi">89</span>
                          <span className="marker-city">NYC</span>
                        </div>
                        {userLocation && (
                          <div className="location-marker location-current" style={{ top: '30%', left: '50%' }}>
                            <span className="marker-aqi">{airQualityData?.aqi || '--'}</span>
                            <span className="marker-city">Your Location</span>
                          </div>
                        )}
                      </div>
                      <div className="map-legend">
                        <div className="legend-item">
                          <div className="legend-color good"></div>
                          <span>Good</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-color moderate"></div>
                          <span>Moderate</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-color unhealthy"></div>
                          <span>Unhealthy</span>
                        </div>
                      </div>
                    </div>
                    <div className="map-future-notice">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      <span>Interactive map coming soon</span>
                    </div>
                  </div>
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
          
          <button className="action-card" onClick={() => setShowAlertModal(true)}>
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
          
          {/* Health Assessment - Two Width Action Card */}
          <button className="action-card health-assessment-wide" onClick={() => setShowHealthModal(true)}>
            <div className="action-content">
              <div className="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/>
                </svg>
              </div>
              <div className="action-text">
                <span className="action-title">Do you have any health issues related to air quality?</span>
                <span className="action-subtitle">
                  {healthProfile ? 
                    'Update your health profile for personalized recommendations' : 
                    'Complete a quick health assessment for personalized air quality guidance'
                  }
                </span>
                {healthProfile && (
                  <div className="health-status-inline">
                    <span className="status-label">Current Risk Level:</span>
                    <span className={`status-value ${getHealthRiskLevel(airQualityData?.aqi || 0, healthProfile).toLowerCase().replace(/ /g, '-')}`}>
                      {getHealthRiskLevel(airQualityData?.aqi || 0, healthProfile)}
                    </span>
                  </div>
                )}
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
      
      {/* Alert Settings Modal */}
      {showAlertModal && (
        <div className="modal-overlay" onClick={() => setShowAlertModal(false)}>
          <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Air Quality Alerts</h3>
              <button className="close-btn" onClick={() => setShowAlertModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-content">
              {/* Existing Alerts */}
              <div className="existing-alerts">
                <h4>Active Alerts ({alertSettings.filter(a => a.enabled).length})</h4>
                {alertSettings.length === 0 ? (
                  <p className="no-alerts-message">No alerts configured yet.</p>
                ) : (
                  <div className="alerts-list">
                    {alertSettings.map(alert => (
                      <div key={alert.id} className={`alert-item ${alert.enabled ? 'enabled' : 'disabled'}`}>
                        <div className="alert-info">
                          <span className="alert-name">{alert.name}</span>
                          <span className="alert-details">
                            {alert.pollutant.toUpperCase()} {alert.condition} {alert.aqiThreshold}
                          </span>
                        </div>
                        <div className="alert-controls">
                          <button 
                            className={`toggle-btn ${alert.enabled ? 'enabled' : 'disabled'}`}
                            onClick={() => toggleAlert(alert.id)}
                          >
                            {alert.enabled ? 'ON' : 'OFF'}
                          </button>
                          <button className="delete-btn" onClick={() => deleteAlert(alert.id)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Create New Alert */}
              <div className="new-alert-section">
                <h4>Create New Alert</h4>
                <div className="alert-form">
                  <div className="form-group">
                    <label>Alert Name</label>
                    <input 
                      type="text" 
                      value={newAlert.name || ''}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., High PM2.5 Warning"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Pollutant</label>
                      <select 
                        value={newAlert.pollutant || 'aqi'}
                        onChange={(e) => setNewAlert(prev => ({ ...prev, pollutant: e.target.value as any }))}
                      >
                        <option value="aqi">AQI</option>
                        <option value="pm25">PM2.5</option>
                        <option value="pm10">PM10</option>
                        <option value="o3">Ozone</option>
                        <option value="no2">NO2</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Condition</label>
                      <select 
                        value={newAlert.condition || 'above'}
                        onChange={(e) => setNewAlert(prev => ({ ...prev, condition: e.target.value as any }))}
                      >
                        <option value="above">Above</option>
                        <option value="below">Below</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Threshold</label>
                      <input 
                        type="number" 
                        value={newAlert.aqiThreshold || 100}
                        onChange={(e) => setNewAlert(prev => ({ ...prev, aqiThreshold: parseInt(e.target.value) }))}
                        min="0"
                        max="500"
                      />
                    </div>
                  </div>
                  
                  <div className="form-options">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={newAlert.notificationEnabled ?? true}
                        onChange={(e) => setNewAlert(prev => ({ ...prev, notificationEnabled: e.target.checked }))}
                      />
                      Enable push notifications
                    </label>
                  </div>
                  
                  <button className="create-alert-btn" onClick={createAlert} disabled={!newAlert.name?.trim()}>
                    Create Alert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Health Assessment Modal */}
      {showHealthModal && (
        <div className="modal-overlay" onClick={() => setShowHealthModal(false)}>
          <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Health Assessment</h3>
              <button className="close-btn" onClick={() => setShowHealthModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-content">
              <div className="health-intro">
                <p>Help us provide personalized air quality recommendations based on your health profile.</p>
                {healthProfile && (
                  <div className="current-risk">
                    <span className="risk-label">Current Risk Level:</span>
                    <span className="risk-value">{getHealthRiskLevel(airQualityData?.aqi || 0, healthProfile)}</span>
                  </div>
                )}
              </div>
              
              <div className="health-form">
                <div className="form-section">
                  <h4>Medical Conditions</h4>
                  <div className="checkbox-grid">
                    <label className="health-checkbox">
                      <input 
                        type="checkbox" 
                        checked={healthForm.hasAsthma || false}
                        onChange={(e) => setHealthForm(prev => ({ ...prev, hasAsthma: e.target.checked }))}
                      />
                      <span>Asthma</span>
                    </label>
                    
                    <label className="health-checkbox">
                      <input 
                        type="checkbox" 
                        checked={healthForm.hasAllergies || false}
                        onChange={(e) => setHealthForm(prev => ({ ...prev, hasAllergies: e.target.checked }))}
                      />
                      <span>Allergies</span>
                    </label>
                    
                    <label className="health-checkbox">
                      <input 
                        type="checkbox" 
                        checked={healthForm.hasHeartCondition || false}
                        onChange={(e) => setHealthForm(prev => ({ ...prev, hasHeartCondition: e.target.checked }))}
                      />
                      <span>Heart Condition</span>
                    </label>
                    
                    <label className="health-checkbox">
                      <input 
                        type="checkbox" 
                        checked={healthForm.hasRespiratoryIssues || false}
                        onChange={(e) => setHealthForm(prev => ({ ...prev, hasRespiratoryIssues: e.target.checked }))}
                      />
                      <span>Respiratory Issues</span>
                    </label>
                  </div>
                </div>
                
                <div className="form-section">
                  <h4>Lifestyle & Sensitivity</h4>
                  <div className="checkbox-grid">
                    <label className="health-checkbox">
                      <input 
                        type="checkbox" 
                        checked={healthForm.exerciseOutdoors || false}
                        onChange={(e) => setHealthForm(prev => ({ ...prev, exerciseOutdoors: e.target.checked }))}
                      />
                      <span>Exercise Outdoors</span>
                    </label>
                    
                    <label className="health-checkbox">
                      <input 
                        type="checkbox" 
                        checked={healthForm.sensitiveToPollution || false}
                        onChange={(e) => setHealthForm(prev => ({ ...prev, sensitiveToPollution: e.target.checked }))}
                      />
                      <span>Sensitive to Pollution</span>
                    </label>
                    
                    <label className="health-checkbox">
                      <input 
                        type="checkbox" 
                        checked={healthForm.takesAirQualityMeds || false}
                        onChange={(e) => setHealthForm(prev => ({ ...prev, takesAirQualityMeds: e.target.checked }))}
                      />
                      <span>Takes Air Quality Medications</span>
                    </label>
                  </div>
                </div>
                
                <div className="form-section">
                  <h4>Demographics</h4>
                  <div className="form-group">
                    <label>Age Group</label>
                    <select 
                      value={healthForm.ageGroup || '18-40'}
                      onChange={(e) => setHealthForm(prev => ({ ...prev, ageGroup: e.target.value as any }))}
                    >
                      <option value="under-18">Under 18</option>
                      <option value="18-40">18-40</option>
                      <option value="41-65">41-65</option>
                      <option value="over-65">Over 65</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-section">
                  <h4>Additional Information</h4>
                  <div className="form-group">
                    <label>Other conditions or notes</label>
                    <textarea 
                      value={healthForm.additionalConditions || ''}
                      onChange={(e) => setHealthForm(prev => ({ ...prev, additionalConditions: e.target.value }))}
                      placeholder="Any other health conditions or notes regarding air quality sensitivity..."
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button className="save-health-btn" onClick={saveHealthProfile}>
                    {healthProfile ? 'Update Profile' : 'Save Profile'}
                  </button>
                  <div className="privacy-note">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    <span>Your health information is stored locally and never shared.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
