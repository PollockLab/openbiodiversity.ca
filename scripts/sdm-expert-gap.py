"""Download USGS GAP 2018 range zips for matched site species and write LAEA FlatGeobufs. Resumable.
Usage: sdm-expert-gap.py WORKDIR [slug ...], where WORKDIR holds gap/gap_matches.json and laea.wkt.
"""
import json, os, subprocess, sys, time, urllib.request, zipfile, collections
S = sys.argv[1]
only = set(sys.argv[2:])
UA = {"User-Agent": "python-requests/2.32.3"}  # ScienceBase answers 403 to custom agents
SB = "https://www.sciencebase.gov/catalog/item/"

def get(url, tries=3):
    for n in range(tries):
        try:
            time.sleep(0.4)
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180).read()
        except Exception as e:
            err = e
            time.sleep(5 * (n + 1))
    raise err

by = collections.defaultdict(list)
for o in json.load(open(f"{S}/gap/gap_matches.json")):
    by[o["slug"]].append(o)
log = open(f"{S}/gap/build.log", "a")
ok = fail = skip = 0
for slug, rs in sorted(by.items()):
    if only and slug not in only:
        continue
    out = f"{S}/gap/out/{slug}_usgs-gap-range_NA_NA_2018-08.fgb"
    if os.path.exists(out):
        skip += 1
        continue
    r = sorted(rs, key=lambda o: o["match"] != "exact")[0]  # shortcut: first item when several match, see gap_matches.json
    z = f"{S}/gap/zips/{r['gap_code']}.zip"
    try:
        files = json.loads(get(f"{SB}{r['gap_id']}?format=json&fields=files"))["files"]
        open(z, "wb").write(get(next(f["url"] for f in files if f["name"].endswith(".zip"))))
        shp = next(n for n in zipfile.ZipFile(z).namelist() if n.lower().endswith(".shp"))
        lyr = os.path.basename(shp)[:-4]
        sql = (f"SELECT '{r['sci']}' AS species, '{r['cls']}' AS class, '{r['gap_sci']}' AS gap_name, "
               f"SeasonCode AS season_code, SeasonName AS season, geometry FROM \"{lyr}\"")
        subprocess.run(["ogr2ogr", "-f", "FlatGeobuf", out[:-4] + ".part.fgb", f"/vsizip/{z}/{shp}", "-dialect", "SQLite", "-sql", sql,
                        "-t_srs", f"{S}/laea.wkt", "-simplify", "500", "-makevalid", "-nlt", "MULTIPOLYGON",
                        "-nln", f"{slug}_usgs-gap-range"], check=True, capture_output=True)
        os.replace(out[:-4] + ".part.fgb", out)
        ok += 1
    except Exception as e:
        fail += 1
        log.write(f"FAIL {slug} {r['gap_code']} {type(e).__name__}: {str(getattr(e, 'stderr', e))[:300]}\n")
        log.flush()
    finally:
        if os.path.exists(z):
            os.remove(z)
        if os.path.exists(out[:-4] + ".part.fgb"):
            os.remove(out[:-4] + ".part.fgb")
print(f"ok {ok} fail {fail} skipped {skip}")
