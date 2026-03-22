"""
Run all three CloserArena Fetch uAgents in one terminal (separate OS processes).

  python run_all_agents.py

Ctrl+C stops every child process.
"""

from __future__ import annotations

import os
import signal
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = [
    "practice_bridge_agent.py",
    "stats_agent.py",
    "challenge_agent.py",
]


def main() -> None:
    procs: list[subprocess.Popen[bytes]] = []
    for name in SCRIPTS:
        path = os.path.join(ROOT, name)
        if not os.path.isfile(path):
            print(f"Missing {path}", file=sys.stderr)
            sys.exit(1)
        p = subprocess.Popen([sys.executable, path], cwd=ROOT)
        procs.append(p)
        print(f"Started {name} (pid {p.pid})")

    def shutdown(*_args: object) -> None:
        for p in procs:
            if p.poll() is None:
                p.terminate()
        for p in procs:
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                p.kill()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        while True:
            time.sleep(0.75)
            for i, p in enumerate(procs):
                code = p.poll()
                if code is not None:
                    print(
                        f"{SCRIPTS[i]} (pid {p.pid}) exited with {code}",
                        file=sys.stderr,
                    )
                    shutdown()
                    sys.exit(code if code is not None else 1)
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
