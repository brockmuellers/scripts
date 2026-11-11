# bigyear — architecture review (2026-10-13)

Scope: `bigyear.py` (1,423 lines, including the uncommitted sparkline/coverage
diff), `sepdec_unseen.py`, README.md, TESTS.md, `.env.example`.

Lens, from your priorities: simple, clean code that's easy to extend, with no
more complexity than it needs. That means no cruft, no unused features, no
pre-emptive scaling, and self-documenting code.

**Evidence used.** Besides reading the code, I checked:
- `~/.bash_history`. All bigyear use since the first commit (Aug 31) is still
  in the 2,000-line window. It doesn't capture runs made by Claude sessions.
- `git log` to see where features churned.
- `~/.config/bigyear/favorites.txt` and `~/.cache/bigyear` (74 MB, 1,285 files).
- eBird API docs (via a research agent) for the API assumptions the code relies on.

Each finding cites its evidence. Items marked **(your call)** remove
behaviour. Everything else keeps behaviour the same, or fixes a bug.

---

## Usage snapshot (from shell history)

| Feature | Uses | Notes |
|---|---|---|
| `rank` | ~45 | `--top`, `--back`, `--min-hits`, `--species` all used. Always a **single region**. |
| `deepdive` (multi-locid too) | ~30 | `--back` always passed. |
| `favs deepdive` | 9 | The main way favorites get used. |
| `leaving` | ~25 | `--weeks-ahead` is used heavily (2/4/8), `--min-now` occasionally. |
| `targets` | ~10 | `--avg 2wk`, `quarter` |
| `cookie` | 4 | Cookie rotates every few days, so this is pulling its weight. |
| `map` | 5 | |
| `favs add` | 6 | All in one setup session. `favs list` used 2×. `favs rm` never. |
| `deepdive --fast` | 2 | |
| `refresh` | 1 | |
| `--no-lifers` (old flag) | ~10 | Then lifers became opt-in. **`--lifers` has never been passed since.** |
| `--life-list` | 2 | Passed a *year* list, i.e. a workaround. |
| `--fresh`, global `--refresh`, `--leaving-region`, `--no-times`, `favs rm` | 0 | `--no-times` is brand new. |
| `rank` with >1 region | 0 intended, 2 accidental | See bug B1. |
| `sepdec_unseen.py` | 0 in history | |

---

## Top points

0. **Fix first: the bar-chart parser drops or shifts ~9% of species (B6).**
   eBird emits a `bu` cell the regex doesn't match. About 600 species rows are
   silently discarded and 390 are shifted by one bin, concentrated in mid-Oct
   to Dec, i.e. now. The fix is a regex change plus treating `bu` as "no data"
   (`None`, skipped in averages, not 0), deleting the 47-bin padding hack,
   and clearing the parsed cache. It affects `targets`,
   `leaving`, every `!`/`*`/`R` marker and the deepdive Bkt column.
1. **Cut lifer highlighting (C1).** You switched it off ~10 times, then
   made it opt-in, and have never opted in. It threads through four commands,
   `_style_species` and `refresh`. It's the single biggest simplification
   (~75 lines).
2. **Sharding in `fetch_recent` is vestigial (C2).** Since the per-species
   fan-out, the region-wide `/recent` call only picks which species to fan
   out on. eBird returns one row per species, so per-district shards add ~28
   throttled calls on `CA-BC` and find nothing new. The `MAX_RESULTS`
   warning can't fire.
3. **"Leaving" has two definitions (A1).** The `leaving` command (3 / 0.5)
   and the `!` marker (2 / 1) use different thresholds and separate loops.
   You use `leaving` heavily, so make it one function with one set of
   constants.
4. **`rank` should take one region (C3).** Multi-region was never used on
   purpose. It's the reason `--species "A" "B"` silently turned species B into
   a region (you hit this twice).
5. **Fold `favs deepdive` into `deepdive` (C4).** It's a hand-copied set of 8
   options plus loop, and has already drifted. Bare `deepdive` should read the
   favorites file.
6. **Remove duplicated plumbing.** Four taxonomy parsers (A2), three HTTP code
   paths (A4), five TTLs where two will do (A6), and two cache-bypass flags
   neither of which you've used (C5).
7. **`_run_deepdive` is 213 lines with 9 params (A7).** Hoist setup out of the
   per-locid loop, extract the tally loop, and let C6 (`--fast` →
   `targets LOCID`) remove the parallel fast branch and the "Tip" nag printed
   on every run.
8. **Self-documenting bar-chart math (A5).** `bucket_at` / `bin_after` /
   `BINS_PER_YEAR` replace 8 opaque `_mean_window(v, b, 1)` calls and 4
   `% 48`s. Also fix "half-month": eBird's 48 bins are weeks, so `--avg 2wk`
   is really one week.
9. **Bugs worth fixing now:** see §3. Most fall out of A1 and A7 for free.
10. **Docs drift.** The README covers 4 of 9 commands and states a taxonomy
    TTL the code doesn't use. Refresh it *after* the cuts.

---

## 1. Cuts (your call: these remove behaviour)

Ranked by lines removed ÷ risk.

### C1. Remove lifer highlighting entirely (~75 lines)
**Evidence.** Lifers were added default-on (e802e02). Three days later you
added `--no-lifers` (288bf47) and passed it ~10 times. Then lifers went opt-in
(f84b646) and `--lifers` has never been passed. The only two `--life-list`
uses pointed at a *year* list.

**Removes.** `--life-list` and `--lifers` on four commands (7 decorator lines
each, plus the parameters threaded through `_run_deepdive`), `_life_names`,
`_lifer_legend`, the `is_lifer` branch in `_style_species`, four call sites,
`BIGYEAR_LIFE_LIST` / `BIGYEAR_LIFE_REGION`, and the life half of `refresh`
(`--life/--no-life`, `--life-region`, the `jobs` tuple list). `refresh` then
becomes "download the year list", about 10 lines.

### C2. Collapse sharding in `fetch_recent` to one call (~25 lines)
**Evidence.** eBird docs for `/data/obs/{region}/recent`: *"Results include
only the most recent observation for each species in the region."* The code
comment at `bigyear.py:591` already says this.

Since f84b646, that call has only one job: decide which target codes to fan
out on. The per-species calls (`:610`) supply the per-hotspot data. Sharding by
subnational2 (`:239-244`) costs N throttled calls on `CA-BC` (~28 districts,
≈28 s cold) and finds no species a single regional call wouldn't. The
`MAX_RESULTS` truncation warning (`:254`) can never fire, because no region has
10,000 species.

**After.** `fetch_recent` becomes one `api_get`, and `MAX_RESULTS` goes. The
"Sharding recent obs across…" printout goes too. `subregion_map` stays only
for the district labels in `rank` (and `sepdec_unseen.py`).

Strictly behaviour-preserving for the ranking, but it's your call because it
changes which hotspot gets credited for species the fan-out doesn't cover
(none, in practice).

### C3. `rank` takes exactly one REGION (~25 lines, fixes a trap)
**Evidence.** You have never run `rank` with two regions on purpose. On two
occasions, `rank CA-BC-GV --species "Baird's Sandpiper" "Semipalmated
Sandpiper" "Stilt Sandpiper"` treated the second and third species as
*regions*, because `regions` is `nargs=-1` (see B1).

**Removes.** The `tuple | str` dance in `_setup`, `per_region`, the
`all_species` union, the "Combined:" header branch, `seen_locs` dedupe, the
`", ".join(regions)` legend label, and the per-region loop body in `rank`. If
you ever need two regions, run it twice, or use a parent region.

### C4. Fold `favs deepdive` into `deepdive` (~45 lines)
**Evidence.** `favs deepdive` is used 9×. Its 8 option decorators (`:1370-1390`)
are a hand copy of `deepdive`'s, and its loop body (`:1399-1408`) is a copy of
`deepdive`'s loop (`:760-770`). They have already drifted:
`--leaving-region` help text differs.

**Proposal.** `deepdive` with no LOCIDs reads the favorites file. A
`--favs` flag is the alternative if you prefer explicit. Keep `favs add`
(handy name lookup) and `favs list`. Drop `favs rm`: never used, and the file
is hand-editable. Drop `BIGYEAR_FAVORITES_FILE`: it's not set in `.env` and not
in `.env.example`.

### C5. Drop `--fresh` and the global `--refresh` (~20 lines, plus a global)
**Evidence.** Neither has ever been passed. 47a5f86 cut the live-data TTL to
1h, which removed most of the need for them. These are two cache-bypass
mechanisms with different scopes. `--refresh` also has to go *before* the
subcommand (`./bigyear.py --refresh rank …`), which is easy to get wrong.
`--refresh` is the only reason `_FORCE_REFRESH` exists as a mutable global. If
you want to keep one, keep `--fresh`, but as a single flag on the group.

The README already documents `rm -rf ~/.cache/bigyear` as the nuclear option.

### C6. Replace `deepdive --fast` with `targets LOCID` (~45 lines)
**Evidence.** Used twice. eBird docs confirm `/product/spplist` accepts a
location code, so `targets L196159 --avg 2wk` *should* give the same "bar-chart
bucket for now, minus seen" list for a hotspot. It also adds the `!`/`R`
markers that `--fast` lacks. Confirm with one run before cutting. One semantic
difference: `targets LOCID` would compute `!` from the *hotspot's* own bar
chart, while deepdive uses the subregion's, which may be noisier for small
hotspots.

The `--fast` branch (`:798-837`) is a 40-line parallel implementation. It also
causes the "Tip: --fast makes this one HTTP call…" message printed on
**every** slow deepdive (`:860-865`).

The one difference: `--fast` uses a 3-bin centred mean and hides zero
buckets, while `targets` uses a forward window. That's arguably an argument for
unifying the windowing (A5) rather than keeping two commands.

### C7. Delete `sepdec_unseen.py`, or own it
It's a one-off for a window that's now half over. It runs at import time,
imports private names (`_seen_list_path`, `_fetch_batch`), and hardcodes BC's
district groupings. Its function `avg_octdec` actually averages Sep–Dec. It
doesn't appear in shell history.

It also pins `subregion_map` and `_fetch_batch` as de-facto public API, which
makes C2 awkward. Git history keeps it if you want it back.

If the "unseen, by district, over a season" view is genuinely useful, the
right home is a `targets --months 9-12` style option, not a sibling script.

### C8. Smaller optional cuts
- `--leaving-region` (deepdive, never used). The subnational2 default is good.
- `--no-times`. Brand new; if the sparkline earns its place, drop the flag
  rather than maintain two table layouts (`:939-951`, `:974-983`).
- `refresh --year-of`. Always the current year in practice.
- `cookie --env-file`. Exists only so TESTS.md can test against a temp file.
  Fine to keep; noted for completeness.

---

## 2. Architecture and consolidation (behaviour-preserving)

### A1. One definition of "leaving"
The `leaving` command (`:1128`) defaults to `min_now=3, min_drop=0.5` and
re-implements the now/ahead/drop loop inline. The `!` marker
(`_leaving_codes`, `:1040`) uses `LEAVING_MIN_NOW=2, LEAVING_MIN_DROP=1`. So a
species `!`-flagged in `rank` can be absent from `leaving`, and vice versa.
You use the command heavily (~25 runs), so this matters.

**Fix.** One function, e.g. `leaving_drops(bc, weeks_ahead) -> {code: (now,
future)}`. The command filters it with its flags, whose defaults *are* the
module constants. The marker filters it with the constants. `targets`' `(now →
future)` suffix (`:718-721`) reuses it too. The `quiet=` flag and the
fetch-if-`bc`-is-None path in `_leaving_codes` disappear, because callers
always fetch the bar chart first. That path is also the source of bug B2.

### A2. One taxonomy loader
The taxonomy is parsed four different ways: `_setup` (`:443-454`),
`_run_deepdive` (`:782-786`), `_resolve_species` (`:402`), and
`sepdec_unseen.py`. Each builds a slightly different subset of `name_to_code` /
`code_to_name` / species-only set.

**Fix.** One `load_taxonomy()` that returns those three. Give it a long TTL
(see A6). It's the biggest file you fetch, and eBird revises it once a year,
in October.

### A3. `_setup`'s untyped dict → a small dataclass
`_setup` returns 8 string keys. `rank` mutates one of them
(`state["targets"] = …`, `:573`). Readers have to scroll to `:469` to learn
the shape. A `@dataclass` (`seen_path, seen_count, seen_mtime, region_species,
targets, unmatched, code_to_name`) is the self-documenting version, and it's
about the same line count. With C3, `regions`/`per_region` go away.
`compute_targets` takes a `list` only to `set()` it; pass the set.

### A4. One HTTP path
Three hand-rolled GETs do throttle, notify, status check and error message
three different ways: `_cached_get` (`:85`), `barchart_get` (`:144-163`) and
`_download_list_csv` (`:1209-1228`). The session-cookie lookup and its error
message also appear twice, worded differently (`:144`, `:1209`).

**Fix.** Add `_http_get(url, *, headers=None, cookies=None, timeout=60) ->
httpx.Response` (throttle + notify + non-200 → `ClickException`) and
`_session_cookie() -> dict`. Then caching is a small wrapper:
`_cached(key, ttl, produce)`. `api_get` and `barchart_get` both become "build
URL → `_cached(url, ttl, lambda: parse(_http_get(...)))`". This also removes
`barchart_get`'s private copy of the freshness and mkdir logic.

### A5. Name the bar-chart math; one window helper
`_mean_window(values, b, 1)` is called 8 times, always with radius 1, which
means "3-bin smoothed bucket at b". `_mean_forward` is the same loop with a
different start. `(now_bin + k) % 48` is written out four times.

**Suggested vocabulary:**
```python
BINS_PER_YEAR = 48              # eBird's 4 "weeks" per month
def bucket_at(bins, b) -> float          # 3-bin smoothed
def bucket_avg(bins, start, count) -> float
def bin_after(b, weeks) -> int
```
With A1 and C6, most call sites read as prose.

**Terminology.** eBird's bins are "weeks" (4 per month, the last one 7-10
days), not half-months. "Half-month" appears at `:43, :128, :170, :677-678,
:736, :863, :1132`. `--avg 2wk` is actually a 1-bin (~1 week) window. Rename it
to `week`, or change it to 2 bins.

### A6. Two TTLs, not five
Today the TTLs are `CACHE_TTL` (12h default), `LISTS_TTL` (1h), `RECENT_TTL`
(1h), `BARCHART_TTL` (30d) and `CHECKLIST_TTL` (30d). The 12h default
currently applies to the taxonomy, spplist, hotspot lists, hotspot info and
region lists, all of which change on a scale of months.

**Proposal.** `LIVE_TTL = 1h` for `/recent` and `/product/lists`, and
`STATIC_TTL = 30d` for everything else. That's one comment explaining the
split, and it fixes the README's claim that the taxonomy is cached longer
(today it isn't).

### A7. Split `_run_deepdive` (213 lines, 9 params)
It does setup, the fast mode, fetching, tallying, legends and two table
layouts. Low-effort split:
- Hoist per-run setup out of the per-locid loop: seen names, taxonomy (and
  life names, if kept). Today every LOCID re-parses the taxonomy JSON, and a
  config error (missing key, missing CSV) is reported once per LOCID as
  "(skipped …)" instead of failing once. See B3.
- `_tally_checklists(checklists, …) -> Tally`. This is the loop at `:881-909`.
- `_print_deepdive(...)`. The legends plus the table.
- `_parse_dt` moves to module level.

C4 and C6 together remove the second call site and the fast branch. After
that, deepdive is about 100 readable lines.

### A8. Highlights: precedence in code, not docstring
`_style_species` takes six booleans. Its precedence rules live in a 13-line
docstring, and every caller hand-builds the booleans. `*` also means two
different things:
- In `rank`, it means "bucket around now ≤ 1" (`_rare_codes`).
- In `deepdive`, it means "Pct / Bkt ≥ 10" (`:960`).

Same glyph, two definitions, two legends.

**Low-effort fix (after C1).** Keep the function, but take a `set[str]` of
flags (`{"leaving", "rare"}`), and express precedence as an ordered tuple
`STYLE_ORDER = (("match", "magenta"), ("leaving", "yellow"), …)`. Give
deepdive's surprise score its own glyph, or drop one of the two "rare"
notions.

**Related.** Legends are printed whether or not their marker appears in
the output, so deepdive prints 4–5 legend lines every run. Printing only the
legends whose marker was actually emitted is a small change. It needs the
flag set above, and it cuts noise.

### A9. File order
The highlight tunables (`:985-996`) are defined *after* the commands that use
them. The leaving/rare/bin/sparkline helpers sit between `deepdive` and
`leaving`. A pure-move commit gives you this order: constants → HTTP/cache →
eBird data (taxonomy, seen list, bar chart, bin math) → analysis (rank,
leaving, rare) → output (style, legends, sparkline) → commands. Do this
**first**, as its own commit, so later diffs are readable. Don't split it into
modules: at ~1,000 lines after the cuts, one file is right.

### A10. Shared option decorators, only where still duplicated after cuts
After C1, C4 and C5, the remaining duplication is `--seen-list` (×4) and
`--back` (×2). One `seen_list_option = click.option(...)` constant gives a
single source for the help text. Don't build a decorator framework.

---

## 3. Bugs and robustness

These come from my read plus an adversarial pass. The pure functions were
exercised with synthetic data; no live API calls were made.

| # | Bug | Where | Fix (or which item fixes it) |
|---|---|---|---|
| B1 | `rank CA-BC-GV --species "A" "B"` treats B as a **region**. This is in history twice. | `:524` `nargs=-1` | C3 |
| B2 | When the bar chart fails in `targets`, `bc or None` makes `_leaving_codes` **fetch it again** (180 s timeout) and warn twice. | `:691` | A1 |
| B3 | Multi-locid deepdive (and `favs deepdive`) catches every `ClickException` per locid. A missing API key or seen list prints "(skipped …)" N times and exits 0. A failed *region* bar chart is refetched for every locid in that region. | `:766-770`, `:796`, `:1404` | A7: hoist setup, fetch the region bar chart once |
| B4 | **Corrupt cache file → permanent traceback.** `write_text` isn't atomic. A Ctrl-C mid-write leaves truncated JSON with a fresh mtime. The next read raises `JSONDecodeError`, which is not a `ClickException`, and this lasts until the TTL expires (30 d for checklists and bar charts). | `:109`, `:195` | Write to `path.with_suffix(".tmp")`, then `.replace(path)`. Two lines; do it in A4's `_cached`. |
| B5 | The `cookie` command writes `./.env` **relative to the cwd**, but `load_dotenv()` finds the `.env` next to the script. Run from elsewhere, the new cookie goes to a file nothing reads. It also rewrites a *commented* `# EBIRD_SESSION=` line if that comes first, leaving the live line stale. | `:1178`, `:1195` (latent: history shows you always run it from the repo dir) | Default to `Path(__file__).parent / ".env"`. Match only uncommented lines. |
| B6 | **The bar-chart parser misses eBird's `bu` cell class. ~9% of species rows are dropped or misaligned.** (Verified offline against the 48 cached bar-chart HTML files.) `_BARCHART_BIN_RE` matches only `sp|b[1-9]`, but eBird also emits `<div class="bu">`, for "insufficient data" (confirmed by the legend on the bar-chart page itself). Of 11,931 cached rows: 10,835 parsed to 48 bins. 390 parsed to 47 and were "fixed" by appending a 0 at the end, which shifts every bin after the `bu` cell left by one. ~600 parsed to 42–46 and **101 to 19, and are silently dropped**: no Bkt, no `!`/`*`/`R`, and they sort last in `targets`. The `bu` cells cluster in **bins 39–46 (mid-Oct → Dec), i.e. right now**. Including `bu` gives exactly 48 bins for all 11,931 rows. | `:122`, `:170-175` | Change the regex to `(sp\|bu\|b[1-9])` and parse `bu` as `None`, **not 0**. The data suggests `bu` means "no or insufficient checklists that week": the 101 19-bin rows all come from one hotspot with `bu` in the same 29 weeks. `sp` means "checklists exist, species not reported". Mapping `bu` → 0 would fire false `*` markers (`pct/max(bkt,0.1)`) and false `!` drops, and drag down `targets` averages. Have A5's `bucket_at`/`bucket_avg` skip `None`. Delete the 47-bin padding. Then clear the cached `#parsed` entries (or `rm -rf ~/.cache/bigyear`), because the bad parses are cached for 30 days. |
| B7 | `targets` header is one column right of its data (`'#'` + 3 spaces vs 2 in rows). | `:708` vs `:723` | Trivial. |
| B8 | Multi-region `rank` fans out on codes from *earlier* regions (wasted throttled calls). It also unions `!`/`*`/`R` across regions, so a GV-rare species is starred on Okanagan hotspots. | `:597-601`, `:623-625` | C3 |
| B9 | The `!` legend prints even when leaving data failed to load. | `:824`, `:917` | A8 (print legends only for markers actually shown) |
| B10 | `refresh` overwrites the seen-list CSV *before* validating its contents. A header-only download (e.g. a bad `--year-of`) leaves you with zero seen species, so everything becomes a target. | `:1242-1244` | Parse first, refuse when there are 0 species, then write. |
| B11 | `--back N` in deepdive: obsDt is date-only and parses to midnight, so the day exactly N days ago is always excluded. | `:841-849` | Compare dates, not datetimes. |
| B12 | `sepdec_unseen.py`: `max()` on an empty `top` raises when every bar chart failed (the cause is hidden by a bare `except Exception`). The header letters drift one column per group. | `:188`, `:158` | C7 |

**Lower confidence.** Subspecies and forms ("Yellow-rumped Warbler
(Audubon's)") in a seen-list or checklist are matched by exact name. A species
seen only as a form stays a target, and form-level checklist rows are dropped
by the `species_codes` filter in deepdive. Worth checking against your actual
CSV.

**Checked and fine:**
- `_current_bin` on days 29–31.
- The `% 48` wrap.
- String-sorting ISO `obsDt` in `rank_hotspots`.
- Negative `--min-drop`.
- The uncommitted sparkline and coverage header alignment.

---

## 4. Smaller cleanups and cruft

- **Defensive checks that can't fire.** `isinstance(info, dict)` at
  `:789, :791, :1342`: eBird returns an object, or HTTP 410 for a bad or
  private locId. `len(counts_24) != 24` in `_times_sparkline`: always 24 by
  construction. `checklist.get("obs", []) or []`.
- **Bar-chart raw HTML on success.** `barchart_get` writes the raw HTML
  (2–6 MB) on success (`:194`), and nothing ever reads it. Keep the write only
  on the failure path (`:178`). Most of the 74 MB cache is this.
- **Magic numbers.** `200` (`/product/lists` max, `:839/:850`), `48`, `24`,
  `5`/`21` (sparkline hours), and the 21-space indent in `rank` rows (`:660`).
  Name the first three; derive the indent from the header widths.
- **Three warning styles.** `_warn()` (red), plain `"WARNING:"` (`:256, :490,
  :852`) and `"Warning:"` (`:508`). Use `_warn` everywhere.
- **stdout vs stderr is inconsistent.** In deepdive, the `Hotspot:` line
  goes to stderr in fast mode (`:818`) but stdout in slow mode (`:913`).
  `rank`'s "No hotspots met…" goes to stdout. History shows you never pipe the
  output. Either pick one rule ("tables → stdout, everything else → stderr")
  or drop `err=True` (52 occurrences) except for the progress line.
- **`MIN_SPP` is a constant while `MIN_HITS`/`TOP_N` are flags.** The "Lower
  MIN_HITS or MIN_SPP" message (`:637`) tells you to edit source for one and
  pass a flag for the other. Either make it a flag or reword the message.
- **The uncommitted diff splits `_times_sparkline` into three functions.**
  `_fold_hours` is worth naming. `_sparkline_cell` is a one-liner used once.
  Inline it, or keep it local.
- **`_resolve_species` docstring** still explains `max_matches=None` as being
  for "`rank --species` fans out one API call per match". That's accurate, but
  only `map` uses the cap now. A bool `cap=True` would read better than an
  int-or-None.
- **`cli` docstring and `map --region CA-BC`** hardcode BC while every other
  command takes a region. That's fine for a BC big year. Just make it one
  `HOME_REGION = "CA-BC"` constant.

---

## 5. Docs

- **README** describes 4 of 9 commands. It's missing `favs`, `refresh`,
  `cookie`, `map` and `--species`. It says "TTL 12 hours (taxonomy
  effectively longer)", which is false (A6). Its "ranking metric" section
  predates the per-species fan-out. It also says "edit the constants" for
  things that are now flags, and carries a stale `MIN_SPP` TODO. After the
  cuts, a 40-line README with one example per command would cover it.
- **TESTS.md.** The deepdive expectation (`Pct N Bkt Species`) predates the
  Last and Times columns. It has no case for `--species` with commas, or for
  `refresh`.
- **`.env.example`** documents `BIGYEAR_LIFE_LIST` / `BIGYEAR_LIFE_REGION`
  (gone if C1) but not `BIGYEAR_FAVORITES_FILE` (gone if C4).

---

## 6. Suggested order

0. **B6**: bar-chart regex fix (`bu` → `None`, with the mean helpers skipping it), then clear the cache. Add one fixture test (below). Do it today; it's affecting current output.
1. **A9**: reorder the file (pure move, one commit).
2. **Cuts you agree with**, one commit each: C1, C3, C2, C4, C5, C6, C7. Each
   one shrinks the surface for everything after it.
3. **A1** (leaving), **A2** (taxonomy), **A5** (bin vocabulary), **A6** (TTLs).
   Small, independent, high clarity.
4. **A4** (HTTP path), **A3** (dataclass), **A7** (deepdive split), **A8**
   (highlights).
5. The section 3 bug fixes that the earlier steps didn't already remove.
6. README / TESTS.md / `.env.example` refresh.

Rough net: 1,423 → ~950 lines with all cuts, ~1,150 with none.

## 7. Deliberately not recommended
- Splitting into a package or modules.
- A config file or config layer.
- A test suite. **One exception is worth it:** a single fixture test for the
  bar-chart parser. Save one cached HTML file and assert that every row parses
  to 48 bins. B6 is exactly the kind of silent breakage it catches, and the
  parser scrapes an undocumented page that will change again. Beyond that,
  revisit only if the bin math grows.
- Async or parallel fetching. Throttling is deliberate.
- Cache eviction. 74 MB is fine once the raw-HTML writes stop.
