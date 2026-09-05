#!/usr/bin/env python3
"""BC Big Year — target hotspot finder.

Ranks eBird hotspots in a region by how many of your remaining target
species have been reported there in the last N days. Edit the tunables
below to change thresholds. See README.md for details.
"""
from __future__ import annotations

import csv
import hashlib
import json
import os
import re
import sys
import time
import webbrowser
from collections import defaultdict
from contextlib import contextmanager
from datetime import datetime, timedelta
from pathlib import Path

import click
import httpx
from dotenv import load_dotenv

# ── tunables ────────────────────────────────────────────────────────────────
BACK_DAYS   = 30
MIN_HITS    = 2                   # skip hotspots with fewer distinct target hits
MIN_SPP     = 40                  # skip hotspots with fewer all-time species
TOP_N       = 20
MAX_RESULTS = 10000               # eBird's cap on /data/obs/*/recent — warn at this
SEEN_STALE  = 30                  # warn if seen-list file is older than this many days
CACHE_TTL   = 12 * 3600           # seconds
BARCHART_TTL = 30 * 86400         # 5-year aggregate — day-to-day changes are noise
CHECKLIST_TTL = 30 * 86400        # submitted checklists are immutable; keep 30d then drop
THROTTLE    = 1.0                 # seconds between uncached calls
CACHE_DIR   = Path.home() / ".cache" / "bigyear"
API_BASE    = "https://api.ebird.org/v2"

# For `targets --avg`: number of half-month bins around now to average.
AVG_BINS = {"2wk": 1, "month": 4, "quarter": 12, "year": 48}

# ── HTTP + cache ────────────────────────────────────────────────────────────

_progress: dict | None = None

def _fetch_notify(url: str) -> None:
    """Emit a fetch line. In a batch, updates a single line as X/N."""
    if _progress is None:
        click.echo(f"[fetch] {url}", err=True)
        return
    _progress["current"] += 1
    line = f"{_progress['current']}/{_progress['total']} [fetch] {url}"
    if sys.stderr.isatty():
        sys.stderr.write(f"\r\033[K{line}")
        sys.stderr.flush()
    else:
        click.echo(line, err=True)

@contextmanager
def _fetch_batch(total: int):
    global _progress
    _progress = {"total": total, "current": 0}
    try:
        yield
    finally:
        _progress = None
        if sys.stderr.isatty():
            sys.stderr.write("\n")
            sys.stderr.flush()

def _cache_path(url: str) -> Path:
    return CACHE_DIR / (hashlib.sha1(url.encode()).hexdigest() + ".json")

_FORCE_REFRESH = False

def _cache_fresh(path: Path, ttl: int = CACHE_TTL) -> bool:
    if _FORCE_REFRESH:
        return False
    return path.exists() and (time.time() - path.stat().st_mtime) < ttl

def _cached_get(url: str, headers: dict | None = None,
                cookies: dict | None = None, ttl: int = CACHE_TTL):
    cached = _cache_path(url)
    if _cache_fresh(cached, ttl=ttl):
        return json.loads(cached.read_text())
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    time.sleep(THROTTLE)
    _fetch_notify(url)
    resp = httpx.get(url, headers=headers or {}, cookies=cookies or {},
                     timeout=60, follow_redirects=True)
    if resp.status_code != 200:
        raise click.ClickException(
            f"HTTP {resp.status_code} on {url}: {resp.text[:200]}"
        )
    try:
        data = resp.json()
    except json.JSONDecodeError:
        dump = CACHE_DIR / (cached.stem + ".body")
        dump.write_text(resp.text)
        raise click.ClickException(
            f"Non-JSON response from {url} "
            f"(content-type {resp.headers.get('content-type', '?')}, "
            f"final URL {resp.url}). Saved body to {dump}."
        )
    cached.write_text(json.dumps(data))
    return data

def api_get(path: str, params: dict | None = None, ttl: int = CACHE_TTL):
    key = os.environ.get("EBIRD_API_KEY")
    if not key:
        raise click.ClickException("EBIRD_API_KEY not set (check your .env file)")
    req = httpx.Request("GET", f"{API_BASE}{path}", params=params or {})
    return _cached_get(str(req.url), headers={"X-eBirdApiToken": key}, ttl=ttl)

_BARCHART_ROW_RE = re.compile(
    r'data-species-code="([a-z0-9]+)".*?</tr>', re.DOTALL,
)
_BARCHART_BIN_RE = re.compile(r'<div class="(sp|b[1-9])"></div>')

def barchart_get(region: str, years_back: int = 5) -> dict[str, list[int]]:
    """Return {speciesCode: [48 bucket ints 0-9]} for region.

    Scrapes ebird.org's undocumented bar-chart HTML page (the one behind
    the site's bar charts). 48 half-month bins per year, 4 per month.
    Bucket 0 = absent, 1-9 = increasing frequency (eBird's own scale;
    exact frequency-% cutoffs aren't published). Not part of the
    documented v2 API — treat as best-effort. Requires EBIRD_SESSION.
    """
    year = datetime.now().year
    req = httpx.Request(
        "GET", "https://ebird.org/barchartData",
        params={"r": region, "bmo": 1, "emo": 12,
                "byr": year - years_back, "eyr": year},
    )
    url = str(req.url)
    parsed_cache = _cache_path(url + "#parsed")
    if _cache_fresh(parsed_cache, ttl=BARCHART_TTL):
        return json.loads(parsed_cache.read_text())

    cookie = os.environ.get("EBIRD_SESSION")
    if not cookie:
        raise click.ClickException(
            "barchartData requires a logged-in session cookie. "
            "Log in at ebird.org, copy the value of the EBIRD_SESSIONID cookie "
            "from your browser devtools, and put EBIRD_SESSION=<value> in .env."
        )
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    time.sleep(THROTTLE)
    _fetch_notify(url)
    # Bar-chart HTML is large (2-6 MB for diverse hotspots) and slow to
    # generate server-side; the 60s default here isn't always enough.
    resp = httpx.get(url, cookies={"EBIRD_SESSIONID": cookie},
                     timeout=180, follow_redirects=True)
    if resp.status_code != 200:
        # eBird's error pages are large HTML — snippeting them is noise.
        raise click.ClickException(
            f"HTTP {resp.status_code} on {url} — eBird failed to produce a "
            f"bar chart (often transient, or this location may not support one)."
        )
    html = resp.text
    result: dict[str, list[int]] = {}
    for m in _BARCHART_ROW_RE.finditer(html):
        code = m.group(1)
        bins = [0 if b == "sp" else int(b[1:])
                for b in _BARCHART_BIN_RE.findall(m.group(0))]
        # eBird sometimes emits 47 bins (dropping the last Dec half-month);
        # pad with 0 to keep 48-bin indexing valid.
        if len(bins) == 47:
            bins.append(0)
        if len(bins) != 48:
            continue  # skip anything with unexpected structure (header row etc)
        result[code] = bins
    if not result:
        _cache_path(url + "#raw").write_text(html)
        looks_like_login = (
            'data-species-code' not in html
            and ('signin' in html.lower() or 'sign in' in html.lower()
                 or 'login' in html.lower())
        )
        if looks_like_login:
            raise click.ClickException(
                "barchartData returned a login page — your EBIRD_SESSION cookie "
                "is likely expired. Log in again at ebird.org, re-copy the "
                "EBIRD_SESSIONID cookie value, and update EBIRD_SESSION in .env."
            )
        raise click.ClickException(
            f"barchartData: parsed 0 species from HTML — page structure may "
            f"have changed. Raw body cached at {_cache_path(url + '#raw')}."
        )
    _cache_path(url + "#raw").write_text(html)
    parsed_cache.write_text(json.dumps(result))
    return result

# ── data loaders ────────────────────────────────────────────────────────────

def load_seen_list(csv_path: Path) -> tuple[set[str], float]:
    """Return (unique common names, file mtime) from an eBird CSV export.

    Works with any eBird CSV that has a species column — Life List download,
    year list, or the full "Download My Data" export. Deduped by common name.
    """
    if not csv_path.exists():
        raise click.ClickException(f"Seen-list CSV not found: {csv_path}")
    names: set[str] = set()
    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        col = next(
            (c for c in ("Common Name", "Species", "common_name")
             if reader.fieldnames and c in reader.fieldnames),
            None,
        )
        if not col:
            raise click.ClickException(
                f"No species column in {csv_path.name}. "
                f"Columns found: {reader.fieldnames}"
            )
        for row in reader:
            name = (row.get(col) or "").strip()
            if name:
                names.add(name)
    return names, csv_path.stat().st_mtime

def subregion_map(region: str) -> dict[str, str]:
    """Return {subnational2 code: name} for region, or {} if none."""
    try:
        data = api_get(f"/ref/region/list/subnational2/{region}")
    except click.ClickException:
        return {}
    return {r["code"]: r.get("name", r["code"]) for r in data if r.get("code")}

def fetch_recent(region: str, back: int) -> list[dict]:
    """Fetch recent obs across region, sharding by subnational2 when possible.
    Warns on any shard that returns MAX_RESULTS rows (probable truncation).
    """
    submap = subregion_map(region)
    shards = list(submap.keys()) or [region]
    if len(shards) > 1:
        click.echo(f"Sharding recent obs across {len(shards)} subregions:", err=True)
        for code in sorted(submap, key=lambda c: submap[c]):
            click.echo(f"  {code}  {submap[code]}", err=True)
    all_obs: list[dict] = []
    with _fetch_batch(len(shards)):
        for r in shards:
            obs = api_get(
                f"/data/obs/{r}/recent",
                {"back": back, "hotspot": "true",
                 "includeProvisional": "false", "maxResults": MAX_RESULTS},
            )
            if len(obs) >= MAX_RESULTS:
                click.echo(
                    f"WARNING: {r} returned {len(obs)} rows (= maxResults) — "
                    f"data likely truncated. Try --back with a smaller value.",
                    err=True,
                )
            all_obs.extend(obs)
    return all_obs

def compute_targets(
    region_species: list[str],
    seen_names: set[str],
    name_to_code: dict[str, str],
) -> tuple[set[str], list[str]]:
    """Return (target species-codes for region, unmatched seen-list names)."""
    seen_codes: set[str] = set()
    unmatched: list[str] = []
    for name in seen_names:
        code = name_to_code.get(name)
        if code:
            seen_codes.add(code)
        else:
            unmatched.append(name)
    return set(region_species) - seen_codes, unmatched

# ── ranking ─────────────────────────────────────────────────────────────────

def rank_hotspots(
    recent_obs: list[dict],
    hotspots: list[dict],
    targets: set[str],
    top_n: int = TOP_N,
    min_hits: int = MIN_HITS,
    require_codes: set[str] | None = None,
) -> list[dict]:
    meta = {h["locId"]: h for h in hotspots}
    by_loc: dict[str, dict[str, tuple[str, str]]] = defaultdict(dict)
    for o in recent_obs:
        code = o.get("speciesCode")
        loc = o.get("locId")
        if not code or not loc or code not in targets:
            continue
        by_loc[loc][code] = (o.get("obsDt", ""), o.get("comName", code))
    rows = []
    for loc, spp in by_loc.items():
        hs = meta.get(loc)
        if not hs:
            continue
        nspp = hs.get("numSpeciesAllTime") or 0
        if nspp < MIN_SPP or len(spp) < min_hits:
            continue
        if require_codes is not None and require_codes.isdisjoint(spp):
            continue
        last_match = ""
        if require_codes is not None:
            last_match = max(
                (spp[c][0] for c in require_codes if c in spp), default="",
            )
        rows.append({
            "locId": loc,
            "name": hs.get("locName", loc),
            "subregion": hs.get("subnational2Code") or hs.get("subnational1Code") or "?",
            "num_spp_all_time": nspp,
            "target_hits": len(spp),
            "last_match": last_match,
            "targets": sorted(spp.items(), key=lambda kv: kv[1][0], reverse=True),
        })
    # last_match is "" without --species, so it degenerates to hits then all-time.
    rows.sort(key=lambda r: (r["last_match"], r["target_hits"],
                             r["num_spp_all_time"]), reverse=True)
    return rows[:top_n]

# ── shared setup ────────────────────────────────────────────────────────────

SPECIES_MAX_MATCHES = 10

def _warn(msg: str) -> str:
    return f"{click.style('WARNING:', fg='red', bold=True)} {msg}"

def _style_species(
    name: str, is_leaving: bool, is_match: bool = False,
    is_rare_hot: bool = False, is_guaranteed: bool = False,
) -> tuple[str, str]:
    """Return (marker, styled_name).

    Marker is always 3 visible characters: !=* (leaving, guaranteed, rare-hot),
    each shown or blank independently — so overlaps stay visible.
    Name color precedence:
      match (magenta) > leaving (yellow) > guaranteed (green) > rare-hot (cyan).
    """
    marker = (
        (click.style("!", fg="yellow", bold=True) if is_leaving else " ")
        + (click.style("=", fg="green", bold=True) if is_guaranteed else " ")
        + (click.style("*", fg="cyan", bold=True) if is_rare_hot else " ")
    )
    if is_match:
        return marker, click.style(name, fg="magenta", bold=True)
    if is_leaving:
        return marker, click.style(name, fg="yellow", bold=True)
    if is_guaranteed:
        return marker, click.style(name, fg="green", bold=True)
    if is_rare_hot:
        return marker, click.style(name, fg="cyan", bold=True)
    return marker, name

def _resolve_species(
    query: str, scope_codes: set[str] | None = None,
) -> list[tuple[str, str]]:
    """Return [(speciesCode, comName), ...] for a common-name substring query.

    Exact match short-circuits to a single result. Otherwise all substring
    matches are returned (printed to stderr so the caller sees them), unless
    there are more than SPECIES_MAX_MATCHES — then the caller must narrow.
    When scope_codes is given, only species whose code is in it are considered.
    """
    q = query.strip().lower()
    taxonomy = api_get("/ref/taxonomy/ebird", {"fmt": "json"})
    matches = [
        (t["speciesCode"], t["comName"])
        for t in taxonomy
        if t.get("category") == "species"
        and "speciesCode" in t and "comName" in t
        and q in t["comName"].lower()
        and (scope_codes is None or t["speciesCode"] in scope_codes)
    ]
    if not matches:
        raise click.ClickException(f"No species matched {query!r}.")
    exact = [m for m in matches if m[1].lower() == q]
    if exact:
        return [exact[0]]
    if len(matches) == 1:
        return matches
    click.echo(f"Matched {len(matches)} species for {query!r}:", err=True)
    for _, n in matches[:SPECIES_MAX_MATCHES]:
        click.echo(f"  {n}", err=True)
    if len(matches) > SPECIES_MAX_MATCHES:
        raise click.ClickException(
            f"Too many matches ({len(matches)} > {SPECIES_MAX_MATCHES}); "
            f"narrow the name."
        )
    return matches

def _seen_list_path(cli_arg: str | None) -> Path:
    p = cli_arg or os.environ.get("BIGYEAR_SEEN_LIST")
    if not p:
        raise click.ClickException(
            "Seen-list CSV path required — pass --seen-list PATH "
            "or set BIGYEAR_SEEN_LIST in your .env"
        )
    return Path(p).expanduser()

def _setup(regions: tuple[str, ...] | str, seen_list_arg: str | None) -> dict:
    if isinstance(regions, str):
        regions = (regions,)
    seen_path = _seen_list_path(seen_list_arg)
    seen_names, seen_mtime = load_seen_list(seen_path)
    taxonomy = api_get("/ref/taxonomy/ebird", {"fmt": "json"})
    name_to_code: dict[str, str] = {}
    code_to_name: dict[str, str] = {}
    species_only: set[str] = set()
    for t in taxonomy:
        code, name = t.get("speciesCode"), t.get("comName")
        if not code or not name:
            continue
        name_to_code[name] = code
        code_to_name[code] = name
        if t.get("category") == "species":
            species_only.add(code)
    per_region: list[tuple[str, list[str]]] = []
    all_species: set[str] = set()
    for r in regions:
        spp = api_get(f"/product/spplist/{r}")
        if not spp:
            raise click.ClickException(
                f"Region {r!r} returned 0 species — likely an invalid code."
            )
        spp = [c for c in spp if c in species_only]
        per_region.append((r, spp))
        all_species.update(spp)
    targets, unmatched = compute_targets(
        list(all_species), seen_names, name_to_code,
    )
    return {
        "seen_path": seen_path,
        "seen_count": len(seen_names),
        "seen_mtime": seen_mtime,
        "regions": per_region,
        "region_species": list(all_species),
        "targets": targets,
        "unmatched": unmatched,
        "code_to_name": code_to_name,
    }

def _print_header(state: dict) -> None:
    dt = datetime.fromtimestamp(state["seen_mtime"]).date()
    age = (datetime.now().date() - dt).days
    click.echo(
        f"Seen list: {state['seen_count']} species, from {state['seen_path'].name} "
        f"(mtime {dt.isoformat()}, {age} days old)",
        err=True,
    )
    if age > SEEN_STALE:
        click.echo(
            f"WARNING: seen list is {age} days old (> {SEEN_STALE}) — "
            f"re-export from eBird to avoid stale targets.",
            err=True,
        )
    for r, spp in state["regions"]:
        click.echo(f"Region {r}: {len(spp)} species all-time.", err=True)
    if len(state["regions"]) > 1:
        click.echo(
            f"Combined: {len(state['region_species'])} unique species, "
            f"{len(state['targets'])} still on your target list.",
            err=True,
        )
    else:
        click.echo(
            f"{len(state['targets'])} still on your target list.", err=True,
        )
    if state["unmatched"]:
        click.echo(
            f"Warning: {len(state['unmatched'])} seen-list name(s) did not match "
            f"taxonomy (first: {state['unmatched'][0]!r})",
            err=True,
        )

# ── CLI ─────────────────────────────────────────────────────────────────────

@click.group()
@click.option("--refresh", is_flag=True, help="Bypass cache and refetch from eBird.")
def cli(refresh: bool) -> None:
    """BC Big Year — target hotspot finder."""
    load_dotenv()
    global _FORCE_REFRESH
    _FORCE_REFRESH = refresh

@cli.command()
@click.argument("regions", nargs=-1, required=True)
@click.option("--seen-list", "seen_list_arg", default=None,
              help="Path to eBird CSV of species you've already seen "
                   "(or set BIGYEAR_SEEN_LIST).")
@click.option("--back", default=BACK_DAYS, show_default=True,
              help="Look back this many days for recent observations.")
@click.option("--top", "top_n", default=TOP_N, show_default=True,
              help="Show at most this many hotspots.")
@click.option("--min-hits", default=MIN_HITS, show_default=True,
              help="Skip hotspots with fewer distinct target hits than this. "
                   "Ignored when --species is set (forced to 1).")
@click.option("--species", "species_queries", multiple=True,
              help="Filter to hotspots that have this species in recent obs "
                   "(common-name substring). Repeat the flag, or pass "
                   "comma-separated names, to include multiple species. "
                   "Overrides MIN_HITS to 1.")
def rank(regions: tuple[str, ...], seen_list_arg: str | None,
         back: int, top_n: int, min_hits: int,
         species_queries: tuple[str, ...]) -> None:
    """Rank hotspots in REGIONS by target-species presence."""
    state = _setup(regions, seen_list_arg)
    _print_header(state)
    require_codes: set[str] | None = None
    if species_queries:
        # Also split any comma-separated values within a single --species.
        queries = [q.strip() for group in species_queries
                   for q in group.split(",") if q.strip()]
        require_codes = set()
        resolved_names: list[str] = []
        scope = set(state["region_species"])
        for q in queries:
            for code, name in _resolve_species(q, scope_codes=scope):
                require_codes.add(code)
                resolved_names.append(name)
        state["targets"] = set(state["targets"]) | require_codes
        click.echo(
            f"Filtering to hotspots with any of: {', '.join(resolved_names)} "
            f"(seen in the last {back} days).", err=True,
        )
    hotspots: list[dict] = []
    recent: list[dict] = []
    subregions: dict[str, str] = {}
    leaving: set[str] = set()
    seen_locs: set[str] = set()
    for r in regions:
        for h in api_get(f"/ref/hotspot/{r}", {"fmt": "json"}):
            if h.get("locId") not in seen_locs:
                seen_locs.add(h["locId"])
                hotspots.append(h)
        recent.extend(fetch_recent(r, back))
        if require_codes:
            # /data/obs/{r}/recent dedupes to one row per species region-wide,
            # so a species-filter needs the per-species endpoint to see every
            # hotspot that had it recently.
            with _fetch_batch(len(require_codes)):
                for code in require_codes:
                    recent.extend(api_get(
                        f"/data/obs/{r}/recent/{code}",
                        {"back": back, "hotspot": "true",
                         "includeProvisional": "false"},
                    ))
        subregions.update(subregion_map(r))
        leaving |= _leaving_codes(r)
    rows = rank_hotspots(
        recent, hotspots, state["targets"], top_n,
        min_hits=1 if require_codes else min_hits,
        require_codes=require_codes,
    )
    if not rows:
        click.echo("No hotspots met the thresholds. Lower MIN_HITS or MIN_SPP.")
        return
    click.echo("")
    click.echo(f"{'Hits':>4}  {'AllSp':>5}  {'LocId':<10}  Hotspot")
    click.echo("-" * 84)
    show_district = len({r["subregion"] for r in rows}) > 1
    for r in rows:
        prefix = ""
        if show_district:
            district = subregions.get(r["subregion"], r["subregion"])
            prefix = f"{district} [{r['subregion']}] - "
        click.echo(
            f"{r['target_hits']:>4}  {r['num_spp_all_time']:>5}  "
            f"{r['locId']:<10}  {prefix}{r['name']}"
        )
        for code, (obsdt, comname) in r["targets"]:
            marker, name = _style_species(
                comname, code in leaving,
                is_match=require_codes is not None and code in require_codes,
            )
            click.echo(f"                     {marker} - {name}  ({obsdt})")

@cli.command()
@click.argument("region")
@click.option("--seen-list", "seen_list_arg", default=None,
              help="Path to eBird CSV of species you've already seen "
                   "(or set BIGYEAR_SEEN_LIST).")
@click.option("--avg", "avg_window", type=click.Choice(list(AVG_BINS)),
              default="year", show_default=True,
              help="Window for the Avg column, starting at now and going "
                   "forward: 2wk = current half-month, month = next ~4 wks, "
                   "quarter = next ~3 mo, year = all 48 half-months.")
def targets(region: str, seen_list_arg: str | None, avg_window: str) -> None:
    """Print your remaining target species for REGION, ranked by frequency."""
    state = _setup(region, seen_list_arg)
    _print_header(state)
    try:
        bc = barchart_get(region)
    except click.ClickException as e:
        click.echo(_warn(f"ranking alphabetically: {e.message}"), err=True)
        bc = {}
    leaving = _leaving_codes(region, bc=bc or None)
    now_bin = _current_bin()
    count = AVG_BINS[avg_window]
    scores = {code: _mean_forward(bins, now_bin, count)
              for code, bins in bc.items() if bins}
    ranked = sorted(
        state["targets"],
        key=lambda c: (-scores.get(c, 0.0), state["code_to_name"].get(c, c)),
    )
    ahead_bin = (now_bin + LEAVING_WEEKS_AHEAD) % 48
    click.echo("")
    width = len(str(len(ranked)))
    click.echo(f"{'#':>{width}}   Avg  Code       Species")
    click.echo(f"{'-' * width}   ---  ---------    -----------------")
    for i, code in enumerate(ranked, 1):
        marker, name = _style_species(
            state["code_to_name"].get(code, "?"), code in leaving,
        )
        suffix = ""
        if code in leaving and code in bc:
            now_b = _mean_window(bc[code], now_bin, 1)
            future_b = _mean_window(bc[code], ahead_bin, 1)
            suffix = f"  ({now_b:.1f} → {future_b:.1f})"
        click.echo(
            f"{i:>{width}}  {scores.get(code, 0.0):>3.1f}  {code:<9} "
            f"{marker} {name}{suffix}"
        )

@cli.command()
@click.argument("locids", nargs=-1, required=True)
@click.option("--seen-list", "seen_list_arg", default=None,
              help="Path to eBird CSV of species you've already seen "
                   "(or set BIGYEAR_SEEN_LIST).")
@click.option("--back", default=BACK_DAYS, show_default=True,
              help="Only consider checklists from the last this many days.")
@click.option("--fast", is_flag=True,
              help="Skip per-checklist walking. One HTTP call: use the hotspot's "
                   "5-year bar-chart buckets for the current half-month instead. "
                   "No 'Pct/N' — just the 0-9 bucket score.")
def deepdive(locids: tuple[str, ...], seen_list_arg: str | None,
             back: int, fast: bool) -> None:
    """Per-species checklist frequency at one or more hotspot LOCIDs."""
    for i, locid in enumerate(locids, 1):
        if len(locids) > 1:
            click.echo("", err=True)
            click.echo("=" * 70, err=True)
            click.echo(f"[{i}/{len(locids)}] {locid}", err=True)
            click.echo("=" * 70, err=True)
        try:
            _run_deepdive(locid, seen_list_arg, back, fast)
        except click.ClickException as e:
            click.echo(f"(skipped {locid}: {e.message})", err=True)

def _run_deepdive(locid: str, seen_list_arg: str | None,
                  back: int, fast: bool) -> None:
    seen_path = _seen_list_path(seen_list_arg)
    seen_names, _ = load_seen_list(seen_path)
    taxonomy = api_get("/ref/taxonomy/ebird", {"fmt": "json"})
    code_to_name = {t["speciesCode"]: t["comName"]
                    for t in taxonomy if "speciesCode" in t and "comName" in t}
    species_codes = {t["speciesCode"] for t in taxonomy
                     if t.get("category") == "species" and "speciesCode" in t}

    info = api_get(f"/ref/hotspot/info/{locid}")
    hotspot_name = info.get("name", locid) if isinstance(info, dict) else locid
    region = (isinstance(info, dict) and
              (info.get("subnational1Code") or info.get("countryCode"))) or ""
    leaving = _leaving_codes(region, quiet=True) if region else set()

    if fast:
        try:
            bc = barchart_get(locid)
        except click.ClickException as e:
            raise click.ClickException(
                f"--fast needs the barchart endpoint: {e.message}"
            )
        now_bin = _current_bin()
        rows_fast = []
        for code, bins in bc.items():
            if code not in species_codes:
                continue
            name = code_to_name.get(code, code)
            if name in seen_names:
                continue
            bkt = _mean_window(bins, now_bin, 1)
            if bkt <= 0:
                continue
            rows_fast.append((code, name, bkt))
        rows_fast.sort(key=lambda r: (-r[2], r[1]))
        click.echo(f"Hotspot: {hotspot_name} [{locid}]", err=True)
        click.echo(
            f"Bar-chart buckets around {_bin_label(now_bin)} "
            f"(5-year aggregate, 0-9 scale; 1=rare, 9=abundant).",
            err=True,
        )
        if region:
            click.echo(_leaving_legend(region), err=True)
        click.echo("")
        click.echo("  Bkt    Species")
        click.echo("  ---    -----------------")
        for code, name, bkt in rows_fast:
            marker, name = _style_species(name, code in leaving)
            click.echo(f"  {bkt:>3.1f} {marker} {name}")
        return

    lists = api_get(f"/product/lists/{locid}", {"maxResults": 200})
    cutoff = datetime.now() - timedelta(days=back)
    def _parse_dt(s: str) -> datetime:
        for fmt in ("%d %b %Y", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
            try:
                return datetime.strptime(s, fmt)
            except ValueError:
                continue
        raise click.ClickException(f"unrecognized obsDt format: {s!r}")
    in_window = [c for c in lists if _parse_dt(c["obsDt"]) >= cutoff]
    if len(lists) >= 200 and len(in_window) == len(lists):
        click.echo(
            f"WARNING: got 200 checklists (= maxResults) and all fall within "
            f"--back {back} — window likely truncated. Use a smaller --back.",
            err=True,
        )
    if not in_window:
        click.echo(f"No checklists at {locid} in last {back} days.")
        return

    click.echo(
        "Tip: --fast makes this one HTTP call instead of ~one per checklist. "
        "Tradeoff: you get eBird's 0-9 bucket score (5-year historical for this "
        "half-month) instead of actual-recent-window %/N.",
        err=True,
    )
    try:
        hotspot_bc = barchart_get(locid)
    except click.ClickException as e:
        click.echo(_warn(f"skipping Bkt column: {e.message}"), err=True)
        hotspot_bc = {}
    now_bin = _current_bin()
    click.echo(
        f"Fetching {len(in_window)} checklists (~{len(in_window)}s if uncached).",
        err=True,
    )

    hits: dict[str, int] = defaultdict(int)
    last_seen: dict[str, str] = {}
    with _fetch_batch(len(in_window)):
        for c in in_window:
            checklist = api_get(
                f"/product/checklist/view/{c['subId']}", ttl=CHECKLIST_TTL,
            )
            seen_in_this = set()
            for o in checklist.get("obs", []) or []:
                code = o.get("speciesCode")
                if not code or code not in species_codes or code in seen_in_this:
                    continue
                seen_in_this.add(code)
                name = code_to_name.get(code, code)
                if name in seen_names:
                    continue
                hits[code] += 1
                if c["obsDt"] > last_seen.get(code, ""):
                    last_seen[code] = c["obsDt"]

    total = len(in_window)
    click.echo("")
    click.echo(f"Hotspot: {hotspot_name} [{locid}]")
    click.echo(f"Checklists in last {back} days: {total}")
    if region:
        click.echo(_leaving_legend(region), err=True)
    eq = click.style("=", fg="green", bold=True)
    click.echo(
        f"{eq} = virtual guarantee: Pct >= {GUARANTEED_PCT}%.",
        err=True,
    )
    star = click.style("*", fg="cyan", bold=True)
    click.echo(
        f"{star} = rare-but-hot: Pct / max(Bkt, 0.1) >= {RARE_HOT_SCORE} "
        f"(higher = more surprising; historically rare or unrecorded here "
        f"but reported recently).",
        err=True,
    )
    click.echo("")
    click.echo("  Pct   N  Bkt  Last      Species")
    click.echo("  ----  --  ---  ------    -----------------")
    rows = sorted(
        hits.items(),
        key=lambda kv: (-kv[1], code_to_name.get(kv[0], kv[0])),
    )
    for code, n in rows:
        pct = round(100 * n / total)
        bkt = _mean_window(hotspot_bc[code], now_bin, 1) if code in hotspot_bc else None
        bkt_s = f"{bkt:>3.1f}" if bkt is not None else "  -"
        is_rare_hot = bkt is not None and pct / max(bkt, 0.1) >= RARE_HOT_SCORE
        marker, name = _style_species(
            code_to_name.get(code, code), code in leaving,
            is_rare_hot=is_rare_hot,
            is_guaranteed=pct >= GUARANTEED_PCT,
        )
        last = _parse_dt(last_seen[code]).strftime("%d %b") if code in last_seen else "      "
        click.echo(f"  {pct:>3}%  {n:>2}  {bkt_s}  {last:>6}  {marker} {name}")

LEAVING_WEEKS_AHEAD = 4
LEAVING_MIN_NOW = 3       # current bucket must be at least this
LEAVING_MIN_DROP = 2      # bucket drop must be at least this
GUARANTEED_PCT = 80       # deepdive: species seen in >= this % of checklists.
RARE_HOT_SCORE = 10       # surprise score = pct / max(bkt, 0.1); >= this fires.
                          # Trips on e.g. 25%/bkt=2, 20%/bkt=1, 80%/bkt=4,
                          # and any sighting of a never-recorded species (bkt=0).

def _leaving_legend(region: str) -> str:
    now_bin = _current_bin()
    ahead_bin = (now_bin + LEAVING_WEEKS_AHEAD) % 48
    marker = click.style("!", fg="yellow", bold=True)
    return (
        f"{marker} = 'leaving soon' in {region}: bucket >= {LEAVING_MIN_NOW} "
        f"in {_bin_label(now_bin)}, dropping >= {LEAVING_MIN_DROP} bucket(s) "
        f"by {_bin_label(ahead_bin)} ({LEAVING_WEEKS_AHEAD} weeks out). "
        f"Bar chart: {datetime.now().year - 5}-{datetime.now().year}."
    )

def _leaving_codes(
    region: str, bc: dict[str, list[int]] | None = None, quiet: bool = False,
) -> set[str]:
    """Species codes currently 'here now, gone soon' in REGION.

    Silent-empty if EBIRD_SESSION isn't set or the barchart fetch fails, so
    `rank` still works without the cookie — just without the highlight.
    Pass `bc` to reuse an already-fetched barchart. Pass `quiet=True` to
    suppress the legend (the caller wants to print it elsewhere).
    """
    if bc is None:
        try:
            bc = barchart_get(region)
        except click.ClickException as e:
            click.echo(_warn(f"skipping 'leaving' highlight: {e.message}"), err=True)
            return set()
    now_bin = _current_bin()
    ahead_bin = (now_bin + LEAVING_WEEKS_AHEAD) % 48  # ~1 bin per week
    out: set[str] = set()
    for code, values in bc.items():
        now_b = _mean_window(values, now_bin, 1)
        future_b = _mean_window(values, ahead_bin, 1)
        if now_b >= LEAVING_MIN_NOW and (now_b - future_b) >= LEAVING_MIN_DROP:
            out.add(code)
    if not quiet:
        click.echo(_leaving_legend(region), err=True)
    return out

def _current_bin() -> int:
    """eBird bar-chart bin index for today. 48 bins/year, 4 per month."""
    now = datetime.now()
    week = min((now.day - 1) // 7, 3)
    return (now.month - 1) * 4 + week

def _bin_label(b: int) -> str:
    month = b // 4 + 1
    week_starts = (1, 8, 15, 22)
    return f"{datetime(2000, month, 1).strftime('%b')} {week_starts[b % 4]}+"

def _mean_window(values: list[float], center: int, radius: int) -> float:
    """Mean of values around center, wrapping around the 48-bin year."""
    n = len(values)
    if not n:
        return 0.0
    picks = [values[(center + i) % n] for i in range(-radius, radius + 1)]
    return sum(picks) / len(picks)

def _mean_forward(values: list[float], start: int, count: int) -> float:
    """Mean of `count` bins starting at `start`, wrapping the 48-bin year."""
    n = len(values)
    if not n or count <= 0:
        return 0.0
    picks = [values[(start + i) % n] for i in range(count)]
    return sum(picks) / len(picks)

@cli.command()
@click.argument("region")
@click.option("--seen-list", "seen_list_arg", default=None,
              help="Path to eBird CSV of species you've already seen "
                   "(or set BIGYEAR_SEEN_LIST).")
@click.option("--weeks-ahead", default=4, show_default=True,
              help="Compare current frequency to this many weeks from now.")
@click.option("--min-now", default=3, show_default=True,
              help="Only flag species currently at eBird bucket >= this "
                   "(1=rare, 9=abundant).")
@click.option("--min-drop", default=0.0, show_default=True,
              help="Only show species whose bucket drop is at least this. "
                   "Use a negative value to include steady/rising species.")
def leaving(region: str, seen_list_arg: str | None,
            weeks_ahead: int, min_now: int, min_drop: float) -> None:
    """Rank targets in REGION by 'here now, gone soon' bucket drop.

    Compares the current half-month to WEEKS-AHEAD from now using eBird's
    0-9 bar-chart buckets (their site's own scale). A row like 'b7 → b1'
    means the species is common now but nearly absent by then.
    """
    state = _setup(region, seen_list_arg)
    _print_header(state)
    bc = barchart_get(region)
    now_bin = _current_bin()
    ahead_bin = (now_bin + weeks_ahead) % 48  # ~1 bin per week (4 per month)
    click.echo(
        f"Comparing {_bin_label(now_bin)} to {_bin_label(ahead_bin)} "
        f"(bins {now_bin} → {ahead_bin}).",
        err=True,
    )
    rows = []
    for code, values in bc.items():
        if code not in state["targets"]:
            continue
        now_b = _mean_window(values, now_bin, 1)
        future_b = _mean_window(values, ahead_bin, 1)
        if now_b < min_now:
            continue
        if (now_b - future_b) < min_drop:
            continue
        rows.append({
            "code": code,
            "name": state["code_to_name"].get(code, code),
            "now": now_b,
            "future": future_b,
            "drop": now_b - future_b,
        })
    rows.sort(key=lambda r: -r["drop"])
    if not rows:
        click.echo(f"No targets at bucket >= {min_now} in the current window.")
        return
    click.echo("")
    click.echo("  Now  In    Drop  Species")
    click.echo("  ---  ---   ----  -----------------")
    for r in rows:
        click.echo(
            f"  {r['now']:>3.1f}  {r['future']:>3.1f}  "
            f"{r['drop']:>+4.1f}  {r['name']}"
        )

@cli.command()
@click.argument("value")
@click.option("--env-file", default=".env", show_default=True,
              help="Path to the .env file to update.")
def cookie(value: str, env_file: str) -> None:
    """Update EBIRD_SESSION in .env with a new cookie VALUE.

    Log in at ebird.org, open devtools → Application → Cookies → ebird.org,
    copy the value of EBIRD_SESSIONID, then run:
    ./bigyear.py cookie <paste-value-here>
    """
    path = Path(env_file).expanduser()
    value = value.strip()
    if not value:
        raise click.ClickException("Empty value; aborting.")
    lines = path.read_text().splitlines() if path.exists() else []
    new_line = f"EBIRD_SESSION={value}"
    replaced = False
    for i, line in enumerate(lines):
        stripped = line.lstrip("# ").strip()
        if stripped.startswith("EBIRD_SESSION="):
            lines[i] = new_line
            replaced = True
            break
    if not replaced:
        lines.append(new_line)
    path.write_text("\n".join(lines) + "\n")
    action = "Updated" if replaced else "Added"
    click.echo(f"{action} EBIRD_SESSION in {path}.")

def _favorites_path() -> Path:
    p = os.environ.get("BIGYEAR_FAVORITES_FILE")
    return Path(p).expanduser() if p else Path.home() / ".config" / "bigyear" / "favorites.txt"

def _load_favorites() -> list[tuple[str, str]]:
    path = _favorites_path()
    if not path.exists():
        return []
    out: list[tuple[str, str]] = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split(None, 1)
        out.append((parts[0], parts[1] if len(parts) > 1 else ""))
    return out

def _save_favorites(favs: list[tuple[str, str]]) -> None:
    path = _favorites_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    body = "\n".join(f"{loc}\t{note}".rstrip() for loc, note in favs)
    path.write_text(body + "\n" if body else "")

@cli.group()
def favs() -> None:
    """Manage favorite hotspots (stored one per line in a text file)."""

@favs.command("add")
@click.argument("locid")
def favs_add(locid: str) -> None:
    """Add LOCID to favorites (looks up its name from eBird)."""
    existing = _load_favorites()
    if any(loc == locid for loc, _ in existing):
        click.echo(f"{locid} already in favorites.", err=True)
        return
    try:
        info = api_get(f"/ref/hotspot/info/{locid}")
        name = info.get("name", "") if isinstance(info, dict) else ""
    except click.ClickException:
        name = ""
    existing.append((locid, name))
    _save_favorites(existing)
    click.echo(f"Added {locid} ({name or 'no name'}) to {_favorites_path()}.")

@favs.command("rm")
@click.argument("locid")
def favs_rm(locid: str) -> None:
    """Remove LOCID from favorites."""
    existing = _load_favorites()
    new = [(loc, note) for loc, note in existing if loc != locid]
    if len(new) == len(existing):
        raise click.ClickException(f"{locid} not in favorites.")
    _save_favorites(new)
    click.echo(f"Removed {locid}.")

@favs.command("list")
def favs_list() -> None:
    """List favorite hotspots."""
    existing = _load_favorites()
    if not existing:
        click.echo(f"No favorites in {_favorites_path()}.")
        return
    for loc, note in existing:
        click.echo(f"  {loc:<10}  {note}")

@favs.command("deepdive")
@click.option("--seen-list", "seen_list_arg", default=None,
              help="Path to eBird CSV of species you've already seen "
                   "(or set BIGYEAR_SEEN_LIST).")
@click.option("--back", default=BACK_DAYS, show_default=True,
              help="Only consider checklists from the last this many days.")
@click.option("--fast", is_flag=True,
              help="Use --fast deepdive mode (bar-chart buckets, one HTTP call).")
def favs_deepdive(seen_list_arg: str | None,
                  back: int, fast: bool) -> None:
    """Run deepdive on every favorite hotspot."""
    existing = _load_favorites()
    if not existing:
        raise click.ClickException(f"No favorites in {_favorites_path()}.")
    for i, (loc, note) in enumerate(existing, 1):
        click.echo("", err=True)
        click.echo("=" * 70, err=True)
        click.echo(f"[{i}/{len(existing)}] {loc}  {note}", err=True)
        click.echo("=" * 70, err=True)
        try:
            _run_deepdive(loc, seen_list_arg, back, fast)
        except click.ClickException as e:
            click.echo(f"(skipped {loc}: {e.message})", err=True)

@cli.command(name="map")
@click.argument("name", nargs=-1, required=True)
@click.option("--region", default="CA-BC", show_default=True,
              help="eBird region code to scope the map to.")
def map_cmd(name: tuple[str, ...], region: str) -> None:
    """Open eBird's sightings map for a species. NAME is a common-name substring."""
    region_spp = set(api_get(f"/product/spplist/{region}"))
    for code, comname in _resolve_species(" ".join(name), scope_codes=region_spp):
        url = f"https://ebird.org/map/{code}?r={region}&yr=cur"
        click.echo(f"Opening: {comname} → {url}", err=True)
        webbrowser.open(url)

if __name__ == "__main__":
    cli()
