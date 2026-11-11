import csv

import merlin

HEADER = ("Submission ID,Common Name,Scientific Name,Taxonomic Order,Count,State/Province,County,"
          "Location ID,Location,Latitude,Longitude,Date,Time,Protocol,Duration (Min),All Obs Reported,"
          "Distance Traveled (km),Area Covered (ha),Number of Observers,Breeding Code,Observation Details,"
          "Checklist Comments,ML Catalog Numbers")
ROWS = [
    # Merlin: single species, X, no time, casual (short row, like the real export)
    'S1,Chukar,Alectoris chukar,1,X,US-CA,Inyo,L1,"Big Pine, CA",37.1,-118.2,2023-04-09,,eBird - Casual Observation,,0,,,1',
    # Merlin sighting of a species also seen on a real checklist
    "S2,Mallard,Anas platyrhynchos,2,X,BO-P,,L2,Laguna,-22.1,-67.7,2023-05-20,,eBird - Casual Observation,,0,,,2",
    # Real checklist
    "S3,Mallard,Anas platyrhynchos,2,3,US-CA,,L3,Pond,37.0,-122.0,2023-06-01,08:00 AM,eBird - Traveling Count,30,1,1.0,,1",
    # Hand-entered incidental with a time: not Merlin
    "S4,Northern Harrier,Circus hudsonius,3,X,US-CA,,L4,Pt Reyes,38.0,-122.9,2023-09-29,02:00 PM,eBird - Casual Observation,,0,,,1",
    # Previously converted copy of S5
    "S6,Gadwall,Mareca strepera,4,X,US-CA,,L5,Mono,38.0,-119.0,2023-07-03,,eBird - Casual Observation,,0,,,1,,,merlin:S5",
    "S5,Gadwall,Mareca strepera,4,X,US-CA,,L5,Mono,38.0,-119.0,2023-07-03,,eBird - Casual Observation,,0,,,1",
]


def run(tmp_path):
    export = tmp_path / "export.csv"
    export.write_text("﻿" + HEADER + "\n" + "\n".join(ROWS) + "\n", encoding="utf-8")
    out, orig = tmp_path / "import.csv", tmp_path / "originals.csv"
    assert merlin.main([str(export), "--out", str(out), "--originals", str(orig)]) == 0
    return out.read_text(encoding="utf-8"), list(csv.reader(orig.open()))


def test_selects_only_unconverted_merlin(tmp_path):
    text, originals = run(tmp_path)
    lines = text.splitlines()
    assert [l.split(",")[-1] for l in lines] == ["merlin:S1", "merlin:S2"]
    assert {r[0] for r in originals[1:]} == {"S1", "S2", "S5"}


def test_record_format(tmp_path):
    text, _ = run(tmp_path)
    row = text.splitlines()[0].split(",")
    assert len(row) == 19
    assert row[:4] == ["Chukar", "Alectoris", "chukar", "X"]
    assert row[5] == "Big Pine; CA"
    assert row[8:13] == ["04/09/2023", "", "CA", "US", "Incidental"]
    assert row[15] == "N"
    assert '"' not in text
    assert text.splitlines()[1].split(",")[10:12] == ["P", "BO"]


def test_merlin_only_species(tmp_path):
    subs = merlin.read_export(_write(tmp_path))
    ids = {s for s, c in subs.items() if merlin.is_merlin(c)}
    assert merlin.merlin_only_species(subs, ids) == {"Alectoris chukar"}


def test_species_key():
    assert merlin.species_key("Xenodacnis parina petersi/bella") == "Xenodacnis parina"
    assert merlin.species_key("Hirundo rustica [tytleri Group]") == "Hirundo rustica"
    for name in ["Larus sp.", "Anas platyrhynchos/rubripes", "Anas platyrhynchos x rubripes", "Aves"]:
        assert merlin.species_key(name) is None


def _write(tmp_path):
    p = tmp_path / "e.csv"
    p.write_text(HEADER + "\n" + "\n".join(ROWS[:4]) + "\n", encoding="utf-8")
    return str(p)
