"""
BANKORA Real-Time Customer Inference Module
Loads the trained Joblib pipeline and predicts term deposit subscription probability.
"""

import os
import joblib
import pandas as pd


def predict_customer_subscription(customer_dict: dict, saved_models_dir: str) -> dict:
    mode = customer_dict.get("modelMode", "pre_call")
    model_file = os.path.join(saved_models_dir, f"best_model_{mode}.joblib")

    if not os.path.exists(model_file):
        raise FileNotFoundError(f"Trained model file not found at {model_file}. Run train.py first.")

    pipeline = joblib.load(model_file)
    df_input = pd.DataFrame([customer_dict])
    prob = float(pipeline.predict_proba(df_input)[0, 1])
    pred = "yes" if prob >= 0.48 else "no"
    label = "Likely to Subscribe" if pred == "yes" else "Unlikely to Subscribe"

    return {
        "prediction": pred,
        "label": label,
        "probability": round(prob, 4),
        "modelMode": mode,
    }
