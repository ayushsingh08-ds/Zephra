"""
Feature Engineering Module for AQI Prediction
Handles lag features, rolling statistics, time encoding, and meteorological indices
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional


class AQIFeatureEngineer:
    """
    Feature engineering for AQI prediction using:
    - Weather data (MERRA-2)
    - Air quality measurements (TEMPO/OpenAQ)
    - Satellite data (MODIS/VIIRS)
    """
    
    def __init__(self):
        self.feature_names = []
        self.scaler_params = None
        
    def create_time_features(self, df: pd.DataFrame, timestamp_col: str = 'timestamp') -> pd.DataFrame:
        """
        Create temporal features from timestamp
        
        Args:
            df: DataFrame with timestamp column
            timestamp_col: Name of timestamp column
            
        Returns:
            DataFrame with added time features
        """
        df = df.copy()
        
        # Ensure timestamp is datetime
        if not pd.api.types.is_datetime64_any_dtype(df[timestamp_col]):
            df[timestamp_col] = pd.to_datetime(df[timestamp_col])
        
        # Extract time components
        df['hour'] = df[timestamp_col].dt.hour
        df['day_of_week'] = df[timestamp_col].dt.dayofweek
        df['day_of_month'] = df[timestamp_col].dt.day
        df['month'] = df[timestamp_col].dt.month
        df['day_of_year'] = df[timestamp_col].dt.dayofyear
        
        # Cyclical encoding for periodic features
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        df['day_of_week_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_of_week_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        
        # Season (0=Winter, 1=Spring, 2=Summer, 3=Fall)
        df['season'] = (df['month'] % 12 // 3)
        
        return df
    
    def create_lag_features(self, df: pd.DataFrame, columns: List[str], 
                           lags: List[int] = [1, 6, 12, 24]) -> pd.DataFrame:
        """
        Create lagged features for specified columns
        
        Args:
            df: DataFrame sorted by timestamp
            columns: List of column names to create lags for
            lags: List of lag periods (in hours)
            
        Returns:
            DataFrame with added lag features
        """
        df = df.copy()
        
        for col in columns:
            if col not in df.columns:
                continue
                
            for lag in lags:
                df[f'{col}_lag_{lag}h'] = df[col].shift(lag)
        
        return df
    
    def create_rolling_features(self, df: pd.DataFrame, columns: List[str],
                               windows: List[int] = [3, 6, 12, 24]) -> pd.DataFrame:
        """
        Create rolling statistics (mean, std, min, max) for specified columns
        
        Args:
            df: DataFrame sorted by timestamp
            columns: List of column names to create rolling features for
            windows: List of window sizes (in hours)
            
        Returns:
            DataFrame with added rolling features
        """
        df = df.copy()
        
        for col in columns:
            if col not in df.columns:
                continue
                
            for window in windows:
                # Rolling mean
                df[f'{col}_rolling_mean_{window}h'] = df[col].rolling(
                    window=window, min_periods=1
                ).mean()
                
                # Rolling std
                df[f'{col}_rolling_std_{window}h'] = df[col].rolling(
                    window=window, min_periods=1
                ).std()
                
                # Rolling min
                df[f'{col}_rolling_min_{window}h'] = df[col].rolling(
                    window=window, min_periods=1
                ).min()
                
                # Rolling max
                df[f'{col}_rolling_max_{window}h'] = df[col].rolling(
                    window=window, min_periods=1
                ).max()
        
        return df
    
    def create_meteorological_indices(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create derived meteorological features that affect pollutant dispersion
        
        Args:
            df: DataFrame with weather data
            
        Returns:
            DataFrame with added meteorological indices
        """
        df = df.copy()
        
        # Wind dispersion index (wind speed × direction component)
        if 'wind_speed' in df.columns and 'wind_direction' in df.columns:
            # Convert wind direction to radians
            wind_dir_rad = np.deg2rad(df['wind_direction'])
            
            # U and V components (horizontal wind vectors)
            df['wind_u'] = df['wind_speed'] * np.cos(wind_dir_rad)
            df['wind_v'] = df['wind_speed'] * np.sin(wind_dir_rad)
            
            # Wind dispersion potential
            df['wind_dispersion_index'] = df['wind_speed'] ** 1.5  # Higher power = more dispersion
        
        # Temperature-based inversions (proxy: temp - dew_point or temp gradient)
        if 'temperature' in df.columns and 'humidity' in df.columns:
            # Approximate dew point using Magnus formula
            a = 17.27
            b = 237.7
            alpha = ((a * df['temperature']) / (b + df['temperature'])) + np.log(df['humidity'] / 100.0)
            df['dew_point'] = (b * alpha) / (a - alpha)
            
            # Inversion probability indicator (smaller difference = higher inversion risk)
            df['temp_dew_diff'] = df['temperature'] - df['dew_point']
            df['inversion_risk'] = 1 / (1 + df['temp_dew_diff'])  # Higher when diff is small
        
        # Atmospheric stability indicator
        if 'pressure' in df.columns and 'temperature' in df.columns:
            # Normalized pressure-temperature ratio
            df['stability_index'] = df['pressure'] / (df['temperature'] + 273.15)
        
        # Haze indicator (cloud cover + AOD)
        if 'cloud_cover' in df.columns and 'aod' in df.columns:
            df['haze_indicator'] = df['cloud_cover'] * df['aod']
        
        # Visibility-based diffusion
        if 'visibility' in df.columns:
            # Lower visibility = higher pollution concentration
            df['diffusion_potential'] = 1 / (1 + df['visibility'])
        
        # Heat index (feels-like temperature)
        if 'temperature' in df.columns and 'humidity' in df.columns:
            T = df['temperature']
            RH = df['humidity']
            
            # Simplified heat index formula
            df['heat_index'] = (
                -8.78469475556 + 
                1.61139411 * T + 
                2.33854883889 * RH + 
                -0.14611605 * T * RH
            )
        
        return df
    
    def create_pollutant_interactions(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create interaction features between different pollutants
        
        Args:
            df: DataFrame with pollutant data
            
        Returns:
            DataFrame with added interaction features
        """
        df = df.copy()
        
        pollutants = ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co']
        available_pollutants = [p for p in pollutants if p in df.columns]
        
        # Ratios between pollutants (can indicate source types)
        if 'pm25' in df.columns and 'pm10' in df.columns:
            df['pm25_pm10_ratio'] = df['pm25'] / (df['pm10'] + 0.001)  # Avoid div by zero
        
        if 'no2' in df.columns and 'o3' in df.columns:
            df['no2_o3_ratio'] = df['no2'] / (df['o3'] + 0.001)
        
        # Total oxidants
        if 'no2' in df.columns and 'o3' in df.columns:
            df['total_oxidants'] = df['no2'] + df['o3']
        
        # Particulate matter sum
        if 'pm25' in df.columns and 'pm10' in df.columns:
            df['total_pm'] = df['pm25'] + df['pm10']
        
        return df
    
    def engineer_features(self, data: List[Dict], target_col: str = 'aqi') -> pd.DataFrame:
        """
        Main feature engineering pipeline
        
        Args:
            data: List of dictionaries containing raw measurements
            target_col: Name of target variable (default: 'aqi')
            
        Returns:
            DataFrame with engineered features
        """
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Ensure timestamp exists
        if 'timestamp' not in df.columns:
            df['timestamp'] = pd.date_range(end=datetime.now(), periods=len(df), freq='H')
        
        # Sort by timestamp
        df = df.sort_values('timestamp').reset_index(drop=True)
        
        # 1. Time features
        df = self.create_time_features(df)
        
        # 2. Meteorological indices
        df = self.create_meteorological_indices(df)
        
        # 3. Pollutant interactions
        df = self.create_pollutant_interactions(df)
        
        # 4. Lag features for important variables
        lag_columns = [target_col, 'pm25', 'pm10', 'no2', 'o3', 'temperature', 
                      'wind_speed', 'humidity', 'pressure']
        lag_columns = [col for col in lag_columns if col in df.columns]
        df = self.create_lag_features(df, lag_columns, lags=[1, 6, 12, 24])
        
        # 5. Rolling features for pollutants and weather
        rolling_columns = [target_col, 'pm25', 'pm10', 'no2', 'o3', 'temperature', 'wind_speed']
        rolling_columns = [col for col in rolling_columns if col in df.columns]
        df = self.create_rolling_features(df, rolling_columns, windows=[3, 6, 12, 24])
        
        return df
    
    def prepare_for_training(self, df: pd.DataFrame, target_col: str = 'aqi', 
                            drop_na: bool = True) -> tuple:
        """
        Prepare features and target for model training
        
        Args:
            df: DataFrame with engineered features
            target_col: Name of target variable
            drop_na: Whether to drop rows with NaN values
            
        Returns:
            Tuple of (X, y, feature_names)
        """
        # Exclude non-feature columns
        exclude_cols = ['timestamp', target_col]
        
        # Select feature columns
        feature_cols = [col for col in df.columns if col not in exclude_cols]
        
        X = df[feature_cols]
        y = df[target_col] if target_col in df.columns else None
        
        # Drop rows with NaN (from lag features)
        if drop_na and y is not None:
            valid_idx = X.notna().all(axis=1) & y.notna()
            X = X[valid_idx]
            y = y[valid_idx]
        elif drop_na:
            X = X.dropna()
        
        self.feature_names = feature_cols
        
        return X, y, feature_cols
    
    def normalize_features(self, X: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        """
        Normalize features using standardization (z-score)
        
        Args:
            X: Feature DataFrame
            fit: Whether to fit the scaler (True for training, False for inference)
            
        Returns:
            Normalized DataFrame
        """
        if fit:
            # Store mean and std for each feature
            self.scaler_params = {
                'mean': X.mean(),
                'std': X.std()
            }
        
        if self.scaler_params is None:
            raise ValueError("Scaler not fitted. Call with fit=True first.")
        
        # Apply z-score normalization
        X_normalized = (X - self.scaler_params['mean']) / (self.scaler_params['std'] + 1e-8)
        
        return X_normalized
    
    def get_feature_importance_groups(self) -> Dict[str, List[str]]:
        """
        Group features by type for analysis
        
        Returns:
            Dictionary mapping feature types to feature names
        """
        groups = {
            'time': [],
            'weather': [],
            'pollutants': [],
            'satellite': [],
            'lag': [],
            'rolling': [],
            'derived': []
        }
        
        for feat in self.feature_names:
            if any(x in feat for x in ['hour', 'day', 'month', 'season']):
                groups['time'].append(feat)
            elif 'lag' in feat:
                groups['lag'].append(feat)
            elif 'rolling' in feat:
                groups['rolling'].append(feat)
            elif any(x in feat for x in ['temperature', 'wind', 'humidity', 'pressure']):
                groups['weather'].append(feat)
            elif any(x in feat for x in ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co']):
                groups['pollutants'].append(feat)
            elif any(x in feat for x in ['cloud', 'visibility', 'aod', 'ndvi']):
                groups['satellite'].append(feat)
            else:
                groups['derived'].append(feat)
        
        return groups
