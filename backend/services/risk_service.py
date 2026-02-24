def calculate_total_risk(ownership_score, device, behavior):
    risk = 0

    if ownership_score < 60:
        risk += 40

    if behavior["loginTime"] < 2000:
        risk += 30

    if "Headless" in device["userAgent"]:
        risk += 30

    return risk