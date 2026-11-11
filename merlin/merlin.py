"""Convert Merlin-saved sightings in an eBird data export into an eBird import file.

Sightings saved from Merlin show up in the eBird data download, but they don't
count toward eBird's Top 100 / profile totals. Re-importing them as ordinary
incidental checklists makes them count.

Usage:
    python3 merlin.py MyEBirdData.csv [--out import.csv] [--originals originals.csv]

Upload the output at https://ebird.org/import using the "eBird Record Format
(Extended)" option. Then delete the original Merlin checklists listed in the
originals file, or they'll stay in your data as duplicates.
"""

import argparse
import collections
import csv
import io
import re
import sys

MARKER = "merlin:"  # stamped into converted checklists' comments as merlin:<orig id>
MAX_BYTES = 1_000_000  # eBird import file size limit


def read_export(path):
    """Group export rows by Submission ID. Short rows get '' instead of None."""
    with open(path, encoding="utf-8-sig", newline="") as f:
        rows = [{k: v or "" for k, v in r.items()} for r in csv.DictReader(f)]
    subs = collections.defaultdict(list)
    for r in rows:
        subs[r["Submission ID"]].append(r)
    return subs


def is_merlin(checklist):
    """Merlin saves each sighting as its own incidental checklist: one species,
    count X, no start time. The export has no explicit Merlin flag."""
    if len(checklist) != 1:
        return False
    r = checklist[0]
    return (
        r["Protocol"] == "eBird - Casual Observation"
        and r["Count"] == "X"
        and not r["Time"]
        and MARKER not in r["Checklist Comments"]
    )


def already_converted(subs):
    """Original IDs that a previous run already converted (found via the marker)."""
    done = set()
    for checklist in subs.values():
        done.update(re.findall(MARKER + r"(S\d+)", checklist[0]["Checklist Comments"]))
    return done


def clean(s):
    """eBird import forbids double quotes and line breaks; commas would need quoting."""
    return re.sub(r"\s+", " ", s.replace('"', "'").replace(",", ";")).strip()


def to_record(r):
    """One export row -> eBird Record Format (Extended) row (19 columns, no header)."""
    year, month, day = r["Date"].split("-")
    country, _, state = r["State/Province"].partition("-")
    sci = r["Scientific Name"].split()
    comments = " ".join(filter(None, [clean(r["Checklist Comments"]), MARKER + r["Submission ID"]]))
    return [
        clean(r["Common Name"]),
        sci[0] if len(sci) > 0 else "",  # genus
        sci[1] if len(sci) > 1 else "",  # species
        r["Count"],
        clean(r["Observation Details"]),
        clean(r["Location"]),
        r["Latitude"],
        r["Longitude"],
        f"{month}/{day}/{year}",
        r["Time"],
        state,
        country,
        "Incidental",
        r["Number of Observers"],
        "",  # duration
        "N",  # all observations reported
        "",  # distance (miles)
        "",  # area (acres)
        comments,
    ]


def species_key(name):
    """Binomial for rolling subspecies up to species; None for spuh/slash/hybrid."""
    parts = name.split()
    if len(parts) < 2 or parts[1] == "sp." or "/" in parts[1] or (len(parts) > 2 and parts[2] == "x"):
        return None
    return " ".join(parts[:2])


def merlin_only_species(subs, merlin_ids):
    seen_elsewhere, seen_merlin = set(), set()
    for sid, checklist in subs.items():
        for r in checklist:
            key = species_key(r["Scientific Name"])
            if key:
                (seen_merlin if sid in merlin_ids else seen_elsewhere).add(key)
    return seen_merlin - seen_elsewhere


def write_csv(path, rows):
    buf = io.StringIO()
    csv.writer(buf, quoting=csv.QUOTE_NONE, escapechar=None, lineterminator="\n").writerows(rows)
    data = buf.getvalue().encode("utf-8")
    with open(path, "wb") as f:
        f.write(data)
    return len(data)


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("export", help="MyEBirdData.csv from the eBird data download")
    p.add_argument("--out", default="import.csv", help="eBird import file to write")
    p.add_argument("--originals", default="originals.csv", help="list of original Merlin checklists to delete")
    args = p.parse_args(argv)

    subs = read_export(args.export)
    done = already_converted(subs)
    merlin = {sid: c for sid, c in subs.items() if is_merlin(c)}
    todo = {sid: c for sid, c in merlin.items() if sid not in done}

    size = write_csv(args.out, [to_record(c[0]) for c in sorted(todo.values(), key=lambda c: c[0]["Date"])])
    write_csv(args.originals, [["Submission ID", "Date", "Species", "URL"]] + [
        [sid, c[0]["Date"], clean(c[0]["Common Name"]), f"https://ebird.org/checklist/{sid}"]
        for sid, c in sorted(merlin.items(), key=lambda kv: kv[1][0]["Date"])
    ])

    gained = merlin_only_species(subs, set(merlin))
    print(f"{len(subs)} checklists in export; {len(merlin)} look like Merlin sightings.")
    if done:
        print(f"Skipped {len(merlin) - len(todo)} already converted by a previous run.")
    print(f"Wrote {len(todo)} checklists to {args.out} ({size:,} bytes).")
    print(f"Species seen only on Merlin checklists: {len(gained)}")
    print(f"Originals to delete after importing: {args.originals}")
    if size > MAX_BYTES:
        print(f"WARNING: {args.out} exceeds eBird's 1 MB import limit; split it.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
