# AI Code Debugger 🧠🐞

## Overview

The **AI Code Debugger** is a web-based application that helps developers understand and fix errors in their code using **Generative AI**. Users can paste or write code, submit runtime or logical errors, and receive **clear explanations, error reasons, problem lines, examples, and AI-generated hints**.

The project is built to simulate a real-world **AI-assisted debugging workflow**, focusing on clarity, learning, and interview‑ready system design.

---

## Key Features

* 🧑‍💻 **Code Editor (Monaco Editor)** for writing and editing code
* 🐞 **AI-powered debugging** using an LLM backend
* 📌 **Error analysis**:

  * Error reason
  * Problematic line
  * Explanation
  * Example fix
* 🔊 **Text-to-Speech (TTS)** support to listen to explanations
* 🎯 **Hint-based learning** (step-by-step understanding)
* 🌐 **REST API-based backend** using Django
* 🔒 **Rate-limited API calls** to prevent misuse

---

## Tech Stack

### Frontend

* HTML, CSS, JavaScript
* **Monaco Editor** (VS Code–like editor experience)
* Event delegation for handling dynamic buttons
* Fetch API for backend communication

### Backend

* **Python & Django**
* REST-style API endpoints
* LLM integration for AI debugging
* JSON-based request & response handling

---

## How It Works (Flow)

1. User writes or pastes code into the **Monaco Editor**.
2. User submits:

   * Code
   * Error message
   * Debug mode (explain / hint / example)
3. Frontend sends data as **JSON** using `fetch()`.
4. Django backend:

   * Receives request
   * Sends prompt to the LLM
   * Processes and structures the response
5. Backend returns a **JSON response** containing:

   * Error reason
   * Problem line
   * Explanation
   * Example
6. Frontend dynamically updates the UI.
7. User can click **“Listen Explanation”** to hear the AI response via TTS.

---

## Text-to-Speech (TTS) Implementation

* A **Listen** button is added to explanation sections
* Event delegation is used to detect clicks efficiently
* The app extracts visible text content dynamically
* Browser TTS API converts explanation text to speech

This improves accessibility and helps users learn hands‑free.

---

## API Communication Example

```js
const response = await fetch("/debug/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
          "X-CSRFToken": csrfToken
  },
  body: JSON.stringify({ code, error, mode })
});

const data = await response.json();
```

* Frontend sends data as JSON
* Backend responds with structured JSON
* No page reload (async handling)

---

## Project Goals

* Make debugging **educational**, not just corrective
* Help beginners understand *why* errors occur
* Showcase real-world **GenAI integration**
* Demonstrate full-stack skills (Frontend + Backend + AI)

---

## Future Improvements

* Support for multiple programming languages
* Code execution in a sandboxed environment (Docker)
* Authentication & user history
* Voice input for errors
* Save & export debugging sessions

---

## Why This Project Matters

This project demonstrates:

* Practical use of **LLMs in developer tools**
* Clean separation of frontend and backend logic
* REST API design
* Event handling and async JavaScript
* AI + Web development integration

It is ideal for showcasing skills in **Python, Django, JavaScript, and Generative AI**.

---

## Author

**Ishanya Sankhyan**
Aspiring Python / Django & GenAI Developer 🚀

---

Feel free to fork, improve, and experiment with the project!
