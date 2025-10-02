# Zephra Backend - NASA Data API

This folder contains all the NASA API integration and data processing code for the Zephra project.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# From the root directory
pip install -r backend/requirements.txt

# OR from backend directory
cd backend
pip install -r requirements.txt
```

### 2. Get NASA Credentials
1. Create account at: https://urs.earthdata.nasa.gov/users/new
2. Generate token in your profile
3. Edit `nasa_data_fetcher.py` with your credentials

### 3. Run the Data Fetcher
```bash
cd backend
python nasa_data_fetcher.py
```

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `nasa_data_fetcher.py` | Main NASA API integration script |
| `air_quality_analyzer.py` | Advanced data analysis and visualization |
| `requirements.txt` | Python dependencies |
| `README_NASA_APIs.md` | Complete beginner's guide |
| `SETUP_GUIDE.md` | Detailed setup instructions |
| `nasa_data_guide.md` | Data sources reference |
| `install_requirements.bat` | Windows auto-installer |

## 🛰️ Data Sources Supported

### Satellite Data
- **TEMPO**: NO₂, O₃, Aerosols, HCHO (hourly)
- **IMERG**: Precipitation data  
- **MERRA-2**: Climate variables
- **Daymet**: Daily weather
- **AIRS**: Atmospheric profiles
- **CYGNSS**: Ocean winds

### Ground Sensors
- **AirNow**: US EPA air quality data
- **OpenAQ**: Global air quality measurements

## 🔗 Integration with Frontend

The backend APIs will be called by the React frontend in the `../frontend` folder to:
- Fetch real-time air quality data
- Provide forecasting data
- Generate health recommendations
- Create visualizations

## 📖 Documentation

For complete setup instructions, see:
- `README_NASA_APIs.md` - Main guide for beginners
- `SETUP_GUIDE.md` - Detailed setup steps
- `nasa_data_guide.md` - Data sources reference

## 🤝 Contributing

This backend is part of the Zephra NASA Space Apps 2025 project. Feel free to extend and improve the data integration capabilities!