import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .error_utils import classify_error
from .prompts import build_prompt
from .llm import call_llm
from django.http import JsonResponse
from django.shortcuts import render
import time
import traceback

def detect_python_error(code: str):
    try:
        compile(code, "<user_code>", "exec")
        return None
    except Exception:
        return traceback.format_exc()



RATE_LIMIT = {}
MAX_REQUESTS = 5
WINDOW_SECONDS = 60

def is_rate_limited(ip: str) -> bool:
    now = time.time()

    # First request from this IP
    if ip not in RATE_LIMIT:
        RATE_LIMIT[ip] = []

    # Keep only requests inside the time window
    RATE_LIMIT[ip] = [
        timestamp for timestamp in RATE_LIMIT[ip]
        if now - timestamp < WINDOW_SECONDS
    ]

    # If limit exceeded → block
    if len(RATE_LIMIT[ip]) >= MAX_REQUESTS:
        return True

    # Otherwise allow and record this request
    RATE_LIMIT[ip].append(now)
    return False


LOW_CONFIDENCE_PHRASES = [
    "not sure",
    "might be",
    "possibly",
    "cannot determine",
    "unclear",
    "guess"
]

def is_low_confidence(response: str) -> bool:
    response = response.strip()

    if response.startswith(
        "ERROR_REASON: Unable to determine confidently"
    ):
        return True

    response_lower = response.lower()
    return any(phrase in response_lower for phrase in LOW_CONFIDENCE_PHRASES)



def home(request):
    return render(request, "analyzer/home.html")


@csrf_exempt
def debug_code(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Invalid request method"},
            status=405
        )

    data = json.loads(request.body)

    code = data.get("code", "")
    error = data.get("error", "")
    mode = data.get("mode", "full")  # default full solution

    # INPUT VALIDATION 
    if not code.strip():
        return JsonResponse(
            {"error": "Code input is empty"},
            status=400
        )

    detected_error = detect_python_error(code)
    
    error = error.strip()
    # If user error is missing OR Python detected an error
    if detected_error:
        error = detected_error
    elif not error:
        error = "No explicit error message provided. Analyze the code and infer possible issues."


    MAX_LINES = 300
    if len(code.splitlines()) > MAX_LINES:
        return JsonResponse(
            {"error": "Code too long. Please submit under 300 lines."},
            status=400
        )

    suspicious_phrases = [
        "ignore previous",
        "you are chatgpt",
        "act as",
        "system prompt"
    ]

    lower_code = code.lower()
    for phrase in suspicious_phrases:
        if phrase in lower_code:
            return JsonResponse(
                {"error": "Invalid or unsafe input detected"},
                status=400
            )
        
    
    ip = request.META.get("REMOTE_ADDR", "unknown")
    if is_rate_limited(ip):
        return JsonResponse(
        {"error": "Too many requests. Please try again after some time."},
        status=429
    )



    # classify error
    error_type = classify_error(error)

    # build structured prompt
    prompt = build_prompt(code, error, error_type, mode)

    # call LLM
    result = call_llm(prompt)
    
    
    if is_low_confidence(result):
        return JsonResponse({
        "result": "Unable to confidently diagnose the issue with the given information.",
        "error_type": error_type,
        "mode": mode,
        "confidence": "low",
        "timestamp": time.time()
    })
    
    return JsonResponse({
    "result": result,
    "error_type": error_type,
    "mode": mode,
    "confidence": "high"
})


