def classify_error(error_message: str) -> str:
    if not error_message:
        return "NoError"

    if "IndexError" in error_message:
        return "IndexError"
    elif "TypeError" in error_message:
        return "TypeError"
    elif "KeyError" in error_message:
        return "KeyError"
    elif "ValueError" in error_message:
        return "ValueError"
    else:
        return "UnknownError"
