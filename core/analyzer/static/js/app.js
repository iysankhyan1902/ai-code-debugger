let editor;

/* =============================
   GLOBAL SPEECH CONTROL
============================= */
function stopSpeech() {
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
}

/* =============================
   MONACO EDITOR
============================= */
require.config({
  paths: {
    vs: "https://unpkg.com/monaco-editor@0.45.0/min/vs"
  }
});

require(["vs/editor/editor.main"], function () {
  editor = monaco.editor.create(
    document.getElementById("editor"),
    {
      value: "# Write your Python code here\n",
      language: "python",
      theme: "vs-dark",
      automaticLayout: true,
      fontSize: 14
    }
  );

  editor.onDidChangeModelContent(updateStats);
  updateStats();
});

function updateStats() {
  if (!editor) return;

  const code = editor.getValue();
  document.getElementById("lineCount").innerText =
    `Lines: ${code.split("\n").length}`;
  document.getElementById("charCount").innerText =
    `Chars: ${code.length}`;
}

/* =============================
   DOM EVENTS
============================= */
document.addEventListener("DOMContentLoaded", () => {

  const emptyState = document.getElementById("emptyState");
  const debugForm = document.getElementById("debugForm");

  /* Clear code */
  document.getElementById("clearCodeBtn").addEventListener("click", () => {
    if (editor) editor.setValue("");
  });

  /* Clear output */
  document.getElementById("clearOutputBtn").addEventListener("click", () => {
    stopSpeech();

    document.getElementById("hintOutput").style.display = "none";
    document.getElementById("fullOutput").style.display = "block";

    ["errorReason", "problemLine", "explanation", "fixedCode", "example"]
      .forEach(id => document.getElementById(id).innerText = "—");

    document.getElementById("hintText").innerText = "—";

    if (emptyState) {
      emptyState.style.display = "block";
    }
  });

  /* Copy output */
  document.getElementById("copyOutputBtn").addEventListener("click", async () => {
    const outputText = `
ERROR_REASON:
${errorReason.innerText}

PROBLEM_LINE:
${problemLine.innerText}

EXPLANATION:
${explanation.innerText}

FIXED_CODE:
${fixedCode.innerText}

EXAMPLE:
${example.innerText}
`.trim();

    if (!outputText || outputText === "—") {
      alert("Nothing to copy!");
      return;
    }

    try {
      await navigator.clipboard.writeText(outputText);
      const btn = document.getElementById("copyOutputBtn");
      btn.innerText = "Copied!";
      setTimeout(() => btn.innerText = "Copy", 1500);
    } catch {
      alert("Copy failed. Use HTTPS or localhost.");
    }
  });

  /* Listen explanation */
  document.getElementById("listenExplanationBtn")
    .addEventListener("click", () => {
      const text = getTextToSpeak();
      if (!text) {
        alert("Nothing to read yet");
        return;
      }
      speakText(text);
    });

  /* Theme toggle */
  const themeBtn = document.getElementById("themeToggle");
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
    themeBtn.innerText = "☀️ Light Mode";
  }

  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    const isLight = document.body.classList.contains("light");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    themeBtn.innerText = isLight ? "☀️ Light Mode" : "🌙 Dark Mode";
  });

  /* Collapsible AI sections */
  document.querySelectorAll(".ai-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const content = btn.nextElementSibling;
      const isOpen = content.style.display === "block";
      content.style.display = isOpen ? "none" : "block";
      btn.innerText = (isOpen ? "▶ " : "▼ ") + btn.innerText.slice(2);
    });
  });

  /* =============================
     DEBUG FORM (SUBMIT ONLY)
  ============================= */
  debugForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // stop reload

    if (emptyState) {
      emptyState.style.display = "none";
    }

    stopSpeech();

    if (!editor) return;

    const code = editor.getValue();
    const error = document.getElementById("error").value;
    const mode = document.querySelector('input[name="mode"]:checked').value;

    if (!code.trim()) {
      alert("Please enter some code");
      return;
    }

    const csrfToken =
      document.querySelector("[name=csrfmiddlewaretoken]").value;

    try {
      const response = await fetch("/debug/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken
        },
        body: JSON.stringify({ code, error, mode })
      });

      const data = await response.json();

      if (data.mode === "hint") {
        showHintOnly(data.result);
      } else {
        showFullOutput(data.error || data.result);
      }

    } catch (err) {
      console.error("Debug error:", err);
      alert("Something went wrong");
    }
  });
});

/* =============================
   OUTPUT HANDLING
============================= */
function showHintOnly(hintText) {
  document.getElementById("hintOutput").style.display = "block";
  document.getElementById("fullOutput").style.display = "none";
  document.getElementById("hintText").innerText = hintText;
}

function showFullOutput(rawText) {
  document.getElementById("hintOutput").style.display = "none";
  document.getElementById("fullOutput").style.display = "block";
  renderAIOutput(rawText);
}

//Clear output should reset BOTH views

document.getElementById("clearOutputBtn").addEventListener("click", () => {
    document.getElementById("hintOutput").style.display = "none";
    document.getElementById("fullOutput").style.display = "block";

    ["errorReason","problemLine","explanation","fixedCode","example"]
        .forEach(id => document.getElementById(id).innerText = "—");

    document.getElementById("hintText").innerText = "—";
});

/* =============================
   AI OUTPUT PARSER
============================= */
function renderAIOutput(rawText) {
    const sections = {
        ERROR_REASON: "",
        PROBLEM_LINE: "",
        EXPLANATION: "",
        FIXED_CODE: "",
        EXAMPLE: ""
    };

    let currentKey = null;

    rawText.split("\n").forEach(line => {
        const trimmed = line.trim();

        if (trimmed.startsWith("ERROR_REASON:")) {
            currentKey = "ERROR_REASON";
            sections[currentKey] = trimmed.replace("ERROR_REASON:", "").trim();
        } else if (trimmed.startsWith("PROBLEM_LINE:")) {
            currentKey = "PROBLEM_LINE";
            sections[currentKey] = trimmed.replace("PROBLEM_LINE:", "").trim();
        } else if (trimmed.startsWith("EXPLANATION:")) {
            currentKey = "EXPLANATION";
            sections[currentKey] = trimmed.replace("EXPLANATION:", "").trim();
        } else if (trimmed.startsWith("FIXED_CODE:")) {
            currentKey = "FIXED_CODE";
        } else if (trimmed.startsWith("EXAMPLE:")) {
            currentKey = "EXAMPLE";
        } else if (currentKey) {
            sections[currentKey] += "\n" + trimmed;
        }
    });

    errorReason.innerText = sections.ERROR_REASON || "—";
    problemLine.innerText = sections.PROBLEM_LINE || "—";
    explanation.innerText = sections.EXPLANATION || "—";
    fixedCode.innerText = sections.FIXED_CODE || "—";
    example.innerText = sections.EXAMPLE || "—";

    // Auto-open first section
    const firstToggle = document.querySelector(".ai-toggle");
    if (firstToggle) {
        const firstContent = firstToggle.nextElementSibling;
        firstContent.style.display = "block";
        firstToggle.innerText = "▼ " + firstToggle.innerText.slice(2);
    }
}

/* =============================
   TEXT TO SPEECH
============================= */
window.speakText = function (text) {
  if (!("speechSynthesis" in window)) {
    alert("Text-to-Speech not supported");
    return;
  }

  stopSpeech();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  speechSynthesis.speak(utterance);
};

function getTextToSpeak() {
  const hintOutput = document.getElementById("hintOutput");

  if (hintOutput.style.display === "block") {
    const t = document.getElementById("hintText").innerText;
    return t !== "—" ? t.trim() : "";
  }

  const ids = ["errorReason", "problemLine", "explanation", "example"];
  return ids
    .map(id => document.getElementById(id).innerText)
    .filter(t => t && t !== "—")
    .join(". ");
}



