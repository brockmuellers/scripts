# bigyear

A tiny CLI that ranks eBird hotspots in a region by how many of your remaining
target species have been reported there in the last N days. Built for a
casual 2026 BC big year, but works for any eBird region code.

## Setup

```
pip install --user click httpx python-dotenv
cp .env.example .env
# then edit .env and paste your eBird API key
```

Get an API key at https://ebird.org/api/keygen.

Export a CSV of species you've already seen from eBird — any of the Life List
download (My eBird → Life List → Download), a year-list download, or the full
"Download My Data" export (Account → Download My Data). All work; the tool
dedupes on the common-name column.

## Use

```
./bigyear.py rank CA-BC-GV --seen-list ~/Downloads/MyEBirdData.csv
./bigyear.py targets CA-BC-GV --seen-list ~/Downloads/MyEBirdData.csv
./bigyear.py deepdive L164544 --seen-list ~/Downloads/MyEBirdData.csv
./bigyear.py leaving CA-BC-GV --seen-list ~/Downloads/MyEBirdData.csv
```

`leaving` flags target species whose region-wide checklist frequency drops
sharply between now and a few weeks out — the "get it before it migrates
out" list. It pulls a single request from eBird's undocumented
`ebird.org/barchartData` endpoint (used by the website's bar charts). That
call is not part of the documented v2 API; treat it as best-effort and don't
hammer it.

`rank` prints a `LocId` column so you can copy one straight into `deepdive`.
`deepdive` fetches every recent checklist at that hotspot and reports the
fraction that contained each species you haven't yet seen — a real frequency
signal (unlike `rank`'s presence-only metric). It's the one expensive command:
one API call per checklist in the window (throttled 1s each), so a busy
hotspot at `--back 30` can take a minute or two on a cold cache. Re-runs are
free from cache.

If you set `BIGYEAR_SEEN_LIST` in your `.env` you can drop the `--seen-list`
flag.

(Or, if you don't want to install packages globally, use a venv:
`python3 -m venv .venv && source .venv/bin/activate && pip install click httpx python-dotenv`.)

Every run prints the seen-list's row count and file mtime in the header so you
know how stale it is — refresh the CSV export when you've added birds.

## The ranking metric (read this)

The tool uses **presence in the last N days**, not "% of checklists". eBird's
`/data/obs/{region}/recent` endpoint returns one row per (species, location):
the single most recent observation. So the tool can tell you "target species X
was seen at hotspot H in the last 30 days" — not "X shows up on 70% of
checklists at H." That richer signal isn't available from the documented API
cheaply; if the presence-based ranking turns out to be too noisy in practice
we'll revisit.

Ranking:

- for each hotspot, count the number of distinct target species reported in
  the last `BACK_DAYS` days;
- drop hotspots with fewer than `MIN_HITS` target species, or fewer than
  `MIN_SPP` species reported all-time (a rough "under-birded" filter — TODO:
  improve);
- sort desc by hits, tiebreak by all-time species count, cut to `TOP_N`.

Edit the constants at the top of `bigyear.py` to tune.

## Cache

All eBird API responses are cached to `~/.cache/bigyear/` as JSON files, TTL
12 hours (taxonomy effectively longer since it rarely changes). Nuke it with:

```
rm -rf ~/.cache/bigyear/
```

There's a 1-second sleep before every uncached call to stay well below eBird's
rate limits.
