"""Shared JSONL store for multi-agent reads (no database)."""

from __future__ import annotations

import json
import os
from typing import Any, Iterator

_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(_ROOT, "data")
SESSIONS_FILE = os.path.join(DATA_DIR, "sessions.jsonl")


def ensure_data_dir() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)


def append_session(record: dict[str, Any]) -> None:
    ensure_data_dir()
    with open(SESSIONS_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def iter_sessions() -> Iterator[dict[str, Any]]:
    if not os.path.isfile(SESSIONS_FILE):
        return
    with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue
