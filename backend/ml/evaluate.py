"""
BANKORA Model Evaluation Module
Computes Accuracy, Precision, Recall, F1-Score, ROC-AUC, Confusion Matrix,
ROC Curve points, and Precision-Recall Curve points on holdout test set.
"""

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
)


def evaluate_model_on_test(pipeline, X_test, y_test, model_id: str, model_name: str) -> dict:
    y_prob = pipeline.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= 0.48).astype(int)

    acc = accuracy_score(y_test, y_pred) * 100
    prec_yes = precision_score(y_test, y_pred, pos_label=1, zero_division=0) * 100
    rec_yes = recall_score(y_test, y_pred, pos_label=1, zero_division=0) * 100
    f1_yes = f1_score(y_test, y_pred, pos_label=1, zero_division=0) * 100
    roc_auc = roc_auc_score(y_test, y_prob) * 100

    prec_no = precision_score(y_test, y_pred, pos_label=0, zero_division=0) * 100
    rec_no = recall_score(y_test, y_pred, pos_label=0, zero_division=0) * 100
    f1_no = f1_score(y_test, y_pred, pos_label=0, zero_division=0) * 100

    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()

    fpr, tpr, roc_thresh = roc_curve(y_test, y_prob)
    step = max(1, len(fpr) // 20)
    roc_points = [
        {"x": round(float(fpr[i]), 3), "y": round(float(tpr[i]), 3), "threshold": round(float(roc_thresh[i]), 3)}
        for i in range(0, len(fpr), step)
    ]

    prec_curve, rec_curve, pr_thresh = precision_recall_curve(y_test, y_prob)
    pr_step = max(1, len(prec_curve) // 20)
    pr_points = [
        {"x": round(float(rec_curve[i]), 3), "y": round(float(prec_curve[i]), 3), "threshold": 0.5}
        for i in range(0, len(prec_curve), pr_step)
    ]

    return {
        "id": model_id,
        "name": model_name,
        "accuracy": round(float(acc), 2),
        "precision": round(float(prec_yes), 2),
        "recall": round(float(rec_yes), 2),
        "f1Score": round(float(f1_yes), 2),
        "rocAuc": round(float(roc_auc), 2),
        "precisionNo": round(float(prec_no), 2),
        "recallNo": round(float(rec_no), 2),
        "f1No": round(float(f1_no), 2),
        "confusionMatrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "rocCurve": roc_points,
        "prCurve": pr_points,
    }
