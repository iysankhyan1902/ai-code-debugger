def debug_code(code: str, error: str) -> str:
    return f"""
You are an expert software engineer.

The user is facing an error in their code.

CODE:
{code}

ERROR:
{error}

Tasks:
1. Explain what the error means
2. Identify the mistake in the code
3. Provide corrected code
4. Give a short debugging tip

Respond clearly using bullet points.
"""
