let editor;

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
   DOM READY
============================= */
document.addEventListener("DOMContentLoaded", () => {

    /* Clear code */
    const clearButton = document.getElementById("clearCodeBtn");
    
    clearButton.addEventListener("click", function () {
    if (editor) {
        editor.setValue("");
    }
});



    /* Clear output */
    const clearOutputBtn = document.getElementById("clearOutputBtn");
    
    clearOutputBtn.addEventListener("click", () => {
    const ids = [
        "errorReason",
        "problemLine",
        "explanation",
        "fixedCode",
        "example"
    ];

    ids.forEach(id => {
        document.getElementById(id).innerText = "—";
    });
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

    } catch (err) {
        console.error("Clipboard error:", err);
        alert("Copy failed. Use https or localhost.");
    }
});


    /* Theme toggle */
    const btn = document.getElementById("themeToggle");

    if (localStorage.getItem("theme") === "light") {
        document.body.classList.add("light");
        btn.innerText = "☀️ Light Mode";
    }

    btn.addEventListener("click", () => {
        document.body.classList.toggle("light");

        if (document.body.classList.contains("light")) {
            localStorage.setItem("theme", "light");
            btn.innerText = "☀️ Light Mode";
        } else {
            localStorage.setItem("theme", "dark");
            btn.innerText = "🌙 Dark Mode";
        }
    });

    /* Collapsible sections */
    document.querySelectorAll(".ai-toggle").forEach(button => {
        button.addEventListener("click", () => {
            const content = button.nextElementSibling;
            const isOpen = content.style.display === "block";

            if (isOpen) {
               content.style.display = "none";
          } 
          else 
               {
                    content.style.display = "block";
               }

            button.innerText =
                (isOpen ? "▶ " : "▼ ") + button.innerText.slice(2);
        });
    });

    /* =============================
       FORM SUBMISSION (MOVED HERE)
    ============================= */
    document.getElementById("debugForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!editor) {
            alert("Editor not ready yet");
            return;
        }

        const code = editor.getValue();
        const error = document.getElementById("error").value;
        const mode = document.querySelector('input[name="mode"]:checked').value;

        if (!code.trim()) return;

        const csrfToken =
            document.querySelector("[name=csrfmiddlewaretoken]").value;

        const response = await fetch("/debug/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken
            },
            body: JSON.stringify({ code, error, mode })
        });

        const data = await response.json();
        console.log("AI RESPONSE:", data); // 
        if (data.mode === "hint") {
    showHintOnly(data.result);
} else {
    showFullOutput(data.error || data.result);
}


    });
});


function showHintOnly(hintText) {
    // show hint, hide full UI
    document.getElementById("hintOutput").style.display = "block";
    document.getElementById("fullOutput").style.display = "none";

    document.getElementById("hintText").innerText = hintText;
}

function showFullOutput(rawText) {
    // hide hint, show full UI
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
