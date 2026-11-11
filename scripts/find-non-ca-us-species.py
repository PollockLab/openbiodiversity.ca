# /// script
# requires-python = ">=3.10"
# dependencies = ["geopandas", "pyogrio", "shapely", "requests"]
# ///
"""List species in public/sdm-species.json with zero GBIF points inside Canada or the USA.

Usage: uv run scripts/find-non-ca-us-species.py
Writes scripts/non-ca-us-species.json (slug list); prints borderline (1-5 CA/US points) and failed slugs.
"""
import io, json, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import geopandas as gpd
import pyogrio
import requests

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://object-arbutus.alliancecan.ca/swift/v1/4903c6264e0c4191a74a54c93b6fe1d9/def-pollock-eckert/vertebrates_NA/ECCC_2026"
NE = "https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries.zip"

world = gpd.read_file(NE)
col = "ISO_A3_EH" if "ISO_A3_EH" in world else "ADM0_A3"
cu = world[world[col].isin(["CAN", "USA"])].to_crs(4326)
# 10 km tolerance so coastal and offshore records (seabirds, islands) count as CA/US
cu = gpd.GeoDataFrame(geometry=[cu.to_crs("ESRI:102008").geometry.union_all().buffer(10_000)], crs="ESRI:102008").to_crs(4326)
cu.sindex  # build once; shared read-only across threads


def count(slug):
    """Return (slug, n_points_in_CA_US, error)."""
    try:
        r = requests.get(f"{BASE}/{slug}_gbif-occurrence-points-filtered_NA_na_NA_NA.fgb", timeout=120)
        r.raise_for_status()
        pts = pyogrio.read_dataframe(io.BytesIO(r.content))
        if pts.crs is None:
            raise ValueError("no CRS")
        pts = pts[pts.geometry.notna() & ~pts.geometry.is_empty].to_crs(4326)
        return slug, int(pts.within(cu.geometry.iloc[0]).sum()), None
    except Exception as e:
        return slug, None, f"{type(e).__name__}: {e}"


slugs = [s["slug"] for s in json.loads((ROOT / "public/sdm-species.json").read_text())]
with ThreadPoolExecutor(16) as ex:
    res = list(ex.map(count, slugs))

failed = {s: e for s, n, e in res if e}
counts = {s: n for s, n, e in res if not e}
outside = sorted(s for s, n in counts.items() if n == 0)
border = {s: n for s, n in counts.items() if 1 <= n <= 5}
(ROOT / "scripts/non-ca-us-species.json").write_text(json.dumps(outside, indent=1) + "\n")
print(f"total={len(slugs)} non_ca_us={len(outside)} failed={len(failed)} borderline(1-5)={len(border)}")
print("examples:", outside[:10])
print("thamnophis-pulchrilatus in list:", "thamnophis-pulchrilatus" in outside)
print("failed:", json.dumps(failed, indent=1))
print("borderline:", json.dumps(dict(sorted(border.items(), key=lambda x: x[1])), indent=1))
