import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions
} from 'chart.js';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Interface definitions
interface WeatherData {
  timestamp: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
}

interface AirQualityData {
  timestamp: string;
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
}

interface SatelliteData {
  timestamp: string;
  visibility: number;
  cloud_cover: number;
  aerosol_optical_depth: number;
}

interface HealthData {
  timestamp: string;
  overall_health_index: number;
  respiratory_risk: number;
  cardiovascular_risk: number;
}

interface ForecastData {
  hour: string;
  predicted_aqi: number;
  confidence: number;
}

interface StatusData {
  api_status: string;
  data_freshness: number;
  last_update: string;
}

interface LocationInfo {
  name: string;
  country: string;
  timezone: string;
  local_time: string;
}

interface Location {
  name: string;
  lat: number;
  lon: number;
  country: string;
  timezone: string;
}

interface DashboardData {
  weather: WeatherData[];
  air_quality: AirQualityData[];
  satellite: SatelliteData[];
  health: HealthData[];
  forecast: ForecastData[];
  status: StatusData;
  location_info?: LocationInfo;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('New York');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'weather' | 'air-quality' | 'satellite' | 'health' | 'forecast'>('overview');

  useEffect(() => {
    fetchAvailableLocations();
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedLocation]);

  const fetchAvailableLocations = async () => {
    try {
      const response = await fetch('/api/locations');
      if (response.ok) {
        const locationData = await response.json();
        setLocations(locationData.locations || []);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/dashboard?location=${encodeURIComponent(selectedLocation)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result || Object.keys(result).length === 0) {
        throw new Error('No data received from server');
      }
      
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      
      // Generate fallback data for development
      const fallbackData: DashboardData = {
        weather: Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
          temperature: 20 + Math.sin(i / 4) * 8 + Math.random() * 4,
          humidity: 50 + Math.sin(i / 6) * 20 + Math.random() * 10,
          windSpeed: 5 + Math.random() * 10,
          pressure: 1010 + Math.sin(i / 8) * 15 + Math.random() * 5
        })),
        air_quality: Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
          aqi: 80 + Math.sin(i / 3) * 30 + Math.random() * 20,
          pm25: 15 + Math.random() * 20,
          pm10: 25 + Math.random() * 30,
          o3: 40 + Math.random() * 20,
          no2: 20 + Math.random() * 15,
          so2: 5 + Math.random() * 10
        })),
        satellite: Array.from({ length: 24 }, (_, i) => {
          const satelliteData = {
            timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
            visibility: Math.max(1, 8 + Math.sin(i * 0.3) * 3 + Math.random() * 2),
            cloud_cover: Math.max(0, Math.min(100, 30 + Math.sin(i * 0.25) * 40 + Math.random() * 20)),
            aerosol_optical_depth: Math.max(0.05, 0.2 + Math.sin(i * 0.4) * 0.3 + Math.random() * 0.1)
          };
          return satelliteData;
        }),
        health: Array.from({ length: 12 }, (_, i) => ({
          timestamp: new Date(Date.now() - (11 - i) * 2 * 60 * 60 * 1000).toISOString(),
          overall_health_index: 7 + Math.random() * 2,
          respiratory_risk: 3 + Math.random() * 4,
          cardiovascular_risk: 2 + Math.random() * 3
        })),
        forecast: Array.from({ length: 12 }, (_, i) => ({
          hour: `${(new Date().getHours() + i + 1) % 24}:00`,
          predicted_aqi: 85 + Math.sin(i / 2) * 25 + Math.random() * 15,
          confidence: 75 + Math.random() * 20
        })),
        status: {
          api_status: 'Connected',
          data_freshness: 85 + Math.random() * 10,
          last_update: new Date().toISOString()
        },
        location_info: {
          name: selectedLocation,
          country: 'Simulated',
          timezone: 'UTC',
          local_time: new Date().toLocaleTimeString()
        }
      };
      
      setData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const getChartOptions = (yAxisLabel: string, showLegend: boolean = true): ChartOptions<'line' | 'bar'> => ({
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2,
    animation: {
      duration: 1200,
      easing: 'easeInOutQuart'
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 5,
        right: 5
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
        labels: {
          color: '#1976d2',
          font: {
            family: 'Montserrat',
            size: 12,
            weight: 600
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1976d2',
        bodyColor: '#333',
        borderColor: '#1976d2',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        titleFont: {
          family: 'Montserrat',
          size: 14,
          weight: 600
        },
        bodyFont: {
          family: 'Montserrat',
          size: 12
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
          color: '#1976d2',
          font: {
            family: 'Montserrat',
            size: 12,
            weight: 600
          }
        },
        ticks: {
          color: '#1976d2',
          font: {
            family: 'Montserrat',
            size: 10
          }
        },
        grid: {
          color: 'rgba(25, 118, 210, 0.1)'
        }
      },
      y: {
        title: {
          display: true,
          text: yAxisLabel,
          color: '#1976d2',
          font: {
            family: 'Montserrat',
            size: 12,
            weight: 600
          }
        },
        ticks: {
          color: '#1976d2',
          font: {
            family: 'Montserrat',
            size: 10
          }
        },
        grid: {
          color: 'rgba(25, 118, 210, 0.1)'
        },
        grace: '5%'
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 5,
        hoverRadius: 8,
        borderWidth: 2,
        hoverBorderWidth: 3
      }
    }
  });

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading NASA Air Quality Data...</h2>
          <p>Fetching latest satellite and ground station data</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <h2>⚠️ Data Unavailable</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  const timeLabels = data?.weather?.map(item =>
    new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  ) || [];

  const forecastLabels = data?.forecast?.map(item => item.hour) || [];

  // Debug satellite data
  if (data?.satellite && selectedTab === 'satellite') {
    console.log('Satellite data length:', data.satellite.length);
    console.log('Satellite visibility values:', data.satellite.map(item => item.visibility));
    console.log('Time labels length:', timeLabels.length);
  }

  return (
    <div className="dashboard-container">
      <div className="global-background">
        <div className="floating-particles">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${10 + Math.random() * 20}s`
              }}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={fetchDashboardData} className="retry-btn-small">
            🔄 Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="title-section">
            <h1>🌍 NASA Air Quality Dashboard</h1>
            <p>Real-time environmental monitoring with satellite data integration</p>
            {data?.location_info && (
              <div className="location-info-header">
                <span className="location-name">📍 {data.location_info.name}, {data.location_info.country}</span>
                <span className="local-time">🕒 {data.location_info.local_time}</span>
              </div>
            )}
          </div>
          
          <div className="status-section">
            <div className="status-card">
              <span className="status-label">API Status</span>
              <span className="status-value">{data?.status.api_status || 'Connected'}</span>
            </div>
            <div className="status-card">
              <span className="status-label">Data Quality</span>
              <span className="status-value">{data?.status.data_freshness?.toFixed(1) || '95.0'}%</span>
            </div>
            <div className="status-card">
              <span className="status-label">Last Update</span>
              <span className="status-value">
                {data?.status.last_update ? new Date(data.status.last_update).toLocaleTimeString() : 'Just now'}
              </span>
            </div>
            
            <div className="location-selector">
              <label htmlFor="location-select">Location:</label>
              <select
                id="location-select"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="location-dropdown"
              >
                {locations.map((location) => (
                  <option key={location.name} value={location.name}>
                    {location.name}, {location.country}
                  </option>
                ))}
              </select>
              {data?.location_info && (
                <div className="location-info">
                  <div className="coordinates">
                    {locations.find(l => l.name === selectedLocation)?.lat.toFixed(2)}°, {locations.find(l => l.name === selectedLocation)?.lon.toFixed(2)}°
                  </div>
                  <div className="timezone">{data.location_info.timezone}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="dashboard-nav">
        <div className="nav-container">
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'weather', label: 'Weather', icon: '🌤️' },
            { key: 'air-quality', label: 'Air Quality', icon: '🌬️' },
            { key: 'satellite', label: 'Satellite', icon: '🛰️' },
            { key: 'health', label: 'Health', icon: '💚' },
            { key: 'forecast', label: 'Forecast', icon: '🔮' }
          ].map((tab) => (
            <button
              key={tab.key}
              className={`nav-tab ${selectedTab === tab.key ? 'active' : ''}`}
              onClick={() => setSelectedTab(tab.key as any)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {selectedTab === 'overview' && (
          <div className="overview-grid">
            {/* Air Quality Index Trend */}
            <div className="chart-container">
              <h3>Air Quality Index Trend</h3>
              <div className="chart-wrapper">
                <Line
                  data={{
                    labels: timeLabels,
                    datasets: [{
                      label: 'AQI',
                      data: data?.air_quality?.map(item => item.aqi) || [],
                      borderColor: '#1976d2',
                      backgroundColor: 'rgba(25, 118, 210, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: '#1976d2',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    }]
                  }}
                  options={getChartOptions('AQI', true)}
                />
              </div>
            </div>

            {/* Current Air Quality Breakdown */}
            <div className="chart-container">
              <h3>Current Air Quality Breakdown</h3>
              <Bar
                data={{
                  labels: ['PM2.5', 'PM10', 'O₃', 'NO₂', 'SO₂'],
                  datasets: [{
                    label: 'Concentration (μg/m³)',
                    data: [
                      data?.air_quality?.[data.air_quality.length - 1]?.pm25 || 0,
                      data?.air_quality?.[data.air_quality.length - 1]?.pm10 || 0,
                      data?.air_quality?.[data.air_quality.length - 1]?.o3 || 0,
                      data?.air_quality?.[data.air_quality.length - 1]?.no2 || 0,
                      data?.air_quality?.[data.air_quality.length - 1]?.so2 || 0,
                    ],
                    backgroundColor: [
                      'rgba(255, 99, 132, 0.8)',
                      'rgba(54, 162, 235, 0.8)',
                      'rgba(255, 205, 86, 0.8)',
                      'rgba(75, 192, 192, 0.8)',
                      'rgba(153, 102, 255, 0.8)'
                    ],
                    borderColor: [
                      '#ff6384',
                      '#36a2eb',
                      '#ffcd56',
                      '#4bc0c0',
                      '#9966ff'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                  }]
                }}
                options={getChartOptions('Concentration (μg/m³)', false)}
              />
            </div>

            {/* Temperature & Humidity Combined */}
            <div className="chart-container">
              <h3>Temperature & Humidity (Last 12 Hours)</h3>
              <Line
                data={{
                  labels: timeLabels.slice(-12),
                  datasets: [
                    {
                      label: 'Temperature (°C)',
                      data: data?.weather?.slice(-12).map(item => item.temperature) || [],
                      borderColor: '#ff6384',
                      backgroundColor: 'rgba(255, 99, 132, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      yAxisID: 'y',
                      pointBackgroundColor: '#ff6384',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    },
                    {
                      label: 'Humidity (%)',
                      data: data?.weather?.slice(-12).map(item => item.humidity) || [],
                      borderColor: '#36a2eb',
                      backgroundColor: 'rgba(54, 162, 235, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      yAxisID: 'y1',
                      pointBackgroundColor: '#36a2eb',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    }
                  ]
                }}
                options={{
                  ...getChartOptions('Temperature (°C)', true),
                  scales: {
                    x: {
                      title: { display: true, text: 'Time', color: '#1976d2', font: { family: 'Montserrat' } },
                      ticks: { color: '#1976d2' },
                      grid: { color: 'rgba(25, 118, 210, 0.1)' }
                    },
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      title: { display: true, text: 'Temperature (°C)', color: '#ff6384', font: { family: 'Montserrat' } },
                      ticks: { color: '#ff6384' },
                      grid: { color: 'rgba(255, 99, 132, 0.1)' }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      title: { display: true, text: 'Humidity (%)', color: '#36a2eb', font: { family: 'Montserrat' } },
                      ticks: { color: '#36a2eb' },
                      grid: { drawOnChartArea: false }
                    }
                  }
                } as ChartOptions<'line'>}
              />
            </div>

            {/* Health Impact Trends */}
            <div className="chart-container">
              <h3>Health Impact Assessment</h3>
              <Line
                data={{
                  labels: timeLabels.slice(-12),
                  datasets: [
                    {
                      label: 'Overall Health Index',
                      data: data?.health?.slice(-12).map(item => item.overall_health_index) || [],
                      borderColor: '#4caf50',
                      backgroundColor: 'rgba(76, 175, 80, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: '#4caf50',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    },
                    {
                      label: 'Respiratory Risk',
                      data: data?.health?.slice(-12).map(item => item.respiratory_risk) || [],
                      borderColor: '#ff9800',
                      backgroundColor: 'rgba(255, 152, 0, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: '#ff9800',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    }
                  ]
                }}
                options={getChartOptions('Index/Risk Level', true)}
              />
            </div>
          </div>
        )}

        {selectedTab === 'weather' && (
          <div className="content-grid">
            {/* Temperature Trend */}
            <div className="chart-container">
              <h3>Temperature Trend (24 Hours)</h3>
              <Line
                data={{
                  labels: timeLabels,
                  datasets: [{
                    label: 'Temperature (°C)',
                    data: data?.weather?.map(item => item.temperature) || [],
                    borderColor: '#ff6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.15)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#ff6384',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8
                  }]
                }}
                options={getChartOptions('Temperature (°C)', false)}
              />
            </div>

            {/* Humidity Trend */}
            <div className="chart-container">
              <h3>Humidity Trend (24 Hours)</h3>
              <Line
                data={{
                  labels: timeLabels,
                  datasets: [{
                    label: 'Humidity (%)',
                    data: data?.weather?.map(item => item.humidity) || [],
                    borderColor: '#36a2eb',
                    backgroundColor: 'rgba(54, 162, 235, 0.15)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#36a2eb',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8
                  }]
                }}
                options={getChartOptions('Humidity (%)', false)}
              />
            </div>

            {/* Wind Speed & Pressure */}
            <div className="chart-container">
              <h3>Wind Speed & Atmospheric Pressure</h3>
              <Line
                data={{
                  labels: timeLabels,
                  datasets: [
                    {
                      label: 'Wind Speed (m/s)',
                      data: data?.weather?.map(item => item.windSpeed) || [],
                      borderColor: '#4bc0c0',
                      backgroundColor: 'rgba(75, 192, 192, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      yAxisID: 'y',
                      pointBackgroundColor: '#4bc0c0',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    },
                    {
                      label: 'Pressure (hPa)',
                      data: data?.weather?.map(item => item.pressure) || [],
                      borderColor: '#9966ff',
                      backgroundColor: 'rgba(153, 102, 255, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      yAxisID: 'y1',
                      pointBackgroundColor: '#9966ff',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    }
                  ]
                }}
                options={{
                  ...getChartOptions('Wind Speed (m/s)', true),
                  scales: {
                    x: {
                      title: { display: true, text: 'Time', color: '#1976d2', font: { family: 'Montserrat' } },
                      ticks: { color: '#1976d2' },
                      grid: { color: 'rgba(25, 118, 210, 0.1)' }
                    },
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      title: { display: true, text: 'Wind Speed (m/s)', color: '#4bc0c0', font: { family: 'Montserrat' } },
                      ticks: { color: '#4bc0c0' },
                      grid: { color: 'rgba(75, 192, 192, 0.1)' }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      title: { display: true, text: 'Pressure (hPa)', color: '#9966ff', font: { family: 'Montserrat' } },
                      ticks: { color: '#9966ff' },
                      grid: { drawOnChartArea: false }
                    }
                  }
                } as ChartOptions<'line'>}
              />
            </div>
          </div>
        )}

        {selectedTab === 'air-quality' && (
          <div className="content-grid">
            {/* AQI Trend */}
            <div className="chart-container">
              <h3>Air Quality Index Trend</h3>
              <Line
                data={{
                  labels: timeLabels,
                  datasets: [{
                    label: 'AQI',
                    data: data?.air_quality?.map(item => item.aqi) || [],
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25, 118, 210, 0.15)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#1976d2',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8
                  }]
                }}
                options={getChartOptions('AQI', true)}
              />
            </div>

            {/* Particulate Matter */}
            <div className="chart-container">
              <h3>Particulate Matter (PM2.5 & PM10)</h3>
              <Line
                data={{
                  labels: timeLabels,
                  datasets: [
                    {
                      label: 'PM2.5 (μg/m³)',
                      data: data?.air_quality?.map(item => item.pm25) || [],
                      borderColor: '#ff6384',
                      backgroundColor: 'rgba(255, 99, 132, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: '#ff6384',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    },
                    {
                      label: 'PM10 (μg/m³)',
                      data: data?.air_quality?.map(item => item.pm10) || [],
                      borderColor: '#36a2eb',
                      backgroundColor: 'rgba(54, 162, 235, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: '#36a2eb',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    }
                  ]
                }}
                options={getChartOptions('Concentration (μg/m³)', true)}
              />
            </div>

            {/* Gas Concentrations */}
            <div className="chart-container">
              <h3>Gas Concentrations (O₃, NO₂, SO₂)</h3>
              <Line
                data={{
                  labels: timeLabels,
                  datasets: [
                    {
                      label: 'O₃ (μg/m³)',
                      data: data?.air_quality?.map(item => item.o3) || [],
                      borderColor: '#ffcd56',
                      backgroundColor: 'rgba(255, 205, 86, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: '#ffcd56',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    },
                    {
                      label: 'NO₂ (μg/m³)',
                      data: data?.air_quality?.map(item => item.no2) || [],
                      borderColor: '#4bc0c0',
                      backgroundColor: 'rgba(75, 192, 192, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: '#4bc0c0',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    },
                    {
                      label: 'SO₂ (μg/m³)',
                      data: data?.air_quality?.map(item => item.so2) || [],
                      borderColor: '#9966ff',
                      backgroundColor: 'rgba(153, 102, 255, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: '#9966ff',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    }
                  ]
                }}
                options={getChartOptions('Concentration (μg/m³)', true)}
              />
            </div>
          </div>
        )}

        {selectedTab === 'satellite' && (
          <div className="content-grid">
            {/* Atmospheric Visibility */}
            <div className="chart-container">
              <h3>Atmospheric Visibility</h3>
              <div className="chart-wrapper">
                <Line
                  data={{
                    labels: timeLabels,
                    datasets: [{
                      label: 'Visibility (km)',
                      data: data?.satellite?.map(item => {
                        const visibility = Number(item.visibility);
                        return isNaN(visibility) ? 0 : visibility;
                      }) || [],
                      borderColor: '#4caf50',
                      backgroundColor: 'rgba(76, 175, 80, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: '#4caf50',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    }]
                  }}
                  options={getChartOptions('Visibility (km)', false)}
                />
              </div>
            </div>

            {/* Cloud Cover */}
            <div className="chart-container">
              <h3>Cloud Cover</h3>
              <div className="chart-wrapper">
                <Line
                  data={{
                    labels: timeLabels,
                    datasets: [{
                      label: 'Cloud Cover (%)',
                      data: data?.satellite?.map(item => item.cloud_cover) || [],
                      borderColor: '#607d8b',
                      backgroundColor: 'rgba(96, 125, 139, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: '#607d8b',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    }]
                  }}
                  options={getChartOptions('Coverage (%)', false)}
                />
              </div>
            </div>

            {/* Aerosol Optical Depth */}
            <div className="chart-container">
              <h3>Aerosol Optical Depth</h3>
              <div className="chart-wrapper">
                <Line
                  data={{
                    labels: timeLabels,
                    datasets: [{
                      label: 'AOD',
                      data: data?.satellite?.map(item => item.aerosol_optical_depth) || [],
                      borderColor: '#ff5722',
                      backgroundColor: 'rgba(255, 87, 34, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: '#ff5722',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    }]
                  }}
                  options={getChartOptions('AOD', false)}
                />
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'health' && (
          <div className="content-grid">
            {/* Health Index */}
            <div className="chart-container">
              <h3>Overall Health Index</h3>
              <div className="chart-wrapper">
                <Line
                  data={{
                    labels: timeLabels.slice(-12),
                    datasets: [{
                      label: 'Health Index',
                      data: data?.health?.map(item => item.overall_health_index) || [],
                      borderColor: '#4caf50',
                      backgroundColor: 'rgba(76, 175, 80, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: '#4caf50',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    }]
                  }}
                  options={getChartOptions('Index (0-10)', false)}
                />
              </div>
            </div>

            {/* Respiratory Risk */}
            <div className="chart-container">
              <h3>Respiratory Risk Assessment</h3>
              <div className="chart-wrapper">
                <Line
                  data={{
                    labels: timeLabels.slice(-12),
                    datasets: [{
                      label: 'Respiratory Risk',
                      data: data?.health?.map(item => item.respiratory_risk) || [],
                      borderColor: '#ff9800',
                      backgroundColor: 'rgba(255, 152, 0, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: '#ff9800',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    }]
                  }}
                  options={getChartOptions('Risk Level (0-10)', false)}
                />
              </div>
            </div>

            {/* Cardiovascular Risk */}
            <div className="chart-container">
              <h3>Cardiovascular Risk Assessment</h3>
              <div className="chart-wrapper">
                <Line
                  data={{
                    labels: timeLabels.slice(-12),
                    datasets: [{
                      label: 'Cardiovascular Risk',
                      data: data?.health?.map(item => item.cardiovascular_risk) || [],
                      borderColor: '#f44336',
                      backgroundColor: 'rgba(244, 67, 54, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: '#f44336',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    }]
                  }}
                  options={getChartOptions('Risk Level (0-10)', false)}
                />
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'forecast' && (
          <div className="content-grid">
            {/* AQI Forecast */}
            <div className="chart-container">
              <h3>24-Hour AQI Forecast</h3>
              <Line
                data={{
                  labels: forecastLabels,
                  datasets: [
                    {
                      label: 'Predicted AQI',
                      data: data?.forecast?.map(item => item.predicted_aqi) || [],
                      borderColor: '#1976d2',
                      backgroundColor: 'rgba(25, 118, 210, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      pointBackgroundColor: '#1976d2',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    },
                    {
                      label: 'Confidence Level (%)',
                      data: data?.forecast?.map(item => item.confidence) || [],
                      borderColor: '#4caf50',
                      backgroundColor: 'rgba(76, 175, 80, 0.15)',
                      borderWidth: 3,
                      tension: 0.4,
                      fill: true,
                      yAxisID: 'y1',
                      pointBackgroundColor: '#4caf50',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    }
                  ]
                }}
                options={{
                  ...getChartOptions('Predicted AQI', true),
                  scales: {
                    x: {
                      title: { display: true, text: 'Time', color: '#1976d2', font: { family: 'Montserrat' } },
                      ticks: { color: '#1976d2' },
                      grid: { color: 'rgba(25, 118, 210, 0.1)' }
                    },
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      title: { display: true, text: 'AQI', color: '#1976d2', font: { family: 'Montserrat' } },
                      ticks: { color: '#1976d2' },
                      grid: { color: 'rgba(25, 118, 210, 0.1)' }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      title: { display: true, text: 'Confidence (%)', color: '#4caf50', font: { family: 'Montserrat' } },
                      ticks: { color: '#4caf50' },
                      grid: { drawOnChartArea: false }
                    }
                  }
                } as ChartOptions<'line'>}
              />
            </div>

            {/* Forecast Summary */}
            <div className="chart-container">
              <h3>Forecast Summary</h3>
              <Bar
                data={{
                  labels: forecastLabels,
                  datasets: [
                    {
                      label: 'Predicted AQI',
                      data: data?.forecast?.map(item => item.predicted_aqi) || [],
                      backgroundColor: data?.forecast?.map(item => {
                        const aqi = item.predicted_aqi;
                        if (aqi <= 50) return 'rgba(76, 175, 80, 0.8)'; // Good - Green
                        if (aqi <= 100) return 'rgba(255, 235, 59, 0.8)'; // Moderate - Yellow
                        if (aqi <= 150) return 'rgba(255, 152, 0, 0.8)'; // Unhealthy for Sensitive - Orange
                        if (aqi <= 200) return 'rgba(244, 67, 54, 0.8)'; // Unhealthy - Red
                        return 'rgba(156, 39, 176, 0.8)'; // Very Unhealthy - Purple
                      }) || [],
                      borderColor: data?.forecast?.map(item => {
                        const aqi = item.predicted_aqi;
                        if (aqi <= 50) return 'rgba(76, 175, 80, 1)';
                        if (aqi <= 100) return 'rgba(255, 235, 59, 1)';
                        if (aqi <= 150) return 'rgba(255, 152, 0, 1)';
                        if (aqi <= 200) return 'rgba(244, 67, 54, 1)';
                        return 'rgba(156, 39, 176, 1)';
                      }) || [],
                      borderWidth: 2,
                      borderRadius: 4,
                      borderSkipped: false,
                    },
                    {
                      label: 'Confidence %',
                      data: data?.forecast?.map(item => item.confidence) || [],
                      backgroundColor: 'rgba(158, 158, 158, 0.3)',
                      borderColor: 'rgba(158, 158, 158, 0.8)',
                      borderWidth: 1,
                      borderRadius: 2,
                      yAxisID: 'y1',
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                      labels: {
                        color: '#ffffff',
                        font: { size: 12 },
                        usePointStyle: true,
                        pointStyle: 'rect'
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleColor: '#ffffff',
                      bodyColor: '#ffffff',
                      borderColor: '#4fc3f7',
                      borderWidth: 1,
                      callbacks: {
                        afterBody: function(context) {
                          if (context[0].datasetIndex === 0) {
                            const aqi = context[0].parsed.y;
                            let status = '';
                            if (aqi <= 50) status = 'Good';
                            else if (aqi <= 100) status = 'Moderate';
                            else if (aqi <= 150) status = 'Unhealthy for Sensitive Groups';
                            else if (aqi <= 200) status = 'Unhealthy';
                            else status = 'Very Unhealthy';
                            return [`Air Quality: ${status}`];
                          }
                          return [];
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      ticks: { color: '#ffffff', font: { size: 11 } },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                      type: 'linear' as const,
                      display: true,
                      position: 'left' as const,
                      title: {
                        display: true,
                        text: 'AQI Value',
                        color: '#ffffff',
                        font: { size: 12 }
                      },
                      ticks: { 
                        color: '#ffffff',
                        font: { size: 11 },
                        stepSize: 25
                      },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                      min: 0,
                      max: 300
                    },
                    y1: {
                      type: 'linear' as const,
                      display: true,
                      position: 'right' as const,
                      title: {
                        display: true,
                        text: 'Confidence %',
                        color: '#ffffff',
                        font: { size: 12 }
                      },
                      ticks: { 
                        color: '#ffffff',
                        font: { size: 11 }
                      },
                      grid: { drawOnChartArea: false },
                      min: 0,
                      max: 100
                    }
                  },
                  interaction: {
                    mode: 'index' as const,
                    intersect: false,
                  }
                } as ChartOptions<'bar'>}
              />
            </div>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <button className="refresh-btn" onClick={fetchDashboardData} title="Refresh Data">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
        </svg>
      </button>
    </div>
  );
};

export default Dashboard;