# NASA API Data Access Guide for Space Apps 2025

## Authentication Setup

### 1. Earthdata Login Credentials
- Username: [Your Earthdata username]
- Password: [Your Earthdata password]
- Profile: https://urs.earthdata.nasa.gov/profile

### 2. Generate App Password (Recommended)
1. Go to: https://urs.earthdata.nasa.gov/profile
2. Click "Generate Token" or "App Passwords"
3. Create a new app password for your project
4. Save this securely - you'll use it instead of your main password

## Required Data Sources & APIs

### Satellite Data Sources

#### 1. TEMPO (NO₂, O₃, Aerosols, HCHO)
- **API Endpoint**: NASA Goddard Earth Sciences Data
- **Base URL**: `https://disc.gsfc.nasa.gov/api/`
- **Data Format**: NetCDF, HDF5
- **Temporal Resolution**: Hourly
- **Spatial Resolution**: 2.1 km × 4.4 km

#### 2. IMERG (GPM) - Precipitation Data
- **API Endpoint**: Goddard Earth Sciences Data and Information Services Center
- **Base URL**: `https://gpm1.gesdisc.eosdis.nasa.gov/data/GPM_L3/`
- **Data Format**: HDF5, NetCDF
- **Temporal Resolution**: 30 minutes to daily
- **Coverage**: Global

#### 3. MERRA-2 Reanalysis
- **API Endpoint**: NASA GMAO
- **Base URL**: `https://goldsmr4.gesdisc.eosdis.nasa.gov/data/MERRA2/`
- **Data Format**: NetCDF
- **Variables**: Winds, humidity, aerosols, temperature
- **Temporal Resolution**: Hourly to monthly

#### 4. Daymet (Daily Weather)
- **API Endpoint**: ORNL DAAC
- **Base URL**: `https://daymet.ornl.gov/api/`
- **Data Format**: NetCDF, CSV
- **Variables**: Temperature, humidity, solar radiation
- **Coverage**: North America

#### 5. AIRS (Temperature & Humidity Profiles)
- **API Endpoint**: Goddard Earth Sciences Data
- **Base URL**: `https://airs.jpl.nasa.gov/data/`
- **Data Format**: HDF-EOS
- **Temporal Resolution**: Twice daily

#### 6. CYGNSS (Wind Speeds)
- **API Endpoint**: Physical Oceanography DAAC
- **Base URL**: `https://podaac.jpl.nasa.gov/dataset/`
- **Data Format**: NetCDF
- **Coverage**: Ocean wind speeds

### Ground Sensor Data

#### 7. AirNow (Real-time Air Quality)
- **API Endpoint**: EPA AirNow
- **Base URL**: `https://www.airnowapi.org/aq/`
- **API Key Required**: Yes (separate from NASA)
- **Data**: PM2.5, PM10, NO₂, O₃

#### 8. OpenAQ
- **API Endpoint**: OpenAQ
- **Base URL**: `https://api.openaq.org/v2/`
- **Authentication**: API key (free)
- **Data**: Global air quality measurements

## Next Steps
1. Set up Python environment with required libraries
2. Configure authentication
3. Create data fetching scripts for each source
4. Implement data processing and integration