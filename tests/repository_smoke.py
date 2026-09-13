from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
files = [p for p in ROOT.rglob("*") if p.is_file() and p.suffix in {".html", ".css", ".js", ".py", ".java"}]
assert files, "no task manager source files found"
assert all(p.stat().st_size > 0 for p in files)
print("Student Task Management System smoke check passed")
