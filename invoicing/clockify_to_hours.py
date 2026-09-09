"""Convert a Clockify Detailed Time Report CSV into hours.csv format.

Groups billable entries by day, sums their durations, and concatenates the
per-task descriptions into `raw_description` like:
    "0:15 Validation task | 0:45 Meeting | 1:30 Another task"

The `description` column is left blank for you to fill in with a clean
per-day summary before generating the invoice.

Usage:
    python3 clockify_to_hours.py <clockify.csv> [output.csv]
"""
import csv
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path


def parse_duration_hms(s: str) -> tuple[int, int]:
    """Return (hours, minutes) from 'HH:MM:SS'."""
    h, m, _ = s.split(":")
    return int(h), int(m)


def fmt_hm(hours: int, minutes: int) -> str:
    return f"{hours}:{minutes:02d}"


def convert(in_path: str, out_path: str) -> None:
    by_day: dict[str, list[tuple[str, str, float]]] = defaultdict(list)
    # entries: (hm_label, description, decimal_hours)

    with open(in_path, newline="") as f:
        for row in csv.DictReader(f):
            if row["Billable"] != "Yes":
                continue
            iso_date = datetime.strptime(row["Start Date"], "%m/%d/%Y").date().isoformat()
            h, m = parse_duration_hms(row["Duration (h)"])
            by_day[iso_date].append((
                fmt_hm(h, m),
                row["Description"].strip(),
                float(row["Duration (decimal)"]),
            ))

    with open(out_path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["date", "hours", "description", "raw_description"])
        for day in sorted(by_day):
            entries = by_day[day]
            total = round(sum(e[2] for e in entries), 2)
            raw = " | ".join(f"{hm} {desc}" for hm, desc, _ in entries)
            w.writerow([day, f"{total:.2f}", "", raw])

    print(f"wrote {out_path} ({len(by_day)} days)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: clockify_to_hours.py <clockify.csv> [output.csv]")
    in_path = sys.argv[1]
    out_path = sys.argv[2] if len(sys.argv) > 2 else "hours.csv"
    convert(in_path, out_path)
