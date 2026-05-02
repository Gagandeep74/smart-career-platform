from fastapi import APIRouter
from backend.ML_models.predictor import train_demand_model, forecast_skill_demand
import pandas as pd

router = APIRouter(tags=["Future Skill Demand (Module 8)"])

@router.get("/skill-demand/{skill_name}")
def get_skill_forecast(skill_name: str, years: int = 3):
    """ Forecasts Future Skill Demand Trends using Random Forest Time-Series """
    
    # Mocking historical hiring data
    historical_data = pd.DataFrame([
        {'year': 2023, 'month': 1, 'prev_month_count': 100, 'current_count': 120},
        {'year': 2024, 'month': 1, 'prev_month_count': 120, 'current_count': 150},
        {'year': 2025, 'month': 1, 'prev_month_count': 150, 'current_count': 210},
    ])
    
    # 1. Train Model
    rf_model = train_demand_model(historical_data)
    
    # 2. Predict Multipliers
    forecast = forecast_skill_demand(rf_model, skill_name, years=years)
    
    return forecast
