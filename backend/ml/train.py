"""
BANKORA Machine Learning Training Pipeline
Trains 5 classification models on the UCI Bank Marketing Dataset:
1. Logistic Regression
2. Decision Tree Classifier
3. Random Forest Classifier
4. Gradient Boosting Classifier
5. K-Nearest Neighbors Classifier

Strictly prevents data leakage:
- Pre-Call Pipeline excludes `duration` (only known after a call ends).
- Fits StandardScaler and OneHotEncoder exclusively on stratified training split.
- Saves best model and preprocessing pipeline via Joblib.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neighbors import KNeighborsClassifier
from backend.ml.evaluate import evaluate_model_on_test

RANDOM_STATE = 42

REQUIRED_COLUMNS = [
    "age", "job", "marital", "education", "default", "balance",
    "housing", "loan", "contact", "day", "month", "duration",
    "campaign", "pdays", "previous", "poutcome", "y"
]

CATEGORICAL_FEATURES = [
    "job", "marital", "education", "default",
    "housing", "loan", "contact", "month", "poutcome"
]

NUMERICAL_FEATURES_PRE_CALL = ["age", "balance", "day", "campaign", "pdays", "previous"]
NUMERICAL_FEATURES_POST_CALL = ["age", "balance", "day", "duration", "campaign", "pdays", "previous"]


def load_and_clean_dataset(csv_path: str) -> pd.DataFrame:
    sep = ";" if open(csv_path, "r", encoding="utf-8").readline().count(";") >= 15 else ","
    df = pd.read_csv(csv_path, sep=sep)
    df.columns = [c.strip().lower() for c in df.columns]

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required UCI Bank Marketing columns: {missing}")

    df = df.drop_duplicates().reset_index(drop=True)
    df["y_binary"] = df["y"].astype(str).str.lower().map(lambda v: 1 if v in ("yes", "1", "true") else 0)
    return df


def build_preprocessor(exclude_duration: bool = True) -> ColumnTransformer:
    num_cols = NUMERICAL_FEATURES_PRE_CALL if exclude_duration else NUMERICAL_FEATURES_POST_CALL
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_cols),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
        ]
    )


def get_candidate_models():
    return {
        "logistic": (
            "Logistic Regression",
            LogisticRegression(max_iter=1000, class_weight="balanced", random_state=RANDOM_STATE),
        ),
        "decision_tree": (
            "Decision Tree",
            DecisionTreeClassifier(max_depth=6, min_samples_leaf=12, class_weight="balanced", random_state=RANDOM_STATE),
        ),
        "random_forest": (
            "Random Forest",
            RandomForestClassifier(
                n_estimators=150,
                max_depth=8,
                min_samples_leaf=8,
                class_weight="balanced_subsample",
                random_state=RANDOM_STATE,
                n_jobs=-1,
            ),
        ),
        "gradient_boosting": (
            "Gradient Boosting",
            GradientBoostingClassifier(
                n_estimators=140,
                learning_rate=0.08,
                max_depth=4,
                subsample=0.85,
                random_state=RANDOM_STATE,
            ),
        ),
        "knn": (
            "K-Nearest Neighbors",
            KNeighborsClassifier(n_neighbors=15, weights="distance", metric="euclidean"),
        ),
    }


def train_and_save_pipeline(csv_path: str, saved_models_dir: str, exclude_duration: bool = True):
    os.makedirs(saved_models_dir, exist_ok=True)
    df = load_and_clean_dataset(csv_path)

    num_cols = NUMERICAL_FEATURES_PRE_CALL if exclude_duration else NUMERICAL_FEATURES_POST_CALL
    feature_cols = num_cols + CATEGORICAL_FEATURES

    X = df[feature_cols]
    y = df["y_binary"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=RANDOM_STATE
    )

    best_score = -1.0
    best_pipeline = None
    best_model_name = ""
    evaluation_results = []

    for model_id, (model_name, clf) in get_candidate_models().items():
        preprocessor = build_preprocessor(exclude_duration=exclude_duration)
        pipe = Pipeline([("preprocessor", preprocessor), ("classifier", clf)])
        pipe.fit(X_train, y_train)

        metrics = evaluate_model_on_test(pipe, X_test, y_test, model_id, model_name)
        evaluation_results.append(metrics)

        composite = metrics["rocAuc"] * 0.6 + metrics["f1Score"] * 0.4
        if composite > best_score:
            best_score = composite
            best_pipeline = pipe
            best_model_name = model_name

    mode_tag = "pre_call" if exclude_duration else "post_call"
    model_path = os.path.join(saved_models_dir, f"best_model_{mode_tag}.joblib")
    joblib.dump(best_pipeline, model_path)

    eval_path = os.path.join(saved_models_dir, f"evaluation_{mode_tag}.json")
    with open(eval_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "mode": mode_tag,
                "bestModelName": best_model_name,
                "datasetSize": len(df),
                "trainSize": len(X_train),
                "testSize": len(X_test),
                "models": evaluation_results,
            },
            f,
            indent=2,
        )

    return best_pipeline, evaluation_results


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    dataset_file = os.path.join(base_dir, "dataset", "bank-marketing.csv")
    out_dir = os.path.join(base_dir, "backend", "saved_models")
    train_and_save_pipeline(dataset_file, out_dir, exclude_duration=True)
    train_and_save_pipeline(dataset_file, out_dir, exclude_duration=False)
