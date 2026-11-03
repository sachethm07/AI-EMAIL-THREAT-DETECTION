"""Explainable multi-factor score. Every point can be traced to a named factor."""
LEVELS = ((75, "Critical"), (50, "High"), (25, "Medium"), (0, "Low"))


def level_for(score: int) -> str:
    return next(name for floor, name in LEVELS if score >= floor)


def score(ml: dict, lang: dict, auth: dict, anomalies: list, urls: list, atts: list, intel_hits: list) -> dict:
    factors = []

    def add(name, points, cap, detail):
        factors.append({"name": name, "points": min(cap, points), "max": cap, "detail": detail})

    add("AI classification", round(20 * ml["p_malicious"]), 20, f"Model says {ml['label']} ({ml['confidence']:.0%} confidence)")
    cats = ", ".join(lang["categories"]) or "none"
    add("Suspicious language", lang["points"], 10, f"Language categories found: {cats}")
    weights = {"spf": 7, "dkim": 5, "dmarc": 8}
    a = 0
    for mech, value in auth.items():
        if value in ("fail", "softfail", "permerror"):
            a += weights[mech]
        elif value in ("none", "temperror", "neutral"):
            a += 2
    add("Authentication", a, 20, f"SPF {auth['spf']}, DKIM {auth['dkim']}, DMARC {auth['dmarc']}")
    add("Header anomalies", sum(x["points"] for x in anomalies), 15, "; ".join(x["detail"] for x in anomalies) or "Sender fields are consistent")
    flagged_urls = [u for u in urls if u["flags"]]
    add("URLs and domains", sum(min(6, 3 * len(u["flags"])) for u in urls), 15, f"{len(flagged_urls)} of {len(urls)} links flagged")
    flagged_atts = [x for x in atts if x["flags"]]
    add("Attachments", sum(min(10, 5 * len(x["flags"])) for x in atts), 10, f"{len(flagged_atts)} of {len(atts)} files flagged")
    weight = {"high": 4, "medium": 2, "low": 1}
    add("Threat intelligence", sum(weight.get(h.get("severity", "low"), 1) for h in intel_hits), 10, f"{len(intel_hits)} indicators match known bad activity")
    total = min(100, sum(f["points"] for f in factors))
    level = level_for(total)
    if level == "Low":
        verdict = "spam" if ml["label"] == "spam" else "legitimate"
    elif level == "Medium":
        verdict = "spam" if ml["label"] == "spam" else "suspicious"
    elif level == "High":
        verdict = "phishing"
    else:
        verdict = "malicious" if flagged_atts else "phishing"
    return {"score": total, "level": level, "verdict": verdict, "factors": factors}
