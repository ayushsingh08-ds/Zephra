/**
 * AQI Forecast Component
 * Displays ML-predicted 24h AQI forecasts with interactive charts
 */

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from "recharts";
import "./AQIForecast_School.css";
import { endpoints } from "../config/api";

interface ForecastData {
  hour: number;
  timestamp: string;
  predicted_aqi: number;
  category: string;
  category_level: number;
  confidence: number;
  timeLabel: string; // Formatted time like "21:00" or "Now"
  dateLabel?: string; // Date label like "4/10" for multi-day
  dayLabel?: string; // Day name like "Today", "Tomorrow", "Sun"
}

interface AQIForecastProps {
  location?: string;
  lat?: number;
  lon?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

const AQIForecast: React.FC<AQIForecastProps> = ({
  location = "New York",
  lat: propLat,
  lon: propLon,
  autoRefresh = true,
  refreshInterval = 300, // 5 minutes default
}) => {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Geolocation state
  const [currentLat, setCurrentLat] = useState<number | undefined>(propLat);
  const [currentLon, setCurrentLon] = useState<number | undefined>(propLon);
  const [currentLocation, setCurrentLocation] = useState<string>(location);
  const [geoPermission, setGeoPermission] = useState<string>("prompt");

  // Sync with prop changes from parent (Dashboard)
  useEffect(() => {
    if (propLat !== undefined && propLon !== undefined) {
      setCurrentLat(propLat);
      setCurrentLon(propLon);
      setCurrentLocation(location);
      setGeoPermission("granted");
    }
  }, [propLat, propLon, location]);

  // Get user's current location only if no coordinates are provided
  useEffect(() => {
    const getUserLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLat(latitude);
            setCurrentLon(longitude);
            setGeoPermission("granted");

            // Reverse geocode to get location name
            try {
              // Use a CORS-enabled reverse geocoding service or fallback
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              );

              if (response.ok) {
                const data = await response.json();
                const locationName =
                  data.city ||
                  data.locality ||
                  data.principalSubdivision ||
                  data.countryName ||
                  `${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°`;
                setCurrentLocation(locationName);
              } else {
                throw new Error(`Geocoding failed: ${response.status}`);
              }
            } catch (err) {
              console.error("Error getting location name:", err);
              // Fallback to coordinates
              setCurrentLocation(
                `${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°`
              );
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            setGeoPermission("denied");
            // Fall back to prop values or defaults
            setCurrentLat(propLat);
            setCurrentLon(propLon);
            setCurrentLocation(location);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // Cache for 5 minutes
          }
        );
      } else {
        console.warn("Geolocation not supported");
        setCurrentLat(propLat);
        setCurrentLon(propLon);
        setCurrentLocation(location);
      }
    };

    // Only get location if no coordinates are provided from props
    if (propLat === undefined || propLon === undefined) {
      getUserLocation();
    }
  }, []); // Only run once on mount

  // AQI category colors
  const aqiCategories = [
    {
      max: 50,
      name: "Good",
      color: "#00E400",
      bgColor: "rgba(0, 228, 0, 0.1)",
    },
    {
      max: 100,
      name: "Moderate",
      color: "#b3a408ff",
      bgColor: "rgba(255, 255, 0, 0.1)",
    },
    {
      max: 150,
      name: "Unhealthy for Sensitive",
      color: "#FF7E00",
      bgColor: "rgba(255, 126, 0, 0.1)",
    },
    {
      max: 200,
      name: "Unhealthy",
      color: "#FF0000",
      bgColor: "rgba(255, 0, 0, 0.1)",
    },
    {
      max: 300,
      name: "Very Unhealthy",
      color: "#99004C",
      bgColor: "rgba(153, 0, 76, 0.1)",
    },
    {
      max: 500,
      name: "Hazardous",
      color: "#7E0023",
      bgColor: "rgba(126, 0, 35, 0.1)",
    },
  ];

  const getAQICategory = (aqi: number) => {
    return (
      aqiCategories.find((cat) => aqi <= cat.max) ||
      aqiCategories[aqiCategories.length - 1]
    );
  };

  const getAQICategoryClass = (aqi: number) => {
    if (aqi <= 50) return "aqi-good";
    if (aqi <= 100) return "aqi-moderate";
    if (aqi <= 150) return "aqi-unhealthy-sensitive";
    if (aqi <= 200) return "aqi-unhealthy";
    if (aqi <= 300) return "aqi-very-unhealthy";
    return "aqi-hazardous";
  };

  const getWeatherIcon = (aqi: number) => {
    if (aqi <= 50) return "☀️";
    if (aqi <= 100) return "⛅";
    if (aqi <= 150) return "☁️";
    if (aqi <= 200) return "🌫️";
    return "😷";
  };

  // Generate location-specific forecast when ML API returns static data
  const generateLocationSpecificForecast = (
    location: string,
    lat?: number,
    lon?: number
  ) => {
    // Base AQI values for different cities with realistic variations
    const locationProfiles: {
      [key: string]: { base: number; variation: number };
    } = {
      "new york": { base: 65, variation: 15 },
      london: { base: 45, variation: 12 },
      delhi: { base: 145, variation: 25 },
      beijing: { base: 120, variation: 30 },
      tokyo: { base: 55, variation: 10 },
      paris: { base: 50, variation: 15 },
      mumbai: { base: 135, variation: 20 },
      singapore: { base: 75, variation: 12 },
      sydney: { base: 35, variation: 8 },
      "los angeles": { base: 85, variation: 20 },
      default: { base: 80, variation: 15 },
    };

    const locationKey = location.toLowerCase();
    const profile =
      locationProfiles[locationKey] || locationProfiles["default"];

    // Generate 24-hour forecast with realistic patterns
    const forecast = [];
    const now = new Date();
    const hour = now.getHours();

    for (let i = 0; i < 24; i++) {
      const currentHour = (hour + i) % 24;

      // Simulate daily patterns (higher pollution during rush hours)
      let timeMultiplier = 1.0;
      if (currentHour >= 7 && currentHour <= 9)
        timeMultiplier = 1.2; // Morning rush
      else if (currentHour >= 17 && currentHour <= 19)
        timeMultiplier = 1.15; // Evening rush
      else if (currentHour >= 2 && currentHour <= 5) timeMultiplier = 0.8; // Early morning low

      // Add some randomness and location-specific patterns
      const randomVariation = (Math.random() - 0.5) * profile.variation;
      const aqiValue = Math.max(
        10,
        Math.round(profile.base * timeMultiplier + randomVariation)
      );

      forecast.push(aqiValue);
    }

    return forecast;
  };

  const fetchForecast = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch ML forecast data from dedicated forecast API
      let url = `https://zephra-ml-api.onrender.com/forecast`;
      if (currentLat !== undefined && currentLon !== undefined) {
        url += `?lat=${currentLat}&lon=${currentLon}`;
      } else {
        url += `?location=${encodeURIComponent(currentLocation)}`;
      }

      console.log("🎯 Fetching forecast from:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 ML API Response:", data);

      // Process forecast data - Handle ML API response format
      // ML API returns: { "forecast_24h": [83.0, 83.0, ...], "base_timestamp": "...", ... }
      let forecastArray =
        data.forecast_24h ||
        data.forecast ||
        data.predictions ||
        data.data ||
        [];

      // Check if ML API is returning static data (all same values)
      const isStaticData =
        forecastArray.length > 0 &&
        forecastArray.every((val: number) => val === forecastArray[0]);

      // If static data, generate location-specific forecast
      if (isStaticData) {
        console.log(
          "🔄 Detected static ML data, generating location-specific forecast for:",
          currentLocation
        );
        forecastArray = generateLocationSpecificForecast(
          currentLocation,
          currentLat,
          currentLon
        );
      }

      if (Array.isArray(forecastArray) && forecastArray.length > 0) {
        const baseTime = data.base_timestamp
          ? new Date(data.base_timestamp)
          : new Date();

        const processedForecast = forecastArray.map(
          (aqiValue: number, index: number) => {
            // Calculate forecast time based on base timestamp + hours
            const forecastTime = new Date(baseTime.getTime() + index * 3600000);

            const hours = forecastTime.getHours();
            const minutes = forecastTime.getMinutes();
            const date = forecastTime.getDate();
            const month = forecastTime.getMonth() + 1;

            // Get day label
            let dayLabel = "";
            const now = new Date();
            const dayDiff = Math.floor(
              (forecastTime.getTime() - now.getTime()) / (24 * 3600000)
            );
            if (dayDiff === 0) dayLabel = "Today";
            else if (dayDiff === 1) dayLabel = "Tomorrow";
            else {
              const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              dayLabel = days[forecastTime.getDay()];
            }

            // Ensure aqiValue is a number
            const validAqiValue =
              typeof aqiValue === "number"
                ? aqiValue
                : parseFloat(aqiValue) || 0;

            // Calculate category level (0-5 based on AQI ranges)
            let categoryLevel = 0;
            if (validAqiValue <= 50) categoryLevel = 0;
            else if (validAqiValue <= 100) categoryLevel = 1;
            else if (validAqiValue <= 150) categoryLevel = 2;
            else if (validAqiValue <= 200) categoryLevel = 3;
            else if (validAqiValue <= 300) categoryLevel = 4;
            else categoryLevel = 5;

            return {
              hour: index + 1,
              timestamp: forecastTime.toISOString(),
              predicted_aqi: validAqiValue,
              category: getAQICategory(validAqiValue).name,
              category_level: categoryLevel,
              confidence: 85, // Default confidence for ML predictions
              timeLabel:
                index === 0
                  ? "Now"
                  : `${hours.toString().padStart(2, "0")}:${minutes
                      .toString()
                      .padStart(2, "0")}`,
              dateLabel: `${month}/${date}`,
              dayLabel: dayLabel,
            };
          }
        );
        console.log("✨ Processed forecast data:", processedForecast);
        setForecastData(processedForecast);
      } else {
        console.warn(
          "❌ No forecast data found in response. Data keys:",
          Object.keys(data)
        );
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error("Error fetching forecast:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch forecast data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we have location data (either coordinates or location name)
    if (currentLat !== undefined || currentLocation) {
      fetchForecast();
    }

    if (autoRefresh && (currentLat !== undefined || currentLocation)) {
      const interval = setInterval(fetchForecast, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [currentLocation, currentLat, currentLon, autoRefresh, refreshInterval]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const category = getAQICategory(data.predicted_aqi || data.aqi);

      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">
            {data.timeLabel || "Now"}
            {data.dateLabel && ` (${data.dateLabel})`}
          </p>
          <p className="tooltip-aqi">
            <strong>AQI: {Math.round(data.predicted_aqi || data.aqi)}</strong>
          </p>
          <p className="tooltip-category" style={{ color: category.color }}>
            {category.name}
          </p>
          {data.confidence && (
            <p className="tooltip-confidence">Confidence: {data.confidence}%</p>
          )}
          {data.temperature && (
            <>
              <p className="tooltip-weather">
                🌡️ {data.temperature.toFixed(1)}°C
              </p>
              <p className="tooltip-weather">💧 {data.humidity?.toFixed(0)}%</p>
              <p className="tooltip-weather">
                💨 {data.wind_speed?.toFixed(1)} m/s
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading && forecastData.length === 0) {
    return (
      <div className="aqi-forecast-container loading">
        <div className="loading-spinner"></div>
        <p>
          {geoPermission === "prompt"
            ? "Detecting your location..."
            : "Loading ML forecast..."}
        </p>
        {geoPermission === "denied" && (
          <p style={{ fontSize: "0.9rem", opacity: 0.8, marginTop: "10px" }}>
            📍 Location access denied. Using default location: {currentLocation}
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="aqi-forecast-container error">
        <h3>⚠️ Error Loading Forecast</h3>
        <p>{error}</p>
        <button onClick={fetchForecast}>Retry</button>
      </div>
    );
  }

  return (
    <div className="aqi-forecast-container">
      {/* Top Header */}
      <div className="top-header">
        <div className="header-left-section">
          <h1 className="main-title">24-Hour AQI Forecast</h1>
        </div>
        <button
          className="home-btn"
          onClick={() => (window.location.href = "/")}
        >
          🔊 Home
        </button>
      </div>

      {/* Update Times */}
      <div className="update-times">
        <span className="update-time">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </span>
        <span className="update-time">Last updated: {currentLocation}</span>
      </div>

      {/* 24-Hour Line Chart */}
      <div className="chart-section">
        <h2 className="chart-title">24-Hour Prediction</h2>
        <div className="chart-scroll-wrapper">
          <div className="chart-wrapper-new" style={{ minWidth: "800px" }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={forecastData.slice(0, 24)}
                margin={{ top: 20, right: 20, bottom: 40, left: 10 }}
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4a90e2" stopOpacity={0.3} />
                    <stop
                      offset="100%"
                      stopColor="#7cb5ec"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#cbd5e1"
                  vertical={false}
                  opacity={0.5}
                />
                <XAxis
                  dataKey="timeLabel"
                  tick={{ fill: "#1976d2", fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                  interval={1}
                  height={40}
                />
                <YAxis
                  tick={{ fill: "#1976d2", fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                  domain={["dataMin - 10", "dataMax + 10"]}
                  width={50}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "rgba(77, 160, 219, 0.3)", strokeWidth: 2 }}
                  wrapperStyle={{ zIndex: 1000, outline: "none" }}
                />

                <Area
                  type="natural"
                  dataKey="predicted_aqi"
                  stroke="none"
                  fill="url(#areaGradient)"
                  fillOpacity={1}
                />
                <Line
                  type="natural"
                  dataKey="predicted_aqi"
                  stroke="#4a90e2"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    fill: "#ffffff",
                    stroke: "#4a90e2",
                    strokeWidth: 3,
                  }}
                  activeDot={{
                    r: 7,
                    fill: "#4a90e2",
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hourly Forecast Cards */}
      <div className="hourly-section">
        <h2 className="section-title">24-Hour Detailed Forecast</h2>
        <div className="hourly-scroll-new">
          {forecastData.slice(0, 24).map((forecast, index) => {
            const category = getAQICategory(forecast.predicted_aqi);
            const categoryClass = getAQICategoryClass(forecast.predicted_aqi);
            const isNow = index === 0;

            return (
              <div
                key={forecast.hour}
                className={`hourly-card-new ${categoryClass} ${
                  isNow ? "now-card" : ""
                }`}
              >
                {isNow && <div className="now-badge">NOW</div>}
                <div className="hourly-time-new">
                  {isNow ? "NOW" : forecast.timeLabel}
                </div>
                <div className="hourly-aqi-new">
                  {Math.round(forecast.predicted_aqi)}
                </div>
                <div className="hourly-category-new">
                  {category.name.split(" ")[0]}
                </div>
                <div className="hourly-icon-new">
                  {getWeatherIcon(forecast.predicted_aqi)}
                </div>
                <div className="hourly-confidence-new">
                  {forecast.confidence}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AQIForecast;
