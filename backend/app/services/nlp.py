import re

from nltk.stem import PorterStemmer
from nltk.tokenize import RegexpTokenizer

_tok = RegexpTokenizer(r"[a-z]{2,}")  # no NLTK data download needed
_stem = PorterStemmer()


def tokenize(text: str) -> list[str]:
    """Used by the TF-IDF vectoriser at training and prediction time. Keep it identical in both."""
    return [_stem.stem(t) for t in _tok.tokenize((text or "").lower())]


LEXICON = {
    "urgency": (r"\b(urgent|immediately|asap|within \d+ hours?|expires? (today|soon)|act now|final notice|last warning)\b", 2),
    "threat": (r"\b(suspend(ed)?|terminated?|locked|blocked|deactivat\w+|legal action|penalty|unauthori[sz]ed)\b", 2),
    "credentials": (r"\b(password|passcode|otp|cvv|login|sign in|verify your (account|identity)|confirm your)\b", 3),
    "financial": (r"\b(bank|invoice|payment|wire transfer|refund|kyc|upi|bitcoin|crypto|gift card)\b", 1),
    "reward": (r"\b(lottery|winner|prize|reward|free gift|claim now)\b", 2),
    "authority": (r"\b(ceo|it (support|helpdesk)|security team|administrator|tax department)\b", 1),
}


def indicators(text: str) -> dict:
    low, found, points = (text or "").lower(), {}, 0
    for cat, (pattern, weight) in LEXICON.items():
        matches = sorted({m.group(0) for m in re.finditer(pattern, low)})
        if matches:
            found[cat] = matches[:8]
            points += weight
    return {"categories": found, "points": min(10, points)}
