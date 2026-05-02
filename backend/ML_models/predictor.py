import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta

def train_demand_model(historical_data: pd.DataFrame):
    """
    Module 8: Future Skill Demand Prediction
    Uses Time-Series or Regression over historical posting datasets to predict
    the rising or falling demand of a skill over the next 3-5 years.
    
    Args:
        historical_data (pd.DataFrame): Data containing [date, skill_name, posting_count]
    
    Returns:
        RandomForestRegressor model ready for forecasting.
    """
    # Assuming standard timestamped data parsed into features: [year, month, historic_cnt] -> Y: target_cnt
    
    X = historical_data[['year', 'month', 'prev_month_count']]
    Y = historical_data['current_count']

    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_model.fit(X, Y)
    
    return rf_model

def forecast_skill_demand(rf_model: RandomForestRegressor, skill_name: str, years: int = 3) -> dict:
    """
    Forecasts a trend line (demand multiplier) for a target skill over N years.
    """
    
    # Placeholder Logic: Real application feeds simulated future dates into the model
    # X_future = [...]
    # Y_pred = rf_model.predict(X_future)
    
    # Simulated Trend Generator for Module Output Requirement
    current_year = datetime.now().year
    
    # E.g., Python might grow 12% YOY, COBOL might shrink -5% YOY
    # Mocking a Time-Series Output Array format for D3 / Chart.js Data
    trends = []
    base_val = np.random.randint(100, 500)
    modifier = np.random.uniform(0.9, 1.25)
    
    for yr in range(current_year, current_year + years):
        trends.append({
            "year": yr,
            "projected_demand": round(base_val)
        })
        base_val = base_val * modifier
        
    return {
        "skill": skill_name,
        "trend_data": trends,
        "growing": modifier > 1.0
    }
