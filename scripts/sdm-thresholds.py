# /// script
# requires-python = ">=3.10"
# dependencies = ["geopandas", "pyogrio", "rasterio", "numpy"]
# ///
"""10th-percentile training-presence threshold per species: the suitability that 90% of the records used to fit the model reach.

Usage: uv run scripts/sdm-thresholds.py [slug ...]
Samples the unclipped 1980-2010 ensemble at each species' training records and writes public/sdm-thresholds.json
({slug: threshold}); with slugs, only those are recomputed. Prints failed slugs.
"""
import json, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import pyogrio
import rasterio

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://object-arbutus.alliancecan.ca/swift/v1/4903c6264e0c4191a74a54c93b6fe1d9/def-pollock-eckert/vertebrates_NA/ECCC_2026"
OUT = ROOT / "public/sdm-thresholds.json"
MIN_RECORDS = 20  # below this a percentile is noise; the viewer falls back to its default


def threshold(values):
    v = np.asarray(values)
    v = v[v != 255]
    # 'lower' keeps the threshold on an observed value, so at least 90% of records reach it
    return int(np.percentile(v, 10, method="lower")) if len(v) >= MIN_RECORDS else None


assert threshold(list(range(100))) == 9 and threshold([255] * 50 + [80] * 30) == 80 and threshold([70] * 5) is None


def run(slug):
    try:
        pts = pyogrio.read_dataframe(f"/vsicurl/{BASE}/{slug}_gbif-occurrence-points-filtered_NA_na_NA_NA.fgb")
        with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR"), rasterio.open(f"/vsicurl/{BASE}/{slug}_sdm-ensemble_1km_na_1980-2010_sett1.tif") as src:
            pts = pts.to_crs(src.crs)
            return slug, threshold([s[0] for s in src.sample(zip(pts.geometry.x, pts.geometry.y))])
    except Exception as e:  # one unreachable file must not lose the batch
        return slug, repr(e)


slugs = sys.argv[1:] or [s["slug"] for s in json.loads((ROOT / "public/sdm-species.json").read_text())]
out = json.loads(OUT.read_text()) if OUT.exists() and sys.argv[1:] else {}
with ThreadPoolExecutor(48) as pool:
    for i, (slug, t) in enumerate(pool.map(run, slugs), 1):
        if isinstance(t, int):
            out[slug] = t
        else:
            print(f"skipped {slug}: {t or 'too few records'}", file=sys.stderr)
        if i % 100 == 0:
            print(f"{i}/{len(slugs)}", file=sys.stderr)
OUT.write_text(json.dumps(dict(sorted(out.items())), separators=(",", ":")) + "\n")
print(f"{len(out)} thresholds written to {OUT.relative_to(ROOT)}")
