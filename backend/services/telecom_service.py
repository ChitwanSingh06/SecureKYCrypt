import json

def get_owner_details(number):
    with open("data/telecom_mock_data.json") as f:
        data = json.load(f)
    return data.get(number, {"owner": "Unknown", "sim_age": 0})