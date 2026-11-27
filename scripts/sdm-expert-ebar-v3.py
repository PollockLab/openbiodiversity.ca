# /// script
# requires-python = ">=3.11"
# dependencies = ["geopandas", "pyogrio", "requests"]
# ///
"""EBAR v3: site species to EBAR range maps from the union of the public EBAR FeatureService and the NatureServe Canada
vertebrate "All Data" export (on Arbutus), by RangeMapID, keeping the newer RangeDate when a map is in both.
Matching as v2: GBIF accepted species key (EXACT only), EBAR synonymsused fallback, epithet guard, subspecies/population
maps merged (strongest presence per ecoshape) when they cover >= 0.5 of the IUCN range in Canada.
Usage: uv run --script build_ebar_v3.py SPECIES_JSON OLD_INDEX LAEA_WKT OUTDIR [CACHE_DIR]
  SPECIES_JSON  public/sdm-species.json; OLD_INDEX public/sdm-expert-ranges.json (gap and ebar.agree are kept)
  Writes OUTDIR/{ebar_matches_v3,ebar_rejected_v3,iucn_checks_v3}.json, OUTDIR/sdm-expert-ranges.json and
  OUTDIR/out/{slug}_ebar-range_NA_NA_2026-03.fgb for every matched species. Downloads are cached in CACHE_DIR
  (default: $TMPDIR/ebar-v3-cache).
"""
import json, os, re, sys, time, zipfile, tempfile, collections, concurrent.futures as cf, urllib.parse
import geopandas as gpd, pandas as pd, requests
from shapely.geometry import MultiPolygon

SPECIES, OLD_INDEX, WKT, OUT = sys.argv[1:5]
CACHE = sys.argv[5] if len(sys.argv) > 5 else os.path.join(tempfile.gettempdir(), "ebar-v3-cache")
os.makedirs(CACHE, exist_ok=True)
os.makedirs(f"{OUT}/out", exist_ok=True)
ARBUTUS = "https://object-arbutus.alliancecan.ca/swift/v1/4903c6264e0c4191a74a54c93b6fe1d9/def-pollock-eckert/vertebrates_NA/ECCC_2026"
GROUPS = ["Amphibians", "Birds", "Mammals", "Reptiles", "Turtles"]
FS = "https://gis.natureserve.ca/arcgis/rest/services/EBAR-KBA/EBARPublic/FeatureServer/1/query"
RANK = {"P": 3, "X": 2, "H": 1}  # strongest presence wins per ecoshape; blank (removed by review) ranks lowest
LOW = re.compile(r"Low Star|Insufficient Data")

def get(url, path, **kw):
    if not os.path.exists(path):
        for attempt in range(5):
            try:
                r = requests.get(url, timeout=600, **kw)
                r.raise_for_status()
                assert not r.content[:20].startswith(b'{"error"'), f"{url}: {r.content[:200]}"  # ArcGIS errors come back as HTTP 200
                break
            except requests.RequestException:
                if attempt == 4:
                    raise
                time.sleep(2 ** attempt)
        open(path + ".part", "wb").write(r.content)
        os.replace(path + ".part", path)
    return path

def public():
    """Public FeatureService rows (generalized ecoshapes, EPSG:4326), paged."""
    parts, off = [], 0
    while True:
        p = get(FS, f"{CACHE}/public_{off}.geojson", params={"where": "category='Vertebrate Animal'", "outFields": "*", "outSR": 4326,
                "f": "geojson", "resultOffset": off, "resultRecordCount": 2000, "orderByFields": "row_number"})
        g = gpd.read_file(p)
        if g.empty:
            break
        parts.append(g)
        off += 2000
    df = pd.concat(parts, ignore_index=True)
    n = requests.get(FS, params={"where": "category='Vertebrate Animal'", "returnCountOnly": "true", "f": "json"}, timeout=60).json()["count"]
    assert len(df) == n, f"FeatureService paging lost rows: {len(df)} of {n}"
    return df

def export():
    """Export rows in the FeatureService schema: RangeMap x RangeMapEcoshape x EcoshapeOverview, per taxon group zip."""
    parts = []
    for grp in GROUPS:
        name = f"EBAR - Vertebrate Animal - {grp} - All Data.zip"
        z = get(f"{ARBUTUS}/expert-ranges/source/ebar-export/{urllib.parse.quote(name)}", f"{CACHE}/{name}")
        d = f"EBAR - Vertebrate Animal - {grp}"
        with zipfile.ZipFile(z) as zf:
            rd = lambda f: pd.read_csv(zf.open(f"{d}/{f}"), encoding="utf-8-sig", dtype=str, keep_default_na=False)
            rm, rme, jur = rd("RangeMap.csv"), rd("RangeMapEcoshape.csv"), rd("Jurisdiction.csv")
        eco = gpd.read_file(f"/vsizip/{z}/{d}/EcoshapeOverview.shp").to_crs(4326)
        rm.columns = rm.columns.str.lower()
        rme = rme.rename(columns=str.lower)[["rangemapid", "ecoshapeid", "presence", "rangemapecoshapenotes"]]
        eco = eco.merge(jur.rename(columns={"JurisAbbrev": "jurisdictionabbreviation"})[["JurisID", "jurisdictionabbreviation"]].astype({"JurisID": int}), on="JurisID")
        eco = eco.rename(columns={"EcoshapeID": "ecoshapeid"})[["ecoshapeid", "jurisdictionabbreviation", "geometry"]]
        rme["ecoshapeid"] = rme.ecoshapeid.astype(int)
        g = eco.merge(rme, on="ecoshapeid").merge(rm, on="rangemapid")
        assert len(g) == len(rme), f"{grp}: {len(rme) - len(g)} ecoshape rows without geometry or range map"
        parts.append(g)
    df = pd.concat(parts, ignore_index=True)
    df["rangemapid"] = df.rangemapid.astype(int)
    df["rangedate"] = (pd.to_datetime(df.rangedate, format="%m/%d/%Y %H:%M:%S").astype("int64") // 10**6)  # epoch ms, as the FeatureService
    df["presence"] = df.presence.replace("", None)
    return gpd.GeoDataFrame(df, geometry="geometry", crs=4326)

def clean(n):
    """Strip EBAR qualifiers: '(sensu lato)', 'pop. 2', trailing notes in parentheses."""
    return re.sub(r"\s+", " ", re.sub(r"\(.*?\)|\bpop\.\s*\d+\b", "", n)).strip()

def syns(m):
    return [clean(n) for n in re.split(r"[;,]", m.synonymsused or "") if clean(n)]

pub, exp = public(), export()
# union by RangeMapID: the newer RangeDate wins, ties go to the public service (what NatureServe currently publishes)
pd_, ed_ = pub.groupby("rangemapid").rangedate.max(), exp.groupby("rangemapid").rangedate.max()
take_exp = {i for i in ed_.index if i not in pd_.index or ed_[i] > pd_[i]}
cols = [c for c in pub.columns if c in exp.columns]
df = gpd.GeoDataFrame(pd.concat([pub[~pub.rangemapid.isin(take_exp)][cols], exp[exp.rangemapid.isin(take_exp)][cols]], ignore_index=True), crs=4326)
src = {**{int(i): "public" for i in pd_.index if i not in take_exp}, **{int(i): "export" for i in take_exp}}
print("maps: public", len(pd_), "export", len(ed_), "union", df.rangemapid.nunique(), "from export", len(take_exp))
assert df.rangemapid.nunique() >= max(len(pd_), len(ed_))
maps = df.drop(columns="geometry").groupby("rangemapid").first()

cache_path = f"{CACHE}/gbif_cache.json"
try:
    cache = json.load(open(cache_path))
except FileNotFoundError:
    cache = {}

def gbif(name):
    if name not in cache:
        for attempt in range(5):  # GBIF drops connections under load
            try:
                r = requests.get("https://api.gbif.org/v1/species/match", params={"name": name, "kingdom": "Animalia"}, timeout=30)
                r.raise_for_status()
                break
            except requests.RequestException:
                if attempt == 4:
                    raise
                time.sleep(2 ** attempt)
        cache[name] = {k: r.json().get(k) for k in ("speciesKey", "species", "status", "matchType", "rank", "confidence")}
    return cache[name]

species = json.load(open(SPECIES))
maps["clean"] = maps.national_scientific_name.map(clean)
names = {s["sci"] for s in species} | set(maps.clean) | {n for _, m in maps.iterrows() for n in syns(m)}
try:
    with cf.ThreadPoolExecutor(4) as ex:
        list(ex.map(gbif, sorted(names - cache.keys())))
finally:
    json.dump(cache, open(cache_path, "w"), indent=0)

def key(n):
    g = gbif(n)
    return g["speciesKey"] if g["matchType"] == "EXACT" and g["speciesKey"] else None  # FUZZY matched Anarhynchus to Anabarhynchus

def ebar_key(m):
    """GBIF key of the EBAR name, else of the first EBAR 'synonymsused' name GBIF knows (genus renames like Anarhynchus)."""
    return key(m.clean) or next((key(n) for n in syns(m) if key(n)), None)

maps["skey"] = [ebar_key(m) for _, m in maps.iterrows()]
site_by_key = collections.defaultdict(list)
for s in species:
    if key(s["sci"]):
        site_by_key[key(s["sci"])].append(s)

def epithet(n):
    return n.split()[1] if len(n.split()) > 1 else None

crs = open(WKT).read()
IUCN = "/vsicurl/" + ARBUTUS + "/{}_iucn-range_NA_na_NA_NA.fgb"
universe = df[~df.jurisdictionabbreviation.isin(["US", "MX"])].drop_duplicates("ecoshapeid").to_crs(crs).geometry.buffer(0).union_all()
MIN_COVER = 0.5  # merged subspecies maps must cover half the IUCN range inside the EBAR universe, else they are one subspecies of many

def build(comps, sp_name, cls):
    g = df[df.rangemapid.isin(comps)].copy()
    g["rank"] = g.presence.fillna("").map(lambda p: RANK.get(p, 0))
    g = g.sort_values("rank").drop_duplicates("ecoshapeid", keep="last")  # one row per ecoshape, strongest presence
    g["presence"] = g.presence.fillna("")
    out = g.dissolve(by="presence", as_index=False, aggfunc={"rangestage": lambda x: "; ".join(sorted(set(x))), "rangemapscope": lambda x: "".join(sorted(set(x)))})
    out = gpd.GeoDataFrame({"species": sp_name, "class": cls, "presence": out.presence, "rangestage": out.rangestage, "rangemapscope": out.rangemapscope},
                           geometry=out.geometry.buffer(0), crs=4326).to_crs(crs)
    out.geometry = out.geometry.buffer(0).map(lambda x: MultiPolygon([x]) if x.geom_type == "Polygon" else x)
    return out

def cover(slug, ebar):
    """Share of the IUCN range inside the EBAR universe that the EBAR P/X/H outline covers, and both bboxes."""
    try:
        iu = gpd.read_file(IUCN.format(slug)).to_crs(crs).geometry.buffer(0).union_all().intersection(universe)
    except Exception as e:
        return None, str(e)[:80]
    if iu.is_empty:
        return None, "IUCN range does not reach Canada"
    eb = ebar[ebar.presence.isin(["P", "X", "H"])].geometry.union_all()
    return (round(eb.intersection(iu).area / iu.area, 3) if iu.area else None), {"iucn_bbox_ca": [round(v / 1e3) for v in iu.bounds], "ebar_bbox": [round(v / 1e3) for v in eb.bounds]}

rows, rejected, geoms, checks = [], [], {}, {}
for s in species:
    k = key(s["sci"])
    cand = maps[(maps.clean == s["sci"]) | (maps.skey == k)] if k else maps[maps.clean == s["sci"]]
    full = cand[cand.ca_nname_level == "Species"]
    parts = cand[cand.ca_nname_level != "Species"]
    def ok(m, sp_name):
        """Same species: exact name, or GBIF keys agree, the key serves one site species, and the epithet is kept (genus rename)."""
        if sp_name == s["sci"]:
            return None
        if len(site_by_key[k]) > 1:
            return f"GBIF key {k} serves {len(site_by_key[k])} site species ({', '.join(x['slug'] for x in site_by_key[k])}): lumped taxon"
        if epithet(sp_name) != epithet(s["sci"]):
            return f"epithet differs ({sp_name} vs {s['sci']}): GBIF lumps, site splits"
        return None
    use = []
    for rid, m in full.iterrows():
        why = ok(m, m.clean)
        (rejected.append({"slug": s["slug"], "sci": s["sci"], "rangemapid": int(rid), "ebar_name": m.national_scientific_name, "reason": why}) if why else use.append((rid, m)))
    method = None
    if use:
        if any(m.clean == s["sci"] for _, m in use):
            use = [(r, m) for r, m in use if m.clean == s["sci"]]
        rid, m = sorted(use, key=lambda t: (t[1].rangemapscope == "G", t[1].rangedate or 0))[-1]
        comps = [int(rid)]
        method = "exact" if m.national_scientific_name == s["sci"] else "qualifier-stripped" if m.clean == s["sci"] else "gbif-key"
    else:
        good = []
        for rid, m in parts.iterrows():
            sp = " ".join(m.clean.split()[:2])
            why = ok(m, sp)
            (rejected.append({"slug": s["slug"], "sci": s["sci"], "rangemapid": int(rid), "ebar_name": m.national_scientific_name, "reason": "merge component: " + why}) if why else good.append((rid, m)))
        if good:
            comps = sorted(int(r) for r, _ in good)
            g = build(comps, s["sci"], s["class"])
            c, info = cover(s["slug"], g)
            checks[s["slug"]] = {"cover": c, "info": info}
            if c is not None and c >= MIN_COVER:
                method, geoms[s["slug"]] = "merged-infraspecific", g
            else:
                rejected.append({"slug": s["slug"], "sci": s["sci"], "rangemapid": comps, "ebar_name": " + ".join(maps.loc[comps].national_scientific_name),
                                 "reason": f"partial: merged infraspecific maps cover {c} of the IUCN range in the EBAR area (< {MIN_COVER})", "check": info})
    if method:
        ms = maps.loc[comps]
        rows.append({"slug": s["slug"], "sci": s["sci"], "cls": s["class"], "status": s["status"], "rangemapid": comps[0] if len(comps) == 1 else None,
                     "ebar_name": " + ".join(ms.national_scientific_name), "match_method": method, "components": comps,
                     "levels": sorted(set(ms.ca_nname_level)), "scope": "N" if (ms.rangemapscope == "N").any() else "G",
                     "rangedate": int(ms.rangedate.max()), "rangestage": sorted(set(ms.rangestage)),
                     "low": bool(ms.rangestage.str.contains(LOW).any()), "source": sorted({src[c] for c in comps})})
json.dump(rows, open(f"{OUT}/ebar_matches_v3.json", "w"), indent=1)
json.dump(rejected, open(f"{OUT}/ebar_rejected_v3.json", "w"), indent=1)

for r in rows:
    g = geoms.get(r["slug"])
    if g is None:
        g = build(r["components"], maps.loc[r["components"][0]].national_scientific_name, r["cls"])
        checks[r["slug"]] = dict(zip(("cover", "info"), cover(r["slug"], g)))
    g.to_file(f"{OUT}/out/{r['slug']}_ebar-range_NA_NA_2026-03.fgb", driver="FlatGeobuf", layer=f"{r['slug']}_ebar-range")
json.dump(checks, open(f"{OUT}/iucn_checks_v3.json", "w"), indent=1)

idx = json.load(open(OLD_INDEX))
had = {k for k, v in idx.items() if "ebar" in v}
for r in rows:
    e = {"scope": r["scope"]}
    if r["ebar_name"] != r["sci"]:
        e["name"] = r["ebar_name"]
    if r["low"]:
        e["low"] = True
    if "agree" in idx.get(r["slug"], {}).get("ebar", {}):
        e["agree"] = idx[r["slug"]]["ebar"]["agree"]
    idx.setdefault(r["slug"], {})["ebar"] = e
lost = had - {r["slug"] for r in rows}
assert not lost, f"shipped EBAR species no longer matched: {sorted(lost)}"
json.dump(dict(sorted(idx.items())), open(f"{OUT}/sdm-expert-ranges.json", "w"), separators=(",", ":"))
print("before", len(had), "after", len(rows), "added", sorted({r["slug"] for r in rows} - had))
for r in rows:
    if r["slug"] not in had or r["low"]:
        print(" +" if r["slug"] not in had else "  ", r["slug"], r["match_method"], r["ebar_name"], r["components"], r["source"], "LOW" if r["low"] else "", checks.get(r["slug"]))
print("rejected", len(rejected))
for r in rejected:
    print(" -", r["slug"], r["ebar_name"], r["reason"])
