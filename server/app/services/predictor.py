from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.config import settings

try:
    import joblib  # type: ignore
except Exception:  # pragma: no cover
    joblib = None


@dataclass
class Prediction:
    label: str
    confidence: float
    explanation: str


class FakeNewsPredictor:
    def __init__(self) -> None:
        self.model: Any | None = None
        self.vectorizer: Any | None = None
        self.model_loaded = False
        self._load_artifacts()

    def _load_artifacts(self) -> None:
        if joblib is None:
            return

        model_path = Path(settings.MODEL_PATH)
        vectorizer_path = Path(settings.VECTORIZER_PATH)

        if model_path.exists() and vectorizer_path.exists():
            self.model = joblib.load(model_path)
            self.vectorizer = joblib.load(vectorizer_path)
            self.model_loaded = True

    def predict(self, text: str) -> Prediction:
        clean_text = text.strip()
        if not clean_text:
            return Prediction(
                label='UNCERTAIN',
                confidence=0.0,
                explanation='No input text provided for analysis.',
            )

        if self.model_loaded and self.model is not None and self.vectorizer is not None:
            vector = self.vectorizer.transform([clean_text])
            prediction = self.model.predict(vector)[0]

            confidence = 0.7
            if hasattr(self.model, 'predict_proba'):
                probs = self.model.predict_proba(vector)[0]
                confidence = float(max(probs))

            label = self._normalize_label(str(prediction))
            return Prediction(
                label=label,
                confidence=max(0.0, min(1.0, confidence)),
                explanation='Prediction produced by trained model artifacts.',
            )

        return self._fallback_predict(clean_text)

    def _fallback_predict(self, text: str) -> Prediction:
        fake_indicators = {
            'shocking': 0.18,
            'secret': 0.14,
            'miracle': 0.22,
            'overnight': 0.16,
            '100%': 0.16,
            'cure': 0.2,
            'guaranteed': 0.18,
            'breaking': 0.08,
            'no evidence': 0.24,
            'unverified': 0.2,
        }
        real_indicators = {
            'according to': 0.14,
            'official statement': 0.18,
            'report': 0.08,
            'source': 0.08,
            'study': 0.12,
            'data': 0.1,
            'confirmed': 0.12,
        }

        lowered = text.lower()
        fake_score = sum(weight for token, weight in fake_indicators.items() if token in lowered)
        real_score = sum(weight for token, weight in real_indicators.items() if token in lowered)

        # Extreme punctuation and all-caps patterns can indicate sensationalized claims.
        if lowered.count('!') >= 3:
            fake_score += 0.1
        words = [word for word in text.split() if word]
        uppercase_words = [word for word in words if len(word) > 3 and word.isupper()]
        if words and len(uppercase_words) / len(words) > 0.2:
            fake_score += 0.1

        margin = fake_score - real_score

        if margin > 0.15:
            label = 'FAKE'
            confidence = min(0.95, 0.55 + margin)
            explanation = 'Likely fake: sensational or low-credibility wording detected by fallback rules.'
        elif margin < -0.15:
            label = 'REAL'
            confidence = min(0.95, 0.55 + abs(margin))
            explanation = 'Likely real: language contains credibility indicators and fewer red-flag terms.'
        else:
            label = 'UNCERTAIN'
            confidence = 0.5
            explanation = 'Uncertain: mixed signals detected. Use stronger evidence or full ML model artifacts.'

        return Prediction(label=label, confidence=confidence, explanation=explanation)

    @staticmethod
    def _normalize_label(raw_label: str) -> str:
        normalized = raw_label.strip().lower()
        if normalized in {'fake', 'false', '0'}:
            return 'FAKE'
        if normalized in {'real', 'true', '1', 'reliable'}:
            return 'REAL'
        return 'UNCERTAIN'


predictor = FakeNewsPredictor()
