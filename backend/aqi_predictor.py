"""
AQI Prediction Module
Loads trained ML model and generates 24-hour AQI forecasts
"""

import numpy as np
import pandas as pd
import joblib
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import warnings
warnings.filterwarnings('ignore')

from feature_engineering import AQIFeatureEngineer


class AQIPredictor:
    """
    Generates AQI forecasts using trained Gradient Boosting model
    """
    
    def __init__(self, model_dir: str = 'models'):
        """
        Initialize predictor
        
        Args:
            model_dir: Directory containing trained model files
        """
        self.model_dir = Path(model_dir)
        self.model = None
        self.feature_engineer = None
        self.metrics = None
        self.feature_importance = None
        self.is_loaded = False
        
    def load_model(self, model_name: str = 'aqi_predictor.joblib'):
        """
        Load trained model and associated artifacts
        
        Args:
            model_name: Name of the model file
        """
        model_path = self.model_dir / model_name
        
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model not found: {model_path}\n"
                f"Please train a model first using aqi_model_trainer.py"
            )
        
        # Load model
        self.model = joblib.load(model_path)
        
        # Load feature engineer
        engineer_path = self.model_dir / 'feature_engineer.joblib'
        if engineer_path.exists():
            self.feature_engineer = joblib.load(engineer_path)
        else:
            # Fallback: create new feature engineer
            print("Warning: Feature engineer not found, creating new instance")
            self.feature_engineer = AQIFeatureEngineer()
        
        # Load metrics
        metrics_path = self.model_dir / 'metrics.json'
        if metrics_path.exists():
            with open(metrics_path, 'r') as f:
                self.metrics = json.load(f)
        
        # Load feature importance
        importance_path = self.model_dir / 'feature_importance.json'
        if importance_path.exists():
            with open(importance_path, 'r') as f:
                self.feature_importance = json.load(f)
        
        self.is_loaded = True
        print(f"✓ Model loaded successfully from: {model_path}")
        
        if self.metrics:
            print(f"✓ Model performance (test set):")
            print(f"  - RMSE: {self.metrics['test']['rmse']:.2f}")
            print(f"  - MAE: {self.metrics['test']['mae']:.2f}")
            print(f"  - R²: {self.metrics['test']['r2']:.3f}")
            print(f"  - Category Accuracy: {self.metrics['category']['category_accuracy']:.1%}")
    
    def predict_24h(self, recent_data: List[Dict], 
                   return_confidence: bool = False) -> Dict:
        """
        Predict AQI for next 24 hours using recent historical data
        
        Args:
            recent_data: List of recent measurements (ideally 48+ hours for robust lag features)
            return_confidence: Whether to include prediction confidence intervals
            
        Returns:
            Dictionary with forecast information
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        if len(recent_data) < 24:
            print(f"Warning: Only {len(recent_data)} hours of data provided. "
                  f"Recommend 48+ hours for best predictions.")
        
        # Engineer features from recent data
        df = self.feature_engineer.engineer_features(recent_data, target_col='aqi')
        
        # Prepare features (use the last row as current state)
        X, _, feature_names = self.feature_engineer.prepare_for_training(
            df, target_col='aqi', drop_na=False
        )
        
        # Take the most recent complete row (no NaN values)
        valid_rows = X.notna().all(axis=1)
        if not valid_rows.any():
            raise ValueError(
                "Insufficient data to create complete feature set. "
                "Need at least 24-48 hours of historical data."
            )
        
        # Get last valid row
        X_current = X[valid_rows].iloc[[-1]]
        
        # Normalize if scaler params exist
        if self.feature_engineer.scaler_params is not None:
            X_current = self.feature_engineer.normalize_features(X_current, fit=False)
        
        # Make prediction
        predicted_aqi = self.model.predict(X_current)[0]
        
        # Get AQI category
        aqi_category = self._get_aqi_category(predicted_aqi)
        
        # Build forecast result
        forecast = {
            'predicted_aqi': round(float(predicted_aqi), 1),
            'category': aqi_category['name'],
            'category_level': aqi_category['level'],
            'health_message': aqi_category['message'],
            'forecast_timestamp': (datetime.now() + timedelta(hours=24)).isoformat(),
            'prediction_made_at': datetime.now().isoformat()
        }
        
        # Add confidence intervals if requested (using model's estimators)
        if return_confidence and hasattr(self.model, 'estimators_'):
            # Use standard error from test metrics if available
            if self.metrics and 'test' in self.metrics:
                rmse = self.metrics['test']['rmse']
                
                # 95% confidence interval (±1.96 * RMSE)
                forecast['confidence_interval'] = {
                    'lower': round(float(predicted_aqi - 1.96 * rmse), 1),
                    'upper': round(float(predicted_aqi + 1.96 * rmse), 1),
                    'confidence_level': 0.95
                }
        
        return forecast
    
    def predict_hourly_sequence(self, recent_data: List[Dict], 
                               hours_ahead: int = 24) -> List[Dict]:
        """
        Generate hourly predictions for multiple hours ahead
        Note: This is a simplified version - for production, you'd want to
        retrain models for each forecast horizon or use recursive forecasting
        
        Args:
            recent_data: List of recent measurements
            hours_ahead: Number of hours to forecast (default: 24)
            
        Returns:
            List of hourly forecasts
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        forecasts = []
        
        # For now, return the same prediction for all hours
        # In production, you'd train separate models for each horizon
        # or use an autoregressive approach
        base_forecast = self.predict_24h(recent_data, return_confidence=True)
        
        for hour in range(1, hours_ahead + 1):
            forecast_time = datetime.now() + timedelta(hours=hour)
            
            hourly_forecast = {
                'hour': hour,
                'timestamp': forecast_time.isoformat(),
                'predicted_aqi': base_forecast['predicted_aqi'],
                'category': base_forecast['category'],
                'category_level': base_forecast['category_level']
            }
            
            forecasts.append(hourly_forecast)
        
        return forecasts
    
    def get_feature_contributions(self, recent_data: List[Dict], 
                                 top_n: int = 10) -> List[Dict]:
        """
        Get top contributing features for the prediction
        
        Args:
            recent_data: List of recent measurements
            top_n: Number of top features to return
            
        Returns:
            List of feature contributions
        """
        if not self.is_loaded or self.feature_importance is None:
            raise RuntimeError("Model and feature importance not loaded.")
        
        # Get top features by importance
        top_features = list(self.feature_importance.items())[:top_n]
        
        contributions = []
        for feat_name, importance in top_features:
            contributions.append({
                'feature': feat_name,
                'importance': round(float(importance), 4),
                'importance_percent': round(float(importance) * 100, 2)
            })
        
        return contributions
    
    def _get_aqi_category(self, aqi_value: float) -> Dict:
        """
        Get AQI category information
        
        Args:
            aqi_value: AQI value
            
        Returns:
            Dictionary with category info
        """
        if aqi_value <= 50:
            return {
                'level': 0,
                'name': 'Good',
                'color': '#00E400',
                'message': 'Air quality is satisfactory, and air pollution poses little or no risk.'
            }
        elif aqi_value <= 100:
            return {
                'level': 1,
                'name': 'Moderate',
                'color': '#FFFF00',
                'message': 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.'
            }
        elif aqi_value <= 150:
            return {
                'level': 2,
                'name': 'Unhealthy for Sensitive Groups',
                'color': '#FF7E00',
                'message': 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.'
            }
        elif aqi_value <= 200:
            return {
                'level': 3,
                'name': 'Unhealthy',
                'color': '#FF0000',
                'message': 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.'
            }
        elif aqi_value <= 300:
            return {
                'level': 4,
                'name': 'Very Unhealthy',
                'color': '#99004C',
                'message': 'Health alert: The risk of health effects is increased for everyone.'
            }
        else:
            return {
                'level': 5,
                'name': 'Hazardous',
                'color': '#7E0023',
                'message': 'Health warning of emergency conditions: everyone is more likely to be affected.'
            }
    
    def get_model_info(self) -> Dict:
        """
        Get information about the loaded model
        
        Returns:
            Dictionary with model information
        """
        if not self.is_loaded:
            return {'status': 'not_loaded', 'message': 'No model loaded'}
        
        info = {
            'status': 'loaded',
            'model_type': 'GradientBoostingRegressor',
            'n_estimators': self.model.n_estimators if hasattr(self.model, 'n_estimators') else None,
            'n_features': self.metrics.get('n_features') if self.metrics else None,
            'training_date': self.metrics.get('training_date') if self.metrics else None
        }
        
        if self.metrics:
            info['performance'] = {
                'test_rmse': self.metrics['test']['rmse'],
                'test_mae': self.metrics['test']['mae'],
                'test_r2': self.metrics['test']['r2'],
                'category_accuracy': self.metrics['category']['category_accuracy'],
                'within_one_category_accuracy': self.metrics['category']['within_one_category_accuracy']
            }
        
        return info
    
    def validate_input_data(self, data: List[Dict]) -> Dict:
        """
        Validate that input data has required fields
        
        Args:
            data: List of measurement dictionaries
            
        Returns:
            Validation result
        """
        required_fields = ['timestamp', 'aqi']
        recommended_fields = [
            'temperature', 'humidity', 'pressure', 'wind_speed', 'wind_direction',
            'pm25', 'pm10', 'no2', 'o3', 'so2', 'co',
            'cloud_cover', 'visibility', 'aod'
        ]
        
        if not data:
            return {
                'valid': False,
                'error': 'No data provided'
            }
        
        # Check first record for field presence
        first_record = data[0]
        
        missing_required = [f for f in required_fields if f not in first_record]
        missing_recommended = [f for f in recommended_fields if f not in first_record]
        
        if missing_required:
            return {
                'valid': False,
                'error': f'Missing required fields: {", ".join(missing_required)}'
            }
        
        result = {
            'valid': True,
            'n_records': len(data),
            'missing_recommended': missing_recommended,
            'completeness': 1 - (len(missing_recommended) / len(recommended_fields))
        }
        
        if missing_recommended:
            result['warning'] = f'Missing recommended fields: {", ".join(missing_recommended)}'
        
        return result


def main():
    """
    Example usage
    """
    print("AQI Predictor - Example Usage")
    print("=" * 50)
    
    # Initialize predictor
    predictor = AQIPredictor(model_dir='models')
    
    # Try to load model
    try:
        predictor.load_model('aqi_predictor.joblib')
        print("\n✓ Model loaded successfully!")
        
        # Show model info
        info = predictor.get_model_info()
        print(f"\nModel Information:")
        print(json.dumps(info, indent=2))
        
    except FileNotFoundError:
        print("\n✗ No trained model found.")
        print("Please train a model first using:")
        print("  python aqi_model_trainer.py")
        print("\nExample prediction code:")
        print("""
# After loading model:
recent_data = [
    {
        'timestamp': '2025-10-03T00:00:00',
        'aqi': 65,
        'pm25': 18.5,
        'temperature': 22.5,
        'humidity': 55,
        'wind_speed': 3.2,
        # ... more fields
    },
    # ... more hourly records (need 24-48 hours)
]

forecast = predictor.predict_24h(recent_data, return_confidence=True)
print(forecast)
        """)


if __name__ == '__main__':
    main()
