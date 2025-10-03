# Zephra - Real-time Environmental Monitoring Dashboard

<h2 align="center">Zephra</h2>

**Zephra** is a web-based app that delivers **real-time and short-term air quality forecasts** by combining **NASA TEMPO satellite data** with **ground-based monitoring**.  
It's designed with a **public health focus**, helping communities and policymakers understand and act on air quality risks.  

> Currently under development<br>

## 🚀 Quick Start for Developers

### Prerequisites
- **Python 3.8+** (for backend)
- **Node.js 16+** (for frontend)
- **npm or yarn** (package manager)

### 1. Clone & Setup
```bash
git clone https://github.com/ArjiJethin/Zephra.git
cd Zephra
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env with your NASA credentials
# NASA_TOKEN=your_nasa_jwt_token_here
# NASA_USERNAME=your_nasa_username
# WAQI_API_KEY=your_waqi_key (optional)

# Start the FastAPI server (Windows)
python zephra_api.py

# Or use the batch file (Windows)
start_backend.bat
```
Backend runs on: `http://localhost:5000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev

# Or use the batch file (Windows)
start_frontend.bat
```
Frontend runs on: `http://localhost:5174`

## 🔐 Environment Configuration

The application requires proper environment variables for security and functionality.

### Required Environment Variables
Create a `.env` file in the backend directory with:

```env
# NASA API Configuration (Required for real data)
NASA_TOKEN=your_nasa_jwt_token_here
NASA_USERNAME=your_nasa_username

# WAQI API (Optional - used as fallback)
WAQI_API_KEY=your_waqi_api_key

# Server Configuration
DEBUG=true
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=5000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Getting NASA Token
1. Register at [NASA Earthdata Login](https://urs.earthdata.nasa.gov/users/new)
2. Apply for data access permissions
3. Generate JWT token for API access
4. Add token to your `.env` file

**Security Note**: Never commit `.env` files to version control!

## Tech Stack:

- **Frontend**: React.js with TypeScript, Vite, Chart.js, PWA capabilities
- **Backend**: Python with FastAPI, async/await, NASA API integration
- **Data Sources**: NASA TEMPO/MERRA-2/MODIS satellites + WAQI ground stations
- **Model**: Enhanced location-based environmental modeling with fallback systems
- **Deployment**: Modern cloud deployment ready

## 🏗️ Architecture

```
Zephra/
├── backend/                 # FastAPI backend server
│   ├── zephra_api.py       # Main API with NASA authentication
│   └── requirements.txt    # Python dependencies
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # Dashboard, Home, Navigation, etc.
│   │   ├── App.tsx         # Main React component
│   │   └── main.tsx        # Entry point
│   ├── package.json        # Node.js dependencies
│   └── vite.config.ts      # Vite with backend proxy
└── README.md               # This documentation
```

## 🔧 API Endpoints

### Main Endpoints
- **Dashboard Data**: `GET /api/dashboard?location={city}` or `?lat={lat}&lon={lon}`
- **Available Locations**: `GET /api/locations`
- **NASA Status**: `GET /api/nasa-status`

### Supported Locations
- 🗽 New York (40.7128, -74.006)
- 🗼 Tokyo (35.6762, 139.6503)  
- 🌉 London (51.5074, -0.1278)
- 🏙️ Delhi (28.6139, 77.209)
- 🌊 Sydney (-33.8688, 151.2093)
- 🏔️ Denver (39.7392, -104.9903)
- **Custom coordinates supported**

## 📊 Data Response Structure

```json
{
  "weather": [{"timestamp": "...", "temperature": 25.5, "humidity": 65, ...}],
  "air_quality": [{"timestamp": "...", "aqi": 85, "pm25": 25.3, ...}],
  "satellite": [{"timestamp": "...", "visibility": 18.5, "cloud_cover": 35, ...}],
  "health": [{"timestamp": "...", "overall_health_index": 7.2, ...}],
  "forecast": [{"hour": "14:00", "predicted_aqi": 92, "confidence": 85}],
  "status": {"api_status": "Connected", "data_freshness": 95, ...},
  "location_info": {"name": "Tokyo", "coordinates": [35.6762, 139.6503], ...}
}
```

## 🛠️ Development

### Backend Development

**Start with hot reload:**
```bash
uvicorn zephra_api:app --reload --host 0.0.0.0 --port 5000
```

**Key Features:**
- Real NASA token authentication (`eswaraji` user)
- Async HTTP requests with `aiohttp`
- Location-specific data modeling
- Fallback systems when NASA APIs return unexpected formats
- CORS enabled for frontend development

### Frontend Development

**Available scripts:**
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint checking
```

**Key Features:**
- TypeScript for type safety
- Chart.js for interactive visualizations
- PWA capabilities with service worker
- Responsive design with modern CSS
- Proxy configuration for backend API calls

## 🌍 NASA Integration Details

### Authentication
```python
NASA_TOKEN = "eyJ0eXAiOiJKV1QiLCJvcmlnaW4iOiJFYXJ0aGRhdGEgTG9naW4i..."
USERNAME = "eswaraji"
```

### APIs Used
1. **TEMPO**: `https://disc.gsfc.nasa.gov/api` - Air quality satellite data
2. **MERRA-2**: `https://goldsmr4.gesdisc.eosdis.nasa.gov/data/MERRA2` - Weather reanalysis
3. **MODIS**: `https://modis.gsfc.nasa.gov/data` - Satellite imagery

### Enhanced Fallback System
When NASA APIs return HTML instead of JSON (common), the system uses:
- Location-specific pollution baselines (Delhi: AQI ~180, Sydney: AQI ~45)
- Climate-based weather modeling (tropical vs arctic patterns)
- Urban vs rural environmental factors
- Seasonal adjustments (Northern vs Southern hemisphere)

## 🔍 Troubleshooting

### Common Backend Issues
```bash
# Port 5000 in use
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Missing dependencies
pip install fastapi uvicorn aiohttp requests python-multipart
```

### Common Frontend Issues
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Proxy connection issues - ensure backend is running on port 5000
```

## 📦 Production Deployment

### Backend
```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker zephra_api:app --bind 0.0.0.0:5000
```

### Frontend
```bash
npm run build
npx serve dist
```

## Features:

🌍 **Real-time Environmental Data** – Live air quality, weather, satellite observations  
💨 **Location-Specific Modeling** – Realistic data patterns for any global location  
📡 **NASA Satellite Integration** – Authenticated TEMPO, MERRA-2, MODIS data access  
📊 **Interactive Visualizations** – Beautiful charts with Chart.js, color-coded AQI  
🩺 **Health Impact Assessment** – Respiratory and cardiovascular risk analysis  
🔮 **12-Hour Forecasting** – Predictive AQI with confidence intervals  
🌐 **Progressive Web App** – Installable, offline-capable dashboard  
⚡ **FastAPI Performance** – Async backend with enhanced data processing  

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Developers:
<a href="https://github.com/ayushsingh08-ds">@Ayush Singh</a><br>
<a href="https://github.com/ArjiJethin">@Arji Jethin Naga Sai Eswar</a><br>
<a href="https://github.com/alurubalakarthikeya">@Aluru Bala Karthikeya</a><br>

---

**🌍 Monitor. Analyze. Act.** - Making environmental data accessible to everyone.