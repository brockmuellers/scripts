# Manual test cases

Run only when Sara asks. All commands exit 0 unless noted. Assertions
check structure, not specific values, so they survive data changes.

Requires `.env` with `EBIRD_API_KEY`, `EBIRD_SESSION`, `BIGYEAR_SEEN_LIST`.

## rank

    ./bigyear.py rank CA-BC-GV --top 3

Expect: header lines including `Seen list:` and `still on your target list`,
then a `Hits  AllSp  LocId  Hotspot` table with at least one row.

## rank --species (species filter)

    ./bigyear.py rank CA-BC-GV --species 'spotted sandpiper' --top 5

Expect: a `Filtering to hotspots with any of: Spotted Sandpiper` line, and
Spotted Sandpiper appears in at least one row's target list. Rows sorted by
recency of that sighting.

## targets

    ./bigyear.py targets CA-BC-GV

Expect: `Avg  Code  Species` header, at least one data row, `Avg` column
values in [0.0, 9.0].

## targets (invalid region)

    ./bigyear.py targets BC-CA

Expect: non-zero exit with `returned 0 species` in the error message.

## deepdive --fast

    ./bigyear.py deepdive L164543 --fast

Expect: `Bar-chart buckets around ...` line and a `Bkt  Species` table with
at least one row. (L164543 = Maplewood Flats, well-established hotspot.)

## deepdive (slow)

    ./bigyear.py deepdive L164543 --back 7

Expect: `Fetching N checklists` progress line, then a `Pct  N  Bkt  Species`
table (or `No checklists at ...` if the week is quiet — both are pass).

## leaving

    ./bigyear.py leaving CA-BC-GV

Expect: `! = 'leaving soon'` legend, `Comparing ... to ...` line, then either
a `Now  In  Drop  Species` table or `No targets at bucket >= 3 ...` (both
are pass depending on season).

## map

    ./bigyear.py map 'american robin'

Expect: prints `Opening: American Robin → https://ebird.org/map/amerob?...`
and opens a browser tab. Manual visual check that the map loads.

## cookie (safe against a temp file)

    ./bigyear.py cookie testvalue123 --env-file /tmp/bigyear-test.env
    grep '^EBIRD_SESSION=testvalue123$' /tmp/bigyear-test.env
    rm /tmp/bigyear-test.env

Expect: `Added EBIRD_SESSION in /tmp/bigyear-test.env` and grep matches.
Do NOT run against the real `.env`.
