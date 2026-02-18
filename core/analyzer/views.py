import json
import time
import traceback
from .models import CodeSubmission
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from .error_utils import classify_error
from .prompts import build_prompt
from .llm import call_llm
from .models import CodeSubmission


# ================= REGISTER =================

def register(request):
    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect("home")
    else:
        form = UserCreationForm()

    return render(request, "register.html", {"form": form})


# ================= PYTHON ERROR DETECTION =================

def detect_python_error(code: str):
    try:
        compile(code, "<user_code>", "exec")
        return None
    except Exception:
        return traceback.format_exc()


# ================= RATE LIMITING =================

RATE_LIMIT = {}
MAX_REQUESTS = 5
WINDOW_SECONDS = 60

def is_rate_limited(ip: str) -> bool:
    now = time.time()

    if ip not in RATE_LIMIT:
        RATE_LIMIT[ip] = []

    RATE_LIMIT[ip] = [
        timestamp for timestamp in RATE_LIMIT[ip]
        if now - timestamp < WINDOW_SECONDS
    ]

    if len(RATE_LIMIT[ip]) >= MAX_REQUESTS:
        return True

    RATE_LIMIT[ip].append(now)
    return False


# ================= CONFIDENCE CHECK =================

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


# ================= HOME =================

@login_required
def home(request):
    return render(request, "analyzer/home.html")


# ================= DEBUG API =================

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
    mode = data.get("mode", "full")

    # INPUT VALIDATION
    if not code.strip():
        return JsonResponse(
            {"error": "Code input is empty"},
            status=400
        )

    detected_error = detect_python_error(code)

    error = error.strip()

    if detected_error:
        error = detected_error
    elif not error:
        error = "No explicit error message provided. Analyze the code and infer possible issues."

    # LINE LIMIT
    MAX_LINES = 300
    if len(code.splitlines()) > MAX_LINES:
        return JsonResponse(
            {"error": "Code too long. Please submit under 300 lines."},
            status=400
        )

    # PROMPT INJECTION PROTECTION
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

    # RATE LIMITING
    ip = request.META.get("REMOTE_ADDR", "unknown")
    if is_rate_limited(ip):
        return JsonResponse(
            {"error": "Too many requests. Please try again after some time."},
            status=429
        )

    # CLASSIFY ERROR
    error_type = classify_error(error)

    # BUILD PROMPT
    prompt = build_prompt(code, error, error_type, mode)

    # CALL LLM
    result = call_llm(prompt)

    # BUILD RESPONSE DATA FIRST
    if is_low_confidence(result):
        response_data = {
            "result": "Unable to confidently diagnose the issue with the given information.",
            "error_type": error_type,
            "mode": mode,
            "confidence": "low",
            "timestamp": time.time()
        }
    else:
        response_data = {
            "result": result,
            "error_type": error_type,
            "mode": mode,
            "confidence": "high",
            "timestamp": time.time()
        }

    # ================= SAVE HISTORY =================
    if request.user.is_authenticated:
        CodeSubmission.objects.create(
            user=request.user,
            code=code,
            language="python",
            error_message=error,
            ai_response=response_data
        )

    return JsonResponse(response_data)


# ================= HISTORY PAGE =================

@login_required
def history_view(request):
    submissions = CodeSubmission.objects.filter(
        user=request.user
    ).order_by("-submitted_at")

    return render(request, "analyzer/history.html", {
        "submissions": submissions
    })


