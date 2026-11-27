"""Write the viewer's index of expert range files: slug -> sources that have a built file, with the labels the legend needs.
Usage: sdm-expert-index.py WORKDIR public/sdm-expert-ranges.json, with the outputs of sdm-expert-gap.py and sdm-expert-ebar.py in WORKDIR.
"""
import json, os, sys, collections
S, out = sys.argv[1], sys.argv[2]
RENAMES = {"charadrius-montanus", "passerculus-bairdii", "passerculus-henslowii"}
idx = collections.defaultdict(dict)
gap = collections.defaultdict(list)
for o in json.load(open(f"{S}/gap/gap_matches.json")):
    gap[o["slug"]].append(o)
shared = collections.Counter(sorted(rs, key=lambda o: o["match"] != "exact")[0]["gap_id"] for rs in gap.values())
for slug, rs in gap.items():
    if not os.path.exists(f"{S}/gap/out/{slug}_usgs-gap-range_NA_NA_2018-08.fgb"):
        continue
    r = sorted(rs, key=lambda o: o["match"] != "exact")[0]
    g = {}
    if r["gap_sci"] != r["sci"]:
        g["name"] = r["gap_sci"]
    if shared[r["gap_id"]] > 1:
        g["shared"] = True  # one GAP range serves several site species after a taxonomic split
    idx[slug]["gap"] = g
ebar = collections.defaultdict(list)
for o in json.load(open(f"{S}/ebar_matches.json")):
    if o["match"] == "exact" or o["slug"] in RENAMES:
        ebar[o["slug"]].append(o)
for slug, rs in ebar.items():
    if not os.path.exists(f"{S}/ebar/out/{slug}_ebar-range_NA_NA_2026-03.fgb"):
        continue
    r = sorted(rs, key=lambda o: (o["scope"] == "G", o["rangedate"] or 0))[-1]
    e = {"scope": r["scope"]}
    if r["ebar_name"] != r["sci"]:
        e["name"] = r["ebar_name"]
    idx[slug]["ebar"] = e
assert idx, "no range files found"
json.dump(dict(sorted(idx.items())), open(out, "w"), separators=(",", ":"))
n = lambda k: sum(k in v for v in idx.values())
print("species", len(idx), "gap", n("gap"), "ebar", n("ebar"), "shared", sum(v.get("gap", {}).get("shared", False) for v in idx.values()))
