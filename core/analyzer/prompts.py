def build_prompt(code: str, error: str, error_type: str, mode: str) -> str:
    base_prompt = f"""
You are an expert Python debugging assistant.

Error Type: {error_type}

Code:
{code}

Error Message:
{error}
"""

    if mode == "hint":
        base_prompt += """
Give only hints.
- Do NOT give full corrected code
- Explain what might be wrong
- Guide the user step by step
"""
    else:
        base_prompt += """
Do the following:
1. Identify the root cause
2. Explain it in simple terms
3. Point out the exact problematic line
4. Provide corrected code
5. Mention one common mistake related to this error
"""

    return base_prompt

