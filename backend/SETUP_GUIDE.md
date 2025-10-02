# NASA Space Apps 2025 - Complete Setup Guide

## 🚀 Quick Start Instructions

### Step 1: Install Required Packages
```bash
pip install -r requirements.txt
```

### Step 2: Get Your Credentials

#### A. NASA Earthdata Login
1. Go to: https://urs.earthdata.nasa.gov/users/new
2. Create account if you don't have one
3. Login to: https://urs.earthdata.nasa.gov/profile
4. Generate an App Password:
   - Click "Generate Token" 
   - Name it "Space Apps 2025"
   - Copy the generated token (use this instead of your password)

#### B. AirNow API Key (Optional but Recommended)
1. Go to: https://docs.airnowapi.org/account/request/
2. Fill out the form for API access
3. You'll receive API key via email

#### C. OpenAQ (Free, No Key Required)
- OpenAQ API is free and doesn't require authentication
- Rate limited but sufficient for most projects

### Step 3: Configure Your Script

Edit `nasa_data_fetcher.py` and replace these placeholders:
```python
EARTHDATA_USERNAME = "your_actual_username"
EARTHDATA_PASSWORD = "your_app_token_from_step_2A"
AIRNOW_API_KEY = "your_airnow_key"  # From step 2B
```

### Step 4: Test Your Setup
```bash
python nasa_data_fetcher.py
```

## 📊 Data Sources Explained

### 🛰️ Satellite Data (NASA APIs)

#### 1. TEMPO - Air Quality from Space
- **What**: NO₂, O₃, Aerosols, HCHO concentrations
- **Resolution**: Hourly, 2.1km × 4.4km
- **Coverage**: North America
- **Use Case**: Real-time air pollution monitoring

#### 2. IMERG (GPM) - Precipitation
- **What**: Rainfall data for pollutant washout modeling
- **Resolution**: 30-minute, 0.1° × 0.1°
- **Coverage**: Global (60°N-60°S)
- **Use Case**: Understanding how rain affects air quality

#### 3. MERRA-2 - Climate Reanalysis
- **What**: Wind, humidity, temperature, aerosols
- **Resolution**: Hourly, ~50km
- **Coverage**: Global, 1980-present
- **Use Case**: Weather patterns affecting air quality

#### 4. Daymet - Daily Weather
- **What**: Temperature, humidity, solar radiation
- **Resolution**: Daily, 1km
- **Coverage**: North America
- **Use Case**: Local weather impacts on air quality

#### 5. AIRS - Atmospheric Profiles
- **What**: Temperature & humidity at different altitudes
- **Resolution**: Twice daily, 13.5km
- **Coverage**: Global
- **Use Case**: Atmospheric conditions affecting pollution

#### 6. CYGNSS - Ocean Winds
- **What**: Wind speeds over oceans
- **Resolution**: ~25km
- **Coverage**: ±38° latitude
- **Use Case**: Coastal air quality modeling

### 🏭 Ground Sensor Data

#### 7. AirNow - US EPA Data
- **What**: PM2.5, PM10, NO₂, O₃ from official monitoring stations
- **Resolution**: Hourly
- **Coverage**: United States
- **Use Case**: Validation and real-time air quality

#### 8. OpenAQ - Global Air Quality
- **What**: PM2.5, PM10, NO₂, O₃, SO₂, CO from various sources
- **Resolution**: Various (hourly to daily)
- **Coverage**: Global
- **Use Case**: International air quality data

## 💡 Pro Tips for Space Apps 2025

### Data Integration Strategy
1. **Start Small**: Pick one location and short time period
2. **Layer Data**: Combine satellite + ground sensors
3. **Correlate**: Look for relationships between weather and air quality
4. **Validate**: Use ground sensors to validate satellite data

### Common Issues & Solutions

#### Authentication Problems
```python
# Test your credentials first
nasa_fetcher.setup_earthdata_auth()
```

#### Data Format Issues
```python
# Most NASA data comes as NetCDF files
import xarray as xr
data = xr.open_dataset('your_file.nc')
```

#### Rate Limiting
```python
import time
# Add delays between API calls
time.sleep(1)  # 1 second delay
```

### Example Analysis Ideas
1. **Pollution Forecasting**: Use weather data to predict air quality
2. **Satellite Validation**: Compare TEMPO data with ground sensors
3. **Washout Analysis**: How does rain affect air pollution?
4. **Urban Heat Islands**: Temperature vs. air quality in cities
5. **Cross-Border Pollution**: Track pollution movement between countries

## 🔧 Advanced Usage

### Batch Data Download
```python
# Download multiple days of data
for date in pd.date_range('2024-10-01', '2024-10-10'):
    data = nasa_fetcher.fetch_tempo_data(date.strftime('%Y-%m-%d'), 
                                       date.strftime('%Y-%m-%d'), bbox)
    # Process and save data
```

### Data Visualization
```python
import matplotlib.pyplot as plt
import plotly.express as px

# Create interactive maps
fig = px.scatter_mapbox(df, lat='latitude', lon='longitude', 
                       color='pm25', hover_data=['datetime'],
                       mapbox_style='open-street-map')
fig.show()
```

### Real-time Processing
```python
# Set up automated data collection
import schedule
import time

def fetch_latest_data():
    # Your data fetching code here
    pass

schedule.every(1).hours.do(fetch_latest_data)
while True:
    schedule.run_pending()
    time.sleep(60)
```

## 🆘 Getting Help

### NASA Documentation
- Earthdata: https://earthdata.nasa.gov/learn
- GES DISC: https://disc.gsfc.nasa.gov/information
- Daymet: https://daymet.ornl.gov/

### Community Support
- NASA Space Apps Discord
- Stack Overflow (tag: nasa, earthdata)
- GitHub Issues in this repository

### Contact for Issues
- Check NASA Earthdata status: https://status.earthdata.nasa.gov/
- API documentation: Each data source has specific documentation

Remember: NASA Space Apps judging criteria include innovation, impact, and use of space data. Focus on creative solutions to real problems!