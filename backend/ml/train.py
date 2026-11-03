"""Train and compare email classifiers, then save the best one.

Run from the backend folder:
    python -m ml.train --data data/sample_emails.csv

The CSV needs two columns: text (subject + body) and label (legitimate, spam or phishing).
The bundled sample file only proves the pipeline works. Train on a real labelled corpus.
"""
import argparse
import json

import joblib
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

from app.services.nlp import tokenize


def candidates(min_class_count: int) -> dict:
    return {
        "logistic_regression": LogisticRegression(max_iter=1000, class_weight="balanced"),
        "naive_bayes": MultinomialNB(),
        "random_forest": RandomForestClassifier(n_estimators=300, class_weight="balanced", random_state=42, n_jobs=-1),
        "linear_svm": CalibratedClassifierCV(LinearSVC(class_weight="balanced"), cv=max(2, min(3, min_class_count))),
    }


def make_pipeline(clf, min_df: int) -> Pipeline:
    vec = TfidfVectorizer(tokenizer=tokenize, token_pattern=None, lowercase=False, ngram_range=(1, 2),
                          min_df=min_df, sublinear_tf=True, max_features=50_000)
    return Pipeline([("tfidf", vec), ("clf", clf)])


def metrics(y_true, y_pred) -> dict:
    legit = [i for i, y in enumerate(y_true) if y == "legitimate"]
    false_pos = sum(1 for i in legit if y_pred[i] != "legitimate")
    return {
        "accuracy": round(accuracy_score(y_true, y_pred), 4),
        "precision_macro": round(precision_score(y_true, y_pred, average="macro", zero_division=0), 4),
        "recall_macro": round(recall_score(y_true, y_pred, average="macro", zero_division=0), 4),
        "f1_macro": round(f1_score(y_true, y_pred, average="macro", zero_division=0), 4),
        "false_positive_rate": round(false_pos / len(legit), 4) if legit else None,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", default="ml/model.joblib")
    ap.add_argument("--min-df", type=int, default=1)
    ap.add_argument("--test-size", type=float, default=0.25)
    args = ap.parse_args()

    df = pd.read_csv(args.data).dropna(subset=["text", "label"])
    if "legitimate" not in set(df["label"]):
        raise SystemExit("The dataset needs a 'legitimate' label so false positives can be measured.")
    print("Class balance:\n", df["label"].value_counts().to_string())
    x_tr, x_te, y_tr, y_te = train_test_split(df["text"], df["label"], test_size=args.test_size, stratify=df["label"], random_state=42)

    results = {}
    for name, clf in candidates(int(y_tr.value_counts().min())).items():
        pipe = make_pipeline(clf, args.min_df).fit(x_tr, y_tr)
        results[name] = metrics(list(y_te), list(pipe.predict(x_te)))
        print(f"{name:20s}", results[name])

    best = max(results, key=lambda n: results[n]["f1_macro"])
    final = make_pipeline(candidates(int(df["label"].value_counts().min()))[best], args.min_df).fit(df["text"], df["label"])
    joblib.dump(final, args.out)
    with open(args.out.replace(".joblib", "_metrics.json"), "w") as f:
        json.dump({"best": best, "rows": len(df), "test_size": args.test_size, "results": results}, f, indent=2)
    print(f"\nSaved {best} to {args.out} (refit on all {len(df)} rows).")


if __name__ == "__main__":
    main()
