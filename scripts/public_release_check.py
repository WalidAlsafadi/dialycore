"""Fail when public-release candidate files contain common hazards.

The scanner reports paths and safe reason labels only. It never prints file
contents, matching lines, secrets, or record values. Candidate files include
tracked files and non-ignored untracked files in the working tree.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT_SUFFIXES = {".css", ".html", ".js", ".json", ".md", ".py", ".sh", ".sql", ".toml", ".tsx", ".ts", ".txt", ".yml", ".yaml"}
UNSAFE_SUFFIXES = {
    ".csv", ".db", ".key", ".p12", ".pem", ".pfx", ".sqlite",
    ".sqlite3", ".tsv", ".xls", ".xlsx",
}
UNSAFE_DIRECTORIES = {"docs/report", "frontend/dist", "__pycache__", "node_modules"}
UNSAFE_BASENAMES = {"logo-1.png", "logo-2.png", "logo-en.jpg", "logo-en.png", "logo-footer-2.png"}
PROHIBITED_TEXT = [
    ("institution name", "al-" + "shifa"),
    ("institution name variant", "al " + "shifa"),
    ("institutional branding", "ministry" + " of health"),
    ("obsolete demo account", "admin@" + "dialysis.com"),
    ("obsolete demo account", "doctor@" + "dialysis.com"),
    ("obsolete demo account", "nurse@" + "dialysis.com"),
    ("obsolete package name", "dialysis" + "manager-pro"),
    ("obsolete API title", "dialysis unit records" + " api"),
    ("obsolete UI title", "dialysis" + " department"),
]


def candidate_files() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    return [ROOT / item.decode("utf-8") for item in result.stdout.split(b"\0") if item]


def scan() -> list[tuple[str, str]]:
    findings: set[tuple[str, str]] = set()
    for path in candidate_files():
        relative = path.relative_to(ROOT).as_posix()
        lower_relative = relative.lower()
        if not path.is_file():
            continue
        if path.suffix.lower() in UNSAFE_SUFFIXES:
            findings.add((relative, "tracked database or source-data export"))
        if path.name == ".env" or (path.name.startswith(".env.") and path.name != ".env.example"):
            findings.add((relative, "tracked environment file"))
        if path.name.lower() in UNSAFE_BASENAMES:
            findings.add((relative, "legacy institutional image filename"))
        if any(lower_relative == directory or lower_relative.startswith(directory + "/") or f"/{directory}/" in lower_relative for directory in UNSAFE_DIRECTORIES):
            findings.add((relative, "tracked generated/private directory"))
        if path.suffix.lower() not in TEXT_SUFFIXES or path.stat().st_size > 2_000_000:
            continue
        try:
            text = path.read_text(encoding="utf-8").lower()
        except UnicodeDecodeError:
            findings.add((relative, "non-UTF-8 content in expected text file"))
            continue
        for reason, needle in PROHIBITED_TEXT:
            if needle in text:
                findings.add((relative, reason))
    return sorted(findings)


def main() -> int:
    findings = scan()
    if findings:
        print("Public-release check FAILED:")
        for path, reason in findings:
            print(f"- {path}: {reason}")
        return 1
    print("Public-release check passed: no candidate-file hazards detected.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
