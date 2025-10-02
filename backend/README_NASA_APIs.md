# NASA Space Apps 2025 - Complete Data Access Guide

🚀 **Quick Start for Beginners** - Everything you need to access NASA satellite data and ground sensor data

## 📋 What Data You'll Get

### 🛰️ Satellite Data Sources
- **TEMPO**: NO₂, O₃, Aerosols, HCHO (hourly, high-resolution)
- **IMERG**: Precipitation data (washout of pollutants)  
- **MERRA-2**: Climate variables (winds, humidity, aerosols)
- **Daymet**: Daily weather (temperature, humidity, solar radiation)
- **AIRS**: Temperature & humidity profiles
- **CYGNSS**: Wind speeds over oceans

### 🏭 Ground Sensor Data
- **AirNow**: US EPA real-time air quality (PM2.5, PM10, NO₂, O₃)
- **OpenAQ**: Global air quality measurements
- **Pandora**: NO₂, O₃ validation data
- **TOLNet**: Ozone profiles

## ⚡ 5-Minute Setup

### 1️⃣ Install Python Packages
**Windows:** Double-click `install_requirements.bat` or run:
```bash
pip install -r requirements.txt
```

### 2️⃣ Get NASA Credentials (FREE)
1. Go to: https://urs.earthdata.nasa.gov/users/new
2. Create account → Login → Profile
3. Click "Generate Token" → Name: "Space Apps 2025"
4. **Copy this token** (use as password)

### 3️⃣ Configure Scripts
Edit `nasa_data_fetcher.py`:
```python
EARTHDATA_USERNAME = "your_username"
EARTHDATA_PASSWORD = "your_token_from_step_2"
```

### 4️⃣ Test Everything
```bash
python nasa_data_fetcher.py
```

## 🚀 Example Usage

```python
from nasa_data_fetcher import NASADataFetcher, GroundDataFetcher

# Initialize with your credentials
nasa_fetcher = NASADataFetcher("username", "password")
ground_fetcher = GroundDataFetcher()

# Example: Get air quality data for your city
lat, lon = 40.7128, -74.0060  # New York City
bbox = [-75.0, 40.0, -73.0, 41.0]

# Fetch satellite data
tempo_data = nasa_fetcher.fetch_tempo_data("2024-10-01", "2024-10-02", bbox)
weather_data = nasa_fetcher.fetch_daymet_data(lat, lon, 2024, 2024)

# Fetch ground sensor data  
air_quality = ground_fetcher.fetch_openaq_data(lat, lon)

print(f"✅ TEMPO data: {tempo_data['status']}")
print(f"✅ Weather data: {weather_data['status']}")
print(f"✅ Air quality: {air_quality['status']}")
```

## 💡 Project Ideas for Space Apps

### 🏆 High-Impact Solutions
1. **Air Quality Forecasting**: Predict pollution 24-48 hours ahead
2. **Health Alert System**: Warn vulnerable populations  
3. **Pollution Source Detection**: Track where pollution comes from
4. **Environmental Justice**: Map pollution inequality
5. **Wildfire Impact**: Air quality during fire events

### 🎯 Technical Approaches
- **Machine Learning**: Predict air quality from weather
- **Data Fusion**: Combine satellite + ground sensors
- **Real-time Processing**: Live alerts and monitoring
- **Mobile Apps**: Personal air quality assistant
- **Public Dashboards**: Community air quality maps

## 📁 Files Included

```
📦 Your NASA Space Apps Project
├── 🐍 nasa_data_fetcher.py      # Main data fetching script
├── 📊 air_quality_analyzer.py   # Advanced analysis & visualization  
├── 📋 requirements.txt          # Python packages needed
├── ⚙️ install_requirements.bat  # Windows auto-installer
├── 📖 SETUP_GUIDE.md           # Detailed instructions
├── 🗂️ nasa_data_guide.md       # Data sources reference
└── 📄 README_NASA_APIs.md      # This file
```

## 🚨 Quick Troubleshooting

### ❌ Authentication Errors
```python
# Test your credentials first
nasa_fetcher.setup_earthdata_auth()
```

### ❌ No Data Returned
- Check date ranges (some data has delays)
- Verify coordinates are valid
- Try different locations

### ❌ Import Errors
```bash
# Reinstall packages
pip install --upgrade -r requirements.txt
```

## 🏅 Tips for Winning Space Apps

### ⭐ Technical Excellence
- ✅ Use multiple data sources for validation
- ✅ Handle errors gracefully
- ✅ Document your methodology
- ✅ Create reproducible results

### 💡 Innovation Points
- ✅ Novel data combinations
- ✅ Creative visualizations  
- ✅ Real-world problem solving
- ✅ User-friendly interfaces

### 🎤 Presentation Tips
- ✅ Show clear problem → solution
- ✅ Demonstrate with real data
- ✅ Include impact metrics
- ✅ Make it accessible to everyone

## 🆘 Need Help?

### 🔧 Technical Issues
1. Check error messages carefully
2. Verify credentials are correct
3. Try example locations first
4. Read SETUP_GUIDE.md for details

### 🌐 Community Support
- NASA Space Apps Discord
- Local event mentors
- GitHub issues in this repo

### 📚 Learning Resources
- [NASA Earthdata](https://earthdata.nasa.gov/learn)
- [Python Data Analysis](https://pandas.pydata.org/docs/)
- [Air Quality Science](https://www.epa.gov/air-quality-analysis)

---

## 📄 License & Usage

**Open Source** - Use, modify, and share freely!

**Citation**: If you use this code in your project, please mention:
> "Data access tools developed for NASA Space Apps 2025"

---

**🚀 Good luck with NASA Space Apps 2025!**

*Remember: The goal isn't just fetching data—it's solving real problems that help people and our planet.* 🌍

---

### About Zephra Team

This code was developed as part of the **Zephra** project - a web-based app delivering real-time air quality forecasts using NASA TEMPO satellite data.

**Team:**
- [@Ayush Singh](https://github.com/ayushsingh08-ds)
- [@Arji Jethin Naga Sai Eswar](https://github.com/ArjiJethin)  
- [@Aluru Bala Karthikeya](https://github.com/alurubalakarthikeya)