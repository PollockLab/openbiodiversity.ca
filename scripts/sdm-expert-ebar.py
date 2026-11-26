"""Write one LAEA FlatGeobuf per matched species from the EBAR GeoPackage.
Usage: sdm-expert-ebar.py WORKDIR, where WORKDIR holds ebar_matches.json, laea.wkt and the EBAR GeoPackage.
"""
import json, subprocess, sys, collections
S = sys.argv[1]
GENUS_RENAMES = {"charadrius-montanus", "passerculus-bairdii", "passerculus-henslowii"}
m = [o for o in json.load(open(f"{S}/ebar_matches.json")) if o["match"] == "exact" or o["slug"] in GENUS_RENAMES]
by = collections.defaultdict(list)
for o in m:
    by[o["slug"]].append(o)
done, multi = 0, {}
for slug, rs in sorted(by.items()):
    # shortcut: when a species has several ranges keep global scope, else the newest; revisit if EBAR adds seasonal ranges
    r = sorted(rs, key=lambda o: (o["scope"] == "G", o["rangedate"] or 0))[-1]
    if len(rs) > 1:
        multi[slug] = [(o["rangemapid"], o["scope"]) for o in rs]
    out = f"{S}/ebar/out/{slug}_ebar-range_NA_NA_2026-03.fgb"
    sql = (f"SELECT national_scientific_name AS species, '{r['cls']}' AS class, presence, rangestage, rangemapscope, "
           f"ST_Union(geom) AS geom FROM r WHERE rangemapid = {int(r['rangemapid'])} GROUP BY presence")
    subprocess.run(["ogr2ogr", "-f", "FlatGeobuf", out, f"{S}/ebar/ebar_all.gpkg", "-dialect", "SQLite", "-sql", sql,
                    "-t_srs", f"{S}/laea.wkt", "-nlt", "MULTIPOLYGON", "-nln", f"{slug}_ebar-range", "-overwrite"], check=True)
    done += 1
assert done == len(by) and done > 0, "no species written"
print("written", done, "multi-range", multi)
