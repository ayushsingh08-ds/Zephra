# AQI ML Forecasting System - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA COLLECTION LAYER                                │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ NASA TEMPO   │  │ NASA MERRA-2 │  │ NASA MODIS   │  │ OpenAQ/WAQI  │   │
│  │              │  │              │  │              │  │              │   │
│  │ • NO₂        │  │ • Temp       │  │ • Cloud      │  │ • AQI        │   │
│  │ • O₃         │  │ • Humidity   │  │ • Visibility │  │ • PM2.5      │   │
│  │ • PM2.5      │  │ • Wind       │  │ • AOD        │  │ • PM10       │   │
│  │ • PM10       │  │ • Pressure   │  │ • NDVI       │  │ (Fallback)   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │            │
│         └─────────────────┴─────────────────┴─────────────────┘            │
│                                   │                                         │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FEATURE ENGINEERING PIPELINE                            │
│                     (feature_engineering.py)                                │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  RAW DATA (Last 48 hours)                                              │ │
│  │  {timestamp, aqi, pm25, temp, humidity, wind_speed, ...}              │ │
│  └────────────────┬───────────────────────────────────────────────────────┘ │
│                   │                                                          │
│                   ▼                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1. TIME FEATURES (Cyclical Encoding)                                 │   │
│  │    • hour_sin, hour_cos         (24-hour cycle)                      │   │
│  │    • day_of_week_sin, day_cos   (weekly cycle)                       │   │
│  │    • month_sin, month_cos       (seasonal cycle)                     │   │
│  │    • season (0-3)                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                   │                                                          │
│                   ▼                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2. LAG FEATURES (Autoregressive)                                     │   │
│  │    • aqi_lag_1h, aqi_lag_6h, aqi_lag_12h, aqi_lag_24h              │   │
│  │    • pm25_lag_1h, pm25_lag_6h, ...                                  │   │
│  │    • temp_lag_1h, wind_speed_lag_6h, ...                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                   │                                                          │
│                   ▼                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3. ROLLING STATISTICS                                                │   │
│  │    • aqi_rolling_mean_3h, aqi_rolling_mean_6h, ...                  │   │
│  │    • pm25_rolling_std_6h, pm25_rolling_max_12h, ...                 │   │
│  │    • temp_rolling_mean_24h, ...                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                   │                                                          │
│                   ▼                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 4. METEOROLOGICAL INDICES                                            │   │
│  │    • wind_dispersion_index = wind_speed^1.5                         │   │
│  │    • inversion_risk = 1/(1 + temp_dew_diff)                         │   │
│  │    • stability_index = pressure/(temp + 273.15)                     │   │
│  │    • haze_indicator = cloud_cover × AOD                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                   │                                                          │
│                   ▼                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 5. POLLUTANT INTERACTIONS                                            │   │
│  │    • pm25_pm10_ratio                                                 │   │
│  │    • no2_o3_ratio                                                    │   │
│  │    • total_oxidants = no2 + o3                                      │   │
│  │    • total_pm = pm25 + pm10                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                   │                                                          │
│                   ▼                                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  ENGINEERED FEATURES (~100 features)                                   │ │
│  │  [time_features + lags + rolling + indices + interactions]            │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MACHINE LEARNING MODEL                                │
│                      (aqi_model_trainer.py)                                 │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                   GRADIENT BOOSTING REGRESSOR                          │ │
│  │                                                                        │ │
│  │   Parameters:                                                          │ │
│  │   • n_estimators = 200      (number of trees)                        │ │
│  │   • learning_rate = 0.1     (shrinkage)                              │ │
│  │   • max_depth = 5           (tree complexity)                        │ │
│  │   • subsample = 0.8         (stochastic boosting)                    │ │
│  │   • max_features = 'sqrt'   (feature sampling)                       │ │
│  │                                                                        │ │
│  │   Training Strategy:                                                   │ │
│  │   • Time-Series Split (80% train, 20% test)                          │ │
│  │   • 5-Fold Time-Series Cross-Validation                              │ │
│  │   • Z-score Normalization                                            │ │
│  │                                                                        │ │
│  │   Input:  100 features from past 24-48h                              │ │
│  │   Output: Predicted AQI at +24h horizon                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  EVALUATION METRICS                                                    │ │
│  │  • RMSE: √(Σ(y_pred - y_true)²/n)          Target: < 15               │ │
│  │  • MAE: Σ|y_pred - y_true|/n               Target: < 12               │ │
│  │  • R²: 1 - (SS_res/SS_tot)                 Target: > 0.6              │ │
│  │  • Category Accuracy: % correct AQI level   Target: > 70%             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODEL PERSISTENCE                                    │
│                                                                              │
│  backend/models/                                                             │
│  ├── aqi_predictor.joblib           (trained model)                         │
│  ├── feature_engineer.joblib        (feature pipeline + scaler)             │
│  ├── metrics.json                   (RMSE, MAE, R², accuracy)               │
│  └── feature_importance.json        (top contributing features)             │
│                                                                              │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INFERENCE ENGINE                                     │
│                       (aqi_predictor.py)                                    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  1. Load Model & Feature Engineer                                      │ │
│  │     • joblib.load('aqi_predictor.joblib')                             │ │
│  │     • joblib.load('feature_engineer.joblib')                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                   │                                                          │
│                   ▼                                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  2. Fetch Recent Data (48h)                                            │ │
│  │     • Latest measurements from NASA APIs                               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                   │                                                          │
│                   ▼                                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  3. Engineer Features                                                  │ │
│  │     • Apply same pipeline as training                                  │ │
│  │     • Generate 100+ features                                           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                   │                                                          │
│                   ▼                                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  4. Make Prediction                                                    │ │
│  │     • model.predict(engineered_features)                               │ │
│  │     • Calculate confidence interval (±1.96 × RMSE)                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                   │                                                          │
│                   ▼                                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  5. Format Output                                                      │ │
│  │     {                                                                  │ │
│  │       predicted_aqi: 87.5,                                            │ │
│  │       category: "Moderate",                                           │ │
│  │       health_message: "...",                                          │ │
│  │       confidence_interval: {lower: 72, upper: 103}                    │ │
│  │     }                                                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API INTEGRATION                                      │
│                        (zephra_api.py)                                      │
│                                                                              │
│  GET /api/dashboard?location=Delhi                                           │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  1. Fetch recent data (NASA APIs)                                      │ │
│  │  2. Check if ML model loaded                                           │ │
│  │  3. If ML available:                                                   │ │
│  │     • predictor.predict_24h(recent_data)                              │ │
│  │     • Return ML forecast                                               │ │
│  │  4. Else:                                                              │ │
│  │     • Fallback to trend-based forecast                                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Response:                                                                   │
│  {                                                                           │
│    "forecast": [                                                             │
│      {                                                                       │
│        "hour": "14:00",                                                      │
│        "predicted_aqi": 87.5,                                                │
│        "confidence": 85,                                                     │
│        "category": "Moderate",                                               │
│        "model_type": "gradient_boosting"  ← ML-powered!                      │
│      }                                                                       │
│    ]                                                                         │
│  }                                                                           │
│                                                                              │
│  Additional Endpoints:                                                       │
│  • GET /api/ml-model-info      → Model metadata and performance             │
│  • GET /api/ml-model-metrics   → Detailed metrics + feature importance      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                            WORKFLOW SUMMARY
═══════════════════════════════════════════════════════════════════════════════

TRAINING PHASE (One-time or Monthly):
────────────────────────────────────
1. Collect 30-90 days historical data
2. Engineer 100+ features
3. Train Gradient Boosting model
4. Validate with time-series CV
5. Save model artifacts
   └─> backend/models/

INFERENCE PHASE (Real-time):
────────────────────────────
1. API receives request
2. Fetch last 48h data
3. Engineer features
4. Load model
5. Predict AQI +24h
6. Return forecast + confidence

FALLBACK STRATEGY:
──────────────────
ML Not Available → Trend-based forecasting
(Graceful degradation, no breaking changes)

═══════════════════════════════════════════════════════════════════════════════
```

## Key Design Principles

### 1. **Temporal Integrity**

- Time-series cross-validation prevents future leakage
- Features use only past data (no future peeking)
- Realistic performance estimates

### 2. **Domain Knowledge**

- Meteorological indices based on atmospheric science
- Pollutant interactions from chemistry
- Cyclical encoding for periodic patterns

### 3. **Robustness**

- Handles missing data gracefully
- Fallback to trend-based forecasting
- Feature normalization for stability

### 4. **Modularity**

- Feature engineering separate from training
- Easy to retrain with new data
- Plug-and-play API integration

### 5. **Production-Ready**

- Model versioning via joblib
- Performance monitoring
- Error handling at every layer

---

## Data Requirements

**Minimum**: 7 days (168 hours) × 15 fields = 2,520 data points  
**Recommended**: 30-90 days for seasonal patterns  
**Critical Fields**: timestamp, aqi, pm25, temperature, humidity, wind_speed
