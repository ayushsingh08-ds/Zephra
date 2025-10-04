"""
Quick Start: Train AQI Prediction Model
========================================

This script demonstrates how to train an AQI forecasting model.
It generates synthetic training data for demonstration purposes.

For production use, replace synthetic data with real historical measurements
from your NASA API or other data sources.
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
import random

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from aqi_model_trainer import AQIModelTrainer
    from feature_engineering import AQIFeatureEngineer
except ImportError as e:
    print(f"❌ Error importing modules: {e}")
    print("\nPlease install required dependencies:")
    print("  pip install -r requirements.txt")
    sys.exit(1)


def generate_synthetic_training_data(days=30, location='New York'):
    """
    Generate synthetic training data for demonstration
    
    Args:
        days: Number of days of historical data
        location: Location name (affects base pollution levels)
        
    Returns:
        List of hourly measurement dictionaries
    """
    print(f"📊 Generating {days} days of synthetic training data for {location}...")
    
    # Location-specific AQI baselines
    location_profiles = {
        'New York': {'base_aqi': 65, 'variability': 20},
        'Delhi': {'base_aqi': 180, 'variability': 40},
        'Tokyo': {'base_aqi': 55, 'variability': 15},
        'London': {'base_aqi': 70, 'variability': 18},
        'Sydney': {'base_aqi': 45, 'variability': 12}
    }
    
    profile = location_profiles.get(location, {'base_aqi': 70, 'variability': 20})
    base_aqi = profile['base_aqi']
    variability = profile['variability']
    
    data = []
    start_time = datetime.now() - timedelta(days=days)
    
    for hour in range(days * 24):
        timestamp = start_time + timedelta(hours=hour)
        
        # Time-based patterns
        hour_of_day = timestamp.hour
        day_of_week = timestamp.weekday()
        
        # Rush hour pollution spikes
        rush_hour_factor = 1.0
        if hour_of_day in [7, 8, 9, 17, 18, 19]:
            rush_hour_factor = 1.3
        elif hour_of_day in [2, 3, 4, 5]:
            rush_hour_factor = 0.7
        
        # Weekend vs weekday
        weekend_factor = 0.85 if day_of_week >= 5 else 1.0
        
        # Seasonal variation (simplified)
        season_factor = 1 + 0.2 * (timestamp.month % 12 - 6) / 6
        
        # Random variation
        random_factor = 1 + random.uniform(-0.15, 0.15)
        
        # Calculate AQI
        aqi = int(base_aqi * rush_hour_factor * weekend_factor * season_factor * random_factor)
        aqi = max(10, min(250, aqi))  # Bounds
        
        # Weather (correlated with AQI)
        temp = 20 + 10 * (timestamp.month % 12 - 6) / 6 + random.uniform(-5, 5)
        humidity = 60 + random.uniform(-20, 20)
        wind_speed = max(0, 5 + random.uniform(-3, 3))
        pressure = 1013 + random.uniform(-10, 10)
        wind_direction = random.uniform(0, 360)
        
        # Pollutants (derived from AQI)
        pm25 = aqi * 0.7 + random.uniform(-5, 5)
        pm10 = aqi * 1.0 + random.uniform(-8, 8)
        no2 = aqi * 0.4 + random.uniform(-3, 3)
        o3 = aqi * 0.5 + random.uniform(-4, 4)
        so2 = aqi * 0.2 + random.uniform(-2, 2)
        co = aqi * 0.1 + random.uniform(-1, 1)
        
        # Satellite data
        cloud_cover = random.uniform(10, 80)
        visibility = max(5, 25 - (aqi / 10) + random.uniform(-3, 3))
        aod = 0.1 + (aqi / 500) + random.uniform(-0.05, 0.05)
        
        data.append({
            'timestamp': timestamp.isoformat(),
            'aqi': max(0, int(aqi)),
            'pm25': max(0, round(pm25, 1)),
            'pm10': max(0, round(pm10, 1)),
            'no2': max(0, round(no2, 1)),
            'o3': max(0, round(o3, 1)),
            'so2': max(0, round(so2, 1)),
            'co': max(0, round(co, 2)),
            'temperature': round(temp, 1),
            'humidity': max(20, min(95, round(humidity, 1))),
            'pressure': round(pressure, 1),
            'wind_speed': round(wind_speed, 1),
            'wind_direction': round(wind_direction, 1),
            'cloud_cover': round(cloud_cover, 1),
            'visibility': round(visibility, 1),
            'aod': round(aod, 3)
        })
    
    print(f"✅ Generated {len(data)} hourly records")
    return data


def train_model(training_data, model_dir='models'):
    """
    Train AQI forecasting model
    
    Args:
        training_data: List of historical measurements
        model_dir: Directory to save trained model
    """
    print("\n" + "="*60)
    print("🤖 TRAINING AQI FORECASTING MODEL")
    print("="*60)
    
    # Initialize trainer
    trainer = AQIModelTrainer(model_dir=model_dir)
    
    # Prepare data
    print("\n1️⃣ Preparing data and engineering features...")
    X, y = trainer.prepare_data(
        training_data, 
        target_col='aqi', 
        forecast_horizon=24  # Predict 24 hours ahead
    )
    
    print(f"   Features shape: {X.shape}")
    print(f"   Target shape: {y.shape}")
    print(f"   Total features: {X.shape[1]}")
    
    # Train with cross-validation
    print("\n2️⃣ Running time-series cross-validation...")
    cv_scores = trainer.time_series_split_train(X, y, n_splits=5)
    
    # Train final model
    print("\n3️⃣ Training final model...")
    metrics = trainer.train(
        X, y,
        test_size=0.2,
        normalize=True,
        n_estimators=200,
        learning_rate=0.1,
        max_depth=5,
        min_samples_split=20,
        min_samples_leaf=10,
        subsample=0.8
    )
    
    # Save model
    print("\n4️⃣ Saving model and artifacts...")
    trainer.save_model('aqi_predictor.joblib')
    
    print("\n" + "="*60)
    print("✅ MODEL TRAINING COMPLETE")
    print("="*60)
    print(f"\nTest Set Performance:")
    print(f"  RMSE: {metrics['test']['rmse']:.2f} AQI points")
    print(f"  MAE: {metrics['test']['mae']:.2f} AQI points")
    print(f"  R²: {metrics['test']['r2']:.3f}")
    print(f"  Category Accuracy: {metrics['category']['category_accuracy']:.1%}")
    print(f"  Within-1 Category: {metrics['category']['within_one_category_accuracy']:.1%}")
    
    print(f"\nModel saved to: {model_dir}/")
    print("  - aqi_predictor.joblib (trained model)")
    print("  - feature_engineer.joblib (feature engineering pipeline)")
    print("  - metrics.json (performance metrics)")
    print("  - feature_importance.json (feature importance scores)")
    
    return trainer


def test_predictions(trainer, test_data):
    """
    Test the trained model with sample predictions
    
    Args:
        trainer: Trained AQIModelTrainer instance
        test_data: Recent data for testing
    """
    print("\n" + "="*60)
    print("🔮 TESTING PREDICTIONS")
    print("="*60)
    
    try:
        from aqi_predictor import AQIPredictor
        
        predictor = AQIPredictor(model_dir='models')
        predictor.load_model('aqi_predictor.joblib')
        
        # Use last 48 hours for prediction
        recent_data = test_data[-48:]
        
        print(f"\nUsing last {len(recent_data)} hours of data...")
        print(f"Current AQI: {recent_data[-1]['aqi']}")
        
        # Get 24h forecast
        forecast = predictor.predict_24h(recent_data, return_confidence=True)
        
        print(f"\n24-Hour Forecast:")
        print(f"  Predicted AQI: {forecast['predicted_aqi']}")
        print(f"  Category: {forecast['category']}")
        print(f"  Health Message: {forecast['health_message']}")
        
        if 'confidence_interval' in forecast:
            ci = forecast['confidence_interval']
            print(f"  95% CI: [{ci['lower']}, {ci['upper']}]")
        
        # Get hourly forecasts
        print(f"\nHourly Forecast (next 12 hours):")
        hourly = predictor.predict_hourly_sequence(recent_data, hours_ahead=12)
        
        for h in hourly[:5]:
            print(f"  +{h['hour']}h: AQI {h['predicted_aqi']} ({h['category']})")
        print("  ...")
        
        print("\n✅ Predictions working correctly!")
        
    except Exception as e:
        print(f"\n❌ Error during prediction testing: {e}")


def main():
    """Main training workflow"""
    print("="*60)
    print("🚀 AQI FORECASTING MODEL - QUICK START TRAINER")
    print("="*60)
    print("\nThis script will:")
    print("1. Generate 30 days of synthetic training data")
    print("2. Engineer features (lag, rolling, meteorological)")
    print("3. Train Gradient Boosting model")
    print("4. Evaluate performance with cross-validation")
    print("5. Save model for API integration")
    print("6. Test predictions")
    
    input("\n▶️  Press ENTER to start training...")
    
    # Generate training data
    training_data = generate_synthetic_training_data(days=30, location='New York')
    
    # Train model
    trainer = train_model(training_data, model_dir='models')
    
    # Test predictions
    test_predictions(trainer, training_data)
    
    print("\n" + "="*60)
    print("🎉 ALL DONE!")
    print("="*60)
    print("\nNext steps:")
    print("1. Start the API: python api/zephra_api.py")
    print("2. Check model info: http://localhost:5000/api/ml-model-info")
    print("3. Get forecasts: http://localhost:5000/api/dashboard?location=New%20York")
    print("\nFor production:")
    print("- Replace synthetic data with real historical measurements")
    print("- Collect 60-90 days of data for better accuracy")
    print("- Retrain monthly with new data")
    print("\nSee ML_FORECASTING_GUIDE.md for detailed documentation.")
    print("="*60)


if __name__ == '__main__':
    main()
