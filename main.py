import os
import sys


sys.path.append(os.path.join(os.path.dirname(__file__), "core"))

from analyzer.prompts import debug_code
from analyzer.llm import call_llm


def main():
    print("=== AI Code Debugger (CLI) ===")

    print("\nPaste your code (end with an empty line):")
    lines = []

    while True:
        line = input()
        if line.strip() == "":
            break
        lines.append(line)

    code = "\n".join(lines)

    error = input("\nPaste the error message: ")

    prompt = debug_code(code, error)
    response = call_llm(prompt)

    print("\n🔍 Debug Result:\n")
    print(response)


if __name__ == "__main__":
    main()

