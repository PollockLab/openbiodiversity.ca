# /// script
# requires-python = ">=3.10"
# dependencies = ["geopandas", "rasterio", "numpy", "pyogrio", "pyproj", "scipy", "mapbox-vector-tile", "requests"]
# ///
"""Precomputed zone rasters for the SDM explorer's zones view (src/data/sdmCategories.ts), so the browser does not compose them per tile.

Usage: uv run scripts/sdm-zones.py [--out DIR] [--span 2016-2025] [--jobs N] [slug ...]
No slugs: every species in public/sdm-species.json. Default span: the explorer's default evidence period, the last 10 full years.
Per species writes {slug}_sdm-zones_1km_na_{span}.tif and .json into DIR (default sdm-zones-out/, gitignored); upload both next to
the other {slug}_* files on the bucket. The client looks for the .json first and falls back to composing zones itself on a 404.

Same rules as categorize() in sdmCategories.ts, on the source 1 km LAEA grid of the unclipped 1980-2010 and 2071-2100 ensembles:
suitable = suitability >= the species threshold (public/sdm-thresholds.json, else 50); in range = cell centre inside the IUCN polygons
(no range file: everywhere); near = cell centre within 40 km of a GBIF density cell (z3 map tiles, same filters as sdmTemporal.ts)
with a record in the span.

Codes (uint8): 0 unsuitable in both periods, 1 confirmed, 2 in-range, 3 range-gap, 4 frontier, 5 climate-risk, 6 newly-suitable
(index into CATEGORIES + 1), 255 no prediction (nodata in either period).
"""
import argparse, datetime, json, sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import mapbox_vector_tile
import numpy as np
import pyogrio
import rasterio
import requests
from pyproj import Transformer
from rasterio.features import rasterize
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://object-arbutus.alliancecan.ca/swift/v1/4903c6264e0c4191a74a54c93b6fe1d9/def-pollock-eckert/vertebrates_NA/ECCC_2026"
CATEGORIES = ["confirmed", "in-range", "range-gap", "frontier", "climate-risk", "newly-suitable"]
SUITABLE, NEAR_KM, NODATA, R = 50, 40, 255, 6371.0088
BASIS = ["HUMAN_OBSERVATION", "MACHINE_OBSERVATION", "OBSERVATION", "OCCURRENCE", "PRESERVED_SPECIMEN", "MATERIAL_SAMPLE"]
Z, EXTENT, TILES = 3, 512, [(x, y) for x in range(3) for y in range(4)]  # z3 tiles covering Canada and the US


def categorize(u, f, thr, in_range, near):
    """Vectorised categorize(): codes as documented above."""
    now, later = u >= thr, f >= thr
    out = np.zeros(u.shape, np.uint8)
    both = now & later
    out[both & in_range & near] = 1
    out[both & in_range & ~near] = 2
    out[both & ~in_range & near] = 3
    out[both & ~in_range & ~near] = 4
    out[now & ~later] = 5
    out[~now & later] = 6
    out[(u == NODATA) | (f == NODATA)] = NODATA
    return out


_t = lambda *a: categorize(*(np.array([v]) for v in a))[0]
assert [_t(70, 70, 60, r, n) for r in (True, False) for n in (True, False)] == [1, 2, 3, 4]
assert _t(70, 10, 60, True, True) == 5 and _t(10, 70, 60, False, False) == 6 and _t(10, 10, 60, True, True) == 0 and _t(60, 59, 60, True, True) == 5
assert _t(255, 70, 60, True, True) == NODATA


def records(sci, span):
    """(lon, lat) of GBIF z3 density cells with a record in span, as sdmTemporal.ts load() places them."""
    s = requests.Session()
    key = s.get("https://api.gbif.org/v1/species/match", params={"name": sci}, timeout=60).json().get("usageKey")
    if key is None:
        return np.empty((0, 2))
    basis = "".join(f"&basisOfRecord={b}" for b in BASIS)
    pts = []
    for x, y in TILES:
        r = s.get(f"https://api.gbif.org/v2/map/occurrence/density/{Z}/{x}/{y}.mvt?srs=EPSG:3857&verbose=true&taxonKey={key}"
                  f"&year=1600,{datetime.date.today().year}{basis}", timeout=120)
        r.raise_for_status()
        layer = mapbox_vector_tile.decode(r.content, default_options={"y_coord_down": True}).get("occurrence")
        for feat in (layer or {}).get("features", []):
            px, py = feat["geometry"]["coordinates"]
            if px < 0 or py < 0 or px >= EXTENT or py >= EXTENT:
                continue  # tile buffer: the neighbour tile owns it
            if not any(k.isdigit() and len(k) == 4 and span[0] <= int(k) <= span[1] for k in feat["properties"]):
                continue
            wx, wy = (x * EXTENT + px + 0.5) / (EXTENT * 2**Z), (y * EXTENT + py + 0.5) / (EXTENT * 2**Z)
            pts.append((wx * 360 - 180, np.degrees(np.arctan(np.sinh(np.pi * (1 - 2 * wy))))))
    return np.array(pts).reshape(-1, 2)


def unit(lon, lat):
    lon, lat = np.radians(lon), np.radians(lat)
    return np.column_stack([np.cos(lat) * np.cos(lon), np.cos(lat) * np.sin(lon), np.sin(lat)])


def run(slug, sci, thr, span, out):
    tag = f"{slug}_sdm-zones_1km_na_{span[0]}-{span[1]}"
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR"):
        with rasterio.open(f"/vsicurl/{BASE}/{slug}_sdm-ensemble_1km_na_1980-2010_sett1.tif") as src:
            u, profile, transform, crs = src.read(1), src.profile, src.transform, src.crs
        with rasterio.open(f"/vsicurl/{BASE}/{slug}_sdm-ensemble_1km_na_2071-2100_sett1.tif") as src:
            f = src.read(1)
    try:
        rng = pyogrio.read_dataframe(f"/vsicurl/{BASE}/{slug}_iucn-range_NA_na_NA_NA.fgb").to_crs(crs)
        in_range = rasterize(((g, 1) for g in rng.geometry if g is not None), out_shape=u.shape, transform=transform, fill=0, dtype=np.uint8).astype(bool)
    except pyogrio.errors.DataSourceError:  # no range file: every cell counts as in range, as in the browser
        in_range = np.ones(u.shape, bool)
    pts = records(sci, span)
    near = np.zeros(u.shape, bool)
    stable = (u >= thr) & (f >= thr) & (u != NODATA) & (f != NODATA)  # range and records only matter here
    if len(pts) and stable.any():
        rows, cols = np.nonzero(stable)
        xs, ys = rasterio.transform.xy(transform, rows, cols)
        lon, lat = Transformer.from_crs(crs, 4326, always_xy=True).transform(np.asarray(xs), np.asarray(ys))
        d, _ = cKDTree(unit(*pts.T)).query(unit(lon, lat), distance_upper_bound=2 * np.sin(NEAR_KM / R / 2))
        near[rows, cols] = np.isfinite(d)
    zones = categorize(u, f, thr, in_range, near)
    profile.update(driver="COG", dtype="uint8", nodata=NODATA, compress="deflate", predictor=1, overview_resampling="nearest", blocksize=512)
    for k in ("blockxsize", "blockysize", "tiled", "interleave"):
        profile.pop(k, None)
    with rasterio.open(out / f"{tag}.tif", "w", **profile) as dst:
        dst.write(zones, 1)
    counts = np.bincount(zones.ravel(), minlength=256)
    px_km2 = abs(transform.a * transform.e) / 1e6
    stats = {"slug": slug, "span": list(span), "threshold": thr, "near_km": NEAR_KM, "records": len(pts), "generated": datetime.date.today().isoformat(),
             "codes": {str(i + 1): c for i, c in enumerate(CATEGORIES)} | {"0": "unsuitable", str(NODATA): "nodata"},
             "km2": [round(float(counts[i + 1] * px_km2)) for i in range(len(CATEGORIES))]}
    (out / f"{tag}.json").write_text(json.dumps(stats, separators=(",", ":")) + "\n")
    return slug, (out / f"{tag}.tif").stat().st_size


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slugs", nargs="*")
    ap.add_argument("--out", type=Path, default=ROOT / "sdm-zones-out")
    y = datetime.date.today().year
    ap.add_argument("--span", default=f"{y - 10}-{y - 1}")
    ap.add_argument("--jobs", type=int, default=4)  # each job holds ~0.5 GB of rasters
    a = ap.parse_args()
    span = tuple(int(v) for v in a.span.split("-"))
    species = {s["slug"]: s["sci"] for s in json.loads((ROOT / "public/sdm-species.json").read_text())}
    thresholds = json.loads((ROOT / "public/sdm-thresholds.json").read_text())
    slugs = a.slugs or list(species)
    a.out.mkdir(parents=True, exist_ok=True)
    with ProcessPoolExecutor(a.jobs) as pool:
        futs = {s: pool.submit(run, s, species[s], thresholds.get(s, SUITABLE), span, a.out) for s in slugs}
        for s, fu in futs.items():
            try:
                print(f"{s}: {fu.result()[1] / 1e6:.2f} MB")
            except Exception as e:  # one unreachable species must not lose the batch
                print(f"skipped {s}: {e!r}", file=sys.stderr)


if __name__ == "__main__":
    main()
