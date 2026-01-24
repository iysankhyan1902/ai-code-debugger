import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .error_utils import classify_error
from .prompts import build_prompt
from .llm import call_llm
from django.http import JsonResponse
from django.shortcuts import render

def home(request):
    return render(request, "analyzer/home.html")


@csrf_exempt
def debug_code(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request method"}, 
                            status=405)

    data = json.loads(request.body)

    code = data.get("code", "")
    error = data.get("error", "")
    mode = data.get("mode", "full")  # default full solution

    # classify error
    error_type = classify_error(error)

    # build structured prompt
    prompt = build_prompt(code, error, error_type, mode)

    # call LLM
    result = call_llm(prompt)

    # return response
    return JsonResponse({
        "result": result,
        "error_type": error_type,
        "mode": mode
    })
