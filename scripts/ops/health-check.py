#!/usr/bin/env python3
"""Cron/monitoring-friendly HTTP health poller for Obliq-io.

Polls one or more endpoints on an interval and exits non-zero the moment any
of them fails `--retries` times in a row, so it works equally well as a
one-shot CI gate (`--once`) or a long-running sidecar (plain cron/systemd
timer/Task Scheduler). Stdlib only -- no extra install step before you can
run it anywhere Python 3 exists.

Examples:
    python scripts/ops/health-check.py http://localhost:4000/health
    python scripts/ops/health-check.py --once https://obliq-api.onrender.com/health
    python scripts/ops/health-check.py -i 30 -r 3 https://obliq-api.onrender.com/health https://obliq.vercel.app
"""
from __future__ import annotations

import argparse
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class EndpointState:
    url: str
    consecutive_failures: int = 0
    last_status: int | None = None
    last_error: str | None = None


def check_once(url: str, timeout: float) -> tuple[bool, int | None, str | None]:
    """Returns (ok, status_code, error_message)."""
    try:
        req = urllib.request.Request(url, method="GET", headers={"User-Agent": "obliq-health-check/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = resp.getcode()
            return 200 <= status < 400, status, None
    except urllib.error.HTTPError as e:
        return False, e.code, str(e)
    except (urllib.error.URLError, OSError, TimeoutError) as e:
        return False, None, str(e)


def log(message: str) -> None:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{timestamp}] {message}", flush=True)


def run(urls: list[str], interval: float, retries: int, timeout: float, once: bool) -> int:
    states = {url: EndpointState(url=url) for url in urls}
    # In --once mode there is only ever a single attempt per URL, so "N
    # consecutive failures" can never be reached at any threshold above 1 --
    # a single failed check must count as down immediately.
    effective_retries = 1 if once else retries

    while True:
        any_down = False

        for state in states.values():
            ok, status, error = check_once(state.url, timeout)
            state.last_status = status
            state.last_error = error

            if ok:
                if state.consecutive_failures > 0:
                    log(f"RECOVERED {state.url} (status={status})")
                else:
                    log(f"OK {state.url} (status={status})")
                state.consecutive_failures = 0
            else:
                state.consecutive_failures += 1
                log(
                    f"FAIL {state.url} "
                    f"(status={status}, error={error}, "
                    f"consecutive_failures={state.consecutive_failures}/{effective_retries})"
                )

            if state.consecutive_failures >= effective_retries:
                any_down = True

        if once:
            return 1 if any_down else 0

        if any_down:
            log("One or more endpoints are down past the retry threshold -- exiting.")
            return 1

        time.sleep(interval)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("urls", nargs="+", help="One or more endpoint URLs to poll")
    parser.add_argument("-i", "--interval", type=float, default=10.0, help="Seconds between polls (default: 10)")
    parser.add_argument(
        "-r", "--retries", type=int, default=3, help="Consecutive failures before declaring an endpoint down (default: 3)"
    )
    parser.add_argument("-t", "--timeout", type=float, default=10.0, help="Per-request timeout in seconds (default: 10)")
    parser.add_argument("--once", action="store_true", help="Check each URL once and exit immediately (CI gate mode)")
    args = parser.parse_args()

    return run(args.urls, args.interval, args.retries, args.timeout, args.once)


if __name__ == "__main__":
    sys.exit(main())
