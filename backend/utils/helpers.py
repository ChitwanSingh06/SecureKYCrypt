def normalize_string(value):
    if not value:
        return ""
    return value.strip().lower()

def log_event(message):
    print(f"[LOG]: {message}")