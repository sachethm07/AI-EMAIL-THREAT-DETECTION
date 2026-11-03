import os

import joblib


class ThreatClassifier:
    """Wraps the trained scikit-learn pipeline. Falls back to language indicators if no model file exists."""

    def __init__(self, path: str):
        self.path, self.pipe = path, None
        self.load()

    def load(self) -> None:
        self.pipe = joblib.load(self.path) if os.path.exists(self.path) else None

    def predict(self, text: str, language_points: int) -> dict:
        if self.pipe is not None:
            probs = {c: round(float(p), 4) for c, p in zip(self.pipe.classes_, self.pipe.predict_proba([text])[0])}
            label = max(probs, key=probs.get)
            return {"label": label, "confidence": probs[label], "probabilities": probs,
                    "p_malicious": round(1 - probs.get("legitimate", 0.0), 4), "source": "trained-model"}
        p = round(min(0.95, language_points / 12), 4)
        label = "phishing" if p >= 0.5 else "legitimate"
        return {"label": label, "confidence": max(p, 1 - p), "probabilities": {label: max(p, 1 - p)},
                "p_malicious": p, "source": "heuristic-fallback (train a model with ml/train.py)"}
