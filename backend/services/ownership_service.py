def calculate_ownership_score(name, telecom_data):
    score = 0

    if telecom_data["owner"] == name:
        score += 70
    else:
        score += 20

    if telecom_data["sim_age"] > 1:
        score += 30

    return score