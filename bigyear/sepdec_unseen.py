#!/usr/bin/env python3
"""Top 100 most commonly sighted birds in CA-BC during Sep-Dec that aren't on
the year list yet, plus per-subregion distribution.

Standalone ad-hoc script — imports helpers from bigyear.py but is not part of
its CLI. Run with an optional group tag (LM/VI/SI/CN) to scope the analysis.

  ./sepdec_unseen.py           # province-wide
  ./sepdec_unseen.py LM        # Lower Mainland only

Uses bigyear.py's barchart_get (5-year avg, 4 bins/month = 48/year). Sep-Dec =
bins 32-47. For each species, marks each of BC's subnational2 regions:
  UPPER = common there (avg >= 2.0)
  lower = uncommon there (0 < avg < 2.0)
  (omitted if never seen there in Sep-Dec)

Aggregation: max bin-by-bin across in-scope subregions ("shows this bucket
somewhere in the group"), then requires at least one bin >= 2 to include.
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from dotenv import load_dotenv
load_dotenv(HERE / ".env")

from bigyear import (
    barchart_get, load_seen_list, api_get, _seen_list_path,
    subregion_map, _fetch_batch,
)

REGION = "CA-BC"
BINS = list(range(32, 48))  # Sep-Dec, 4 bins/month (Sep 1 = bin 32)
COMMON_THRESHOLD = 2.0

def sparkline(bins):
    return "".join(str(b) if b else "." for b in bins)

def avg_octdec(bins):
    window = [bins[i] for i in BINS]
    return sum(window) / len(window)

seen_names, _ = load_seen_list(_seen_list_path(None))
taxonomy = api_get("/ref/taxonomy/ebird", {"fmt": "json"})
code_to_name = {t["speciesCode"]: t["comName"] for t in taxonomy
                if "speciesCode" in t and "comName" in t}
species_only = {t["speciesCode"] for t in taxonomy
                if t.get("category") == "species"}

# Per-subregion barcharts. Codes look like CA-BC-XX; strip prefix for display.
subs = subregion_map(REGION)

# Geographic groupings of BC's regional districts.
GROUPS = [
    ("LM", "Lower Mainland",       ["GV", "FV", "SC", "SL", "PW"]),
    ("VI", "Vancouver Island",     ["CP", "CV", "NA", "AC", "CX", "MW"]),
    ("SI", "South Interior",       ["TN", "CO", "NO", "OS", "CS", "EK", "CK", "KB"]),
    ("CN", "Central/North",        ["CR", "CC", "FF", "BN", "KS", "SQ", "NR", "PC", "ST"]),
]
# Restrict scope to a single group when invoked with e.g. `... LM` on argv.
SCOPE = sys.argv[1] if len(sys.argv) > 1 else None
if SCOPE:
    GROUPS = [g for g in GROUPS if g[0] == SCOPE]
    if not GROUPS:
        print(f"Unknown group {SCOPE!r}. Try LM, VI, SI, or CN.", file=sys.stderr)
        sys.exit(2)
# Flatten group order → subnational2 code (e.g. "CA-BC-GV") for lookups.
sub_codes = [f"{REGION}-{s}" for _, _, codes in GROUPS for s in codes]
short = {c: c.rsplit("-", 1)[-1] for c in sub_codes}

# Sanity: every subregion returned by the API should appear in exactly one group
# (skip when scoped, since we deliberately dropped groups).
if SCOPE is None:
    api_codes = set(subs.keys())
    scripted_codes = set(sub_codes)
    missing = api_codes - scripted_codes
    extra = scripted_codes - api_codes
    if missing or extra:
        print(f"WARNING: subregion grouping mismatch. missing={missing} extra={extra}",
              file=sys.stderr)

print(f"Fetching {len(sub_codes)} subregion bar charts (cached 30 days)...",
      file=sys.stderr)
sub_bc = {}
with _fetch_batch(len(sub_codes)):
    for c in sub_codes:
        try:
            sub_bc[c] = barchart_get(c)
        except Exception as e:
            print(f"  skipping {c}: {e}", file=sys.stderr)
            sub_bc[c] = {}

# Rank species by unweighted mean Oct-Dec bucket across the in-scope
# subregions. A species must appear in at least one of them to qualify.
def scope_sparkline_bins(code):
    # Max bin-by-bin across in-scope subregions ("shows this bucket somewhere
    # in the group during that half-month"). Avoids averaging away species
    # concentrated in a single subregion.
    per_bin = [0] * len(BINS)
    for c in sub_codes:
        bins = sub_bc.get(c, {}).get(code)
        if not bins:
            continue
        for j, i in enumerate(BINS):
            per_bin[j] = max(per_bin[j], bins[i])
    return per_bin

def scope_avg(code):
    return sum(scope_sparkline_bins(code)) / len(BINS)

rows = []
for code in species_only:
    name = code_to_name.get(code)
    if not name or name in seen_names:
        continue
    if not any(sub_bc.get(c, {}).get(code) for c in sub_codes):
        continue
    spark = scope_sparkline_bins(code)
    # Require at least one Oct-Dec bin at bucket >= 2 in the scope aggregate,
    # to filter out species reported only at eBird's lowest nonzero band.
    if max(spark) < 2:
        continue
    avg = scope_avg(code)
    if avg > 0:
        rows.append((avg, spark, code, name))
rows.sort(key=lambda r: (-r[0], r[3]))
top = rows[:100]

# For each top species, classify each subregion.
def _cell(code, c):
    bins = sub_bc.get(c, {}).get(code)
    if not bins:
        return "  "
    a = avg_octdec(bins)
    if a >= COMMON_THRESHOLD:
        return short[c].upper()
    if a > 0:
        return short[c].lower()
    return "  "

def distribution(code):
    # Grouped columnar layout: 2-char cells within a group, "|" between groups.
    groups = []
    for _, _, codes in GROUPS:
        cells = [_cell(code, f"{REGION}-{s}") for s in codes]
        groups.append(" ".join(cells))
    return " | ".join(groups)

def distribution_header():
    # Row 1: first letter of each code, cell width 3 ("A  "). Between groups: " | ".
    # Row 2: second letter, shifted by 1 within each cell.
    def build(idx):
        groups = []
        for _, _, codes in GROUPS:
            letters = [s[idx] for s in codes]
            if idx == 0:
                groups.append("  ".join(letters))            # letters, 2-space gaps
            else:
                groups.append(" " + "  ".join(letters))      # 1-space offset
        return " | ".join(groups)
    return build(0), build(1)

def group_label_row():
    # Group tag ("LM", "VI"...) centered over each group's block.
    parts = []
    for tag, _, codes in GROUPS:
        width = len(codes) * 3 - 1   # each cell 3 chars, minus trailing space
        parts.append(tag.center(width))
    return "   ".join(parts)

scope_label = f"{REGION}"
if SCOPE:
    scope_label = f"{REGION} / {SCOPE} group ({GROUPS[0][1]})"
print(f"\nTop 100 unseen species in {scope_label}, Sep-Dec avg bucket (0-9).")
print("All stats aggregated across the subregions in scope.")
print("Distribution: UPPER = common there (avg>=2), lower = uncommon, blank = absent.")
print()
print("Subregion codes (BC regional districts), grouped:")
for tag, label, codes in GROUPS:
    print(f"  {tag} ({label}):")
    for s in codes:
        c = f"{REGION}-{s}"
        print(f"    {s} = {subs.get(c, '?')}")
print()
h1, h2 = distribution_header()
group_row = group_label_row()
name_width = max(len(name) for _, _, _, name in top)
# 3(#) + 2 + 4(avg) + 2 + len(BINS)(spark) + 2 + name + 2
name_col_end = 3 + 2 + 4 + 2 + len(BINS) + 2 + name_width + 2
print()
print(f"{'':11}Sep Oct Nov Dec")
print(f"{'':{name_col_end}}subregion code (read each column top-to-bottom):")
print(f"{'':{name_col_end}}" + group_row)
print(f"{'':{name_col_end}}" + h1)
print(f"{'':{name_col_end}}" + h2)
print(f"{'#':>3}  {'Avg':>4}  {'SepOctNovDec':<{len(BINS)}}  {'Species':<{name_width}}  " + "-" * len(h2))
for i, (avg, window, code, name) in enumerate(top, 1):
    dist = distribution(code)
    print(f"{i:>3}  {avg:>4.1f}  {sparkline(window):<{len(BINS)}}  {name:<{name_width}}  {dist}")
