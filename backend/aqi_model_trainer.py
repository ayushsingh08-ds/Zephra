"""
AQI Model Training Module
Trains Gradient Boosting models for 24-hour AQI forecasting
"""

import numpy as np
import pandas as pd
import joblib
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Tuple, Optional, List
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import warnings
warnings.filterwarnings('ignore')

from feature_engineering import AQIFeatureEngineer


class AQIModelTrainer:
    """
    Trains and evaluates Gradient Boosting models for AQI prediction
    """
    
    def __init__(self, model_dir: str = 'models'):
        """
        Initialize trainer
        
        Args:
            model_dir: Directory to save trained models
        """
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(exist_ok=True)
        
        self.feature_engineer = AQIFeatureEngineer()
        self.model = None
        self.metrics = {}
        self.feature_importance = {}
        
    def prepare_data(self, data: List[Dict], target_col: str = 'aqi',
                    forecast_horizon: int = 24) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare data for training with forecast horizon
        
        Args:
            data: List of dictionaries containing historical measurements
            target_col: Target variable name
            forecast_horizon: Hours ahead to forecast (default: 24)
            
        Returns:
            Tuple of (features_df, target_series)
        """
        # Engineer features
        df = self.feature_engineer.engineer_features(data, target_col=target_col)
        
        # Create target variable (AQI at +forecast_horizon hours)
        df['target_aqi'] = df[target_col].shift(-forecast_horizon)
        
        # Prepare features and target
        X, y, feature_names = self.feature_engineer.prepare_for_training(
            df, target_col='target_aqi', drop_na=True
        )
        
        return X, y
    
    def create_model(self, **params) -> GradientBoostingRegressor:
        """
        Create Gradient Boosting model with specified parameters
        
        Args:
            **params: Model hyperparameters
            
        Returns:
            Configured GradientBoostingRegressor
        """
        default_params = {
            'n_estimators': 200,
            'learning_rate': 0.1,
            'max_depth': 5,
            'min_samples_split': 20,
            'min_samples_leaf': 10,
            'subsample': 0.8,
            'max_features': 'sqrt',
            'random_state': 42,
            'verbose': 0
        }
        
        # Update with user-provided params
        default_params.update(params)
        
        return GradientBoostingRegressor(**default_params)
    
    def time_series_split_train(self, X: pd.DataFrame, y: pd.Series,
                                n_splits: int = 5) -> Dict:
        """
        Train model using time-series cross-validation
        
        Args:
            X: Feature DataFrame
            y: Target Series
            n_splits: Number of time-series splits
            
        Returns:
            Dictionary with cross-validation metrics
        """
        tscv = TimeSeriesSplit(n_splits=n_splits)
        
        cv_scores = {
            'rmse': [],
            'mae': [],
            'r2': []
        }
        
        print(f"Starting {n_splits}-fold time-series cross-validation...")
        
        for fold, (train_idx, val_idx) in enumerate(tscv.split(X), 1):
            X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
            y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
            
            # Train model
            model = self.create_model()
            model.fit(X_train, y_train)
            
            # Predict on validation set
            y_pred = model.predict(X_val)
            
            # Calculate metrics
            rmse = np.sqrt(mean_squared_error(y_val, y_pred))
            mae = mean_absolute_error(y_val, y_pred)
            r2 = r2_score(y_val, y_pred)
            
            cv_scores['rmse'].append(rmse)
            cv_scores['mae'].append(mae)
            cv_scores['r2'].append(r2)
            
            print(f"Fold {fold}: RMSE={rmse:.2f}, MAE={mae:.2f}, R²={r2:.3f}")
        
        # Average scores
        avg_scores = {
            'rmse_mean': np.mean(cv_scores['rmse']),
            'rmse_std': np.std(cv_scores['rmse']),
            'mae_mean': np.mean(cv_scores['mae']),
            'mae_std': np.std(cv_scores['mae']),
            'r2_mean': np.mean(cv_scores['r2']),
            'r2_std': np.std(cv_scores['r2'])
        }
        
        print(f"\nCross-Validation Results:")
        print(f"RMSE: {avg_scores['rmse_mean']:.2f} ± {avg_scores['rmse_std']:.2f}")
        print(f"MAE: {avg_scores['mae_mean']:.2f} ± {avg_scores['mae_std']:.2f}")
        print(f"R²: {avg_scores['r2_mean']:.3f} ± {avg_scores['r2_std']:.3f}")
        
        return avg_scores
    
    def calculate_aqi_category_accuracy(self, y_true: np.ndarray, 
                                       y_pred: np.ndarray) -> Dict:
        """
        Calculate accuracy for AQI category predictions
        
        AQI Categories:
        - Good: 0-50
        - Moderate: 51-100
        - Unhealthy for Sensitive: 101-150
        - Unhealthy: 151-200
        - Very Unhealthy: 201-300
        - Hazardous: 301+
        
        Args:
            y_true: True AQI values
            y_pred: Predicted AQI values
            
        Returns:
            Dictionary with category metrics
        """
        def get_aqi_category(aqi):
            if aqi <= 50:
                return 'Good'
            elif aqi <= 100:
                return 'Moderate'
            elif aqi <= 150:
                return 'Unhealthy_Sensitive'
            elif aqi <= 200:
                return 'Unhealthy'
            elif aqi <= 300:
                return 'Very_Unhealthy'
            else:
                return 'Hazardous'
        
        # Convert to categories
        true_categories = [get_aqi_category(aqi) for aqi in y_true]
        pred_categories = [get_aqi_category(aqi) for aqi in y_pred]
        
        # Calculate accuracy
        correct = sum(1 for t, p in zip(true_categories, pred_categories) if t == p)
        total = len(true_categories)
        accuracy = correct / total if total > 0 else 0
        
        # Within-one-category accuracy (allows ±1 category error)
        categories_order = ['Good', 'Moderate', 'Unhealthy_Sensitive', 
                           'Unhealthy', 'Very_Unhealthy', 'Hazardous']
        
        within_one = 0
        for t, p in zip(true_categories, pred_categories):
            t_idx = categories_order.index(t)
            p_idx = categories_order.index(p)
            if abs(t_idx - p_idx) <= 1:
                within_one += 1
        
        within_one_accuracy = within_one / total if total > 0 else 0
        
        return {
            'category_accuracy': accuracy,
            'within_one_category_accuracy': within_one_accuracy,
            'total_samples': total
        }
    
    def train(self, X: pd.DataFrame, y: pd.Series, 
             test_size: float = 0.2, normalize: bool = True,
             **model_params) -> Dict:
        """
        Train final model on all data with train-test split
        
        Args:
            X: Feature DataFrame
            y: Target Series
            test_size: Proportion of data for testing
            normalize: Whether to normalize features
            **model_params: Model hyperparameters
            
        Returns:
            Dictionary with training metrics
        """
        # Time-based split (not random to avoid data leakage)
        split_idx = int(len(X) * (1 - test_size))
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
        
        print(f"\nTraining set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")
        
        # Normalize if requested
        if normalize:
            X_train = self.feature_engineer.normalize_features(X_train, fit=True)
            X_test = self.feature_engineer.normalize_features(X_test, fit=False)
        
        # Create and train model
        self.model = self.create_model(**model_params)
        
        print("\nTraining Gradient Boosting model...")
        self.model.fit(X_train, y_train)
        
        # Predictions
        y_train_pred = self.model.predict(X_train)
        y_test_pred = self.model.predict(X_test)
        
        # Calculate metrics
        train_metrics = {
            'rmse': np.sqrt(mean_squared_error(y_train, y_train_pred)),
            'mae': mean_absolute_error(y_train, y_train_pred),
            'r2': r2_score(y_train, y_train_pred)
        }
        
        test_metrics = {
            'rmse': np.sqrt(mean_squared_error(y_test, y_test_pred)),
            'mae': mean_absolute_error(y_test, y_test_pred),
            'r2': r2_score(y_test, y_test_pred)
        }
        
        # AQI category accuracy
        category_metrics = self.calculate_aqi_category_accuracy(
            y_test.values, y_test_pred
        )
        
        # Feature importance
        self.feature_importance = dict(zip(
            X.columns, 
            self.model.feature_importances_
        ))
        
        # Sort by importance
        self.feature_importance = dict(
            sorted(self.feature_importance.items(), 
                  key=lambda x: x[1], reverse=True)
        )
        
        # Store all metrics
        self.metrics = {
            'train': train_metrics,
            'test': test_metrics,
            'category': category_metrics,
            'training_date': datetime.now().isoformat(),
            'n_features': X.shape[1],
            'n_samples': len(X)
        }
        
        print(f"\nTraining Results:")
        print(f"Train RMSE: {train_metrics['rmse']:.2f}, MAE: {train_metrics['mae']:.2f}, R²: {train_metrics['r2']:.3f}")
        print(f"Test RMSE: {test_metrics['rmse']:.2f}, MAE: {test_metrics['mae']:.2f}, R²: {test_metrics['r2']:.3f}")
        print(f"Category Accuracy: {category_metrics['category_accuracy']:.1%}")
        print(f"Within-1 Category: {category_metrics['within_one_category_accuracy']:.1%}")
        
        return self.metrics
    
    def save_model(self, model_name: str = 'aqi_predictor.joblib'):
        """
        Save trained model and associated artifacts
        
        Args:
            model_name: Name for the model file
        """
        if self.model is None:
            raise ValueError("No model trained yet. Call train() first.")
        
        model_path = self.model_dir / model_name
        
        # Save model
        joblib.dump(self.model, model_path)
        print(f"\nModel saved to: {model_path}")
        
        # Save feature engineer (with scaler params)
        engineer_path = self.model_dir / 'feature_engineer.joblib'
        joblib.dump(self.feature_engineer, engineer_path)
        print(f"Feature engineer saved to: {engineer_path}")
        
        # Save metrics
        metrics_path = self.model_dir / 'metrics.json'
        with open(metrics_path, 'w') as f:
            json.dump(self.metrics, f, indent=2)
        print(f"Metrics saved to: {metrics_path}")
        
        # Save feature importance
        importance_path = self.model_dir / 'feature_importance.json'
        with open(importance_path, 'w') as f:
            json.dump(self.feature_importance, f, indent=2)
        print(f"Feature importance saved to: {importance_path}")
        
        # Save top 20 features for reference
        top_features = list(self.feature_importance.keys())[:20]
        print(f"\nTop 20 Most Important Features:")
        for i, feat in enumerate(top_features, 1):
            print(f"{i}. {feat}: {self.feature_importance[feat]:.4f}")
    
    def load_model(self, model_name: str = 'aqi_predictor.joblib'):
        """
        Load trained model and artifacts
        
        Args:
            model_name: Name of the model file
        """
        model_path = self.model_dir / model_name
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        self.model = joblib.load(model_path)
        
        # Load feature engineer
        engineer_path = self.model_dir / 'feature_engineer.joblib'
        if engineer_path.exists():
            self.feature_engineer = joblib.load(engineer_path)
        
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
        
        print(f"Model loaded from: {model_path}")


def main():
    """
    Example training script
    """
    # This is a placeholder - in practice, you'd load real historical data
    print("AQI Model Trainer - Example Usage")
    print("=" * 50)
    print("\nTo train a model, you need:")
    print("1. Historical data (24+ hours) with weather, AQ, and satellite measurements")
    print("2. Call trainer.prepare_data() to engineer features")
    print("3. Call trainer.train() to train the model")
    print("4. Call trainer.save_model() to persist the model")
    print("\nExample:")
    print("""
    from aqi_model_trainer import AQIModelTrainer
    
    # Initialize trainer
    trainer = AQIModelTrainer(model_dir='models')
    
    # Prepare data (assumes you have historical_data list)
    X, y = trainer.prepare_data(historical_data, target_col='aqi', forecast_horizon=24)
    
    # Train model
    metrics = trainer.train(X, y, test_size=0.2, normalize=True)
    
    # Save model
    trainer.save_model('aqi_predictor.joblib')
    """)


if __name__ == '__main__':
    main()
