"""Live integration tests for bigyear.py. They hit the real eBird API and site.

Skipped unless BIGYEAR_LIVE=1, so a plain `pytest` stays offline. Run only
when Sara asks:

    BIGYEAR_LIVE=1 pytest test_live.py

Needs `.env` with EBIRD_API_KEY, EBIRD_SESSION and BIGYEAR_SEEN_LIST. The
assertions check structure, not specific values, so they survive data and
season changes. Each test runs the real CLI in a subprocess, the same way
you would from a shell.
"""
import os
import subprocess
import sys
from pathlib import Path

import pytest

pytestmark = pytest.mark.skipif(
    os.environ.get("BIGYEAR_LIVE") != "1",
    reason="live eBird test; set BIGYEAR_LIVE=1 to run",
)

HERE = Path(__file__).parent
REGION = "CA-BC-GV"
HOTSPOT = "L164543"  # Maplewood Flats, a well-established hotspot.


def run(*args: str, ok: bool = True) -> str:
    """Run ./bigyear.py ARGS from this directory. Returns stderr + stdout.

    Headers and progress go to stderr and tables go to stdout, so stderr
    comes first: nothing trails a table except more table.
    """
    # BROWSER=true makes `map` run the no-op `true URL` instead of opening a tab.
    env = {**os.environ, "BROWSER": "true"}
    proc = subprocess.run(
        [sys.executable, "bigyear.py", *args],
        cwd=HERE, env=env, capture_output=True, text=True, timeout=600,
    )
    out = proc.stderr + proc.stdout
    assert (proc.returncode == 0) == ok, out
    return out


def table_rows(out: str, header: str) -> list[str]:
    """Non-blank lines after the header line and its `---` divider."""
    lines = out.splitlines()
    start = next(i for i, line in enumerate(lines) if header in line)
    return [line for line in lines[start + 2:] if line.strip()]


def test_rank():
    out = run("rank", REGION, "--top", "3")
    assert "Seen list:" in out
    assert "still on your target list" in out
    assert table_rows(out, "Hits  AllSp  LocId       Hotspot")


def test_rank_species_filter():
    out = run("rank", REGION, "--species", "spotted sandpiper", "--top", "5")
    assert "Filtering to hotspots with any of: Spotted Sandpiper" in out
    rows = table_rows(out, "Hits  AllSp  LocId       Hotspot")
    assert "Spotted Sandpiper" in "\n".join(rows)


def test_targets():
    out = run("targets", REGION)
    rows = table_rows(out, "Avg  Code       Species")
    assert rows
    for row in rows:
        avg = float(row.split()[1])  # row: " 1  4.5  amerob    American Robin"
        assert 0.0 <= avg <= 9.0, row


def test_targets_invalid_region():
    out = run("targets", "BC-CA", ok=False)
    assert "returned 0 species" in out


def test_deepdive_fast():
    out = run("deepdive", HOTSPOT, "--fast")
    assert "Bar-chart buckets around" in out
    assert table_rows(out, "Bkt    Species")


def test_deepdive_slow():
    out = run("deepdive", HOTSPOT, "--back", "7")
    if "No checklists at" in out:  # A quiet week is a pass.
        return
    assert "Fetching" in out
    assert "Pct    N  Bkt  Last" in out


def test_leaving():
    out = run("leaving", REGION)
    assert "Comparing" in out
    # Either result is a pass, depending on the season.
    assert "Now  In    Drop  Species" in out or "No targets at bucket >=" in out


def test_map():
    out = run("map", "american robin")
    assert "Opening: American Robin → https://ebird.org/map/amerob?" in out
