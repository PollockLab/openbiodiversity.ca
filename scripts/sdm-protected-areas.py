# /// script
# requires-python = ">=3.10"
# dependencies = ["geopandas", "pyogrio", "shapely>=2"]
# ///
"""Outline file for the SDM explorer's protected areas toggle (src/components/SdmProtectedAreas.tsx).

Usage: uv run scripts/sdm-protected-areas.py GDB [--out DIR] [--tol 1000] [--min-km2 10]
GDB: NorthAmerica_Protected_areas_2025.gdb, unzipped from protectedareas_2025_geodatabase.zip of the CEC North American Environmental Atlas,
"North American Protected Areas, 2025", Ed. 3.0 (https://www.cec.org/north-american-environmental-atlas/north-american-protected-areas-2025/,
CC BY 4.0). Needs ogr2ogr (GDAL 3.x) on the PATH: it turns the layer's curved polygons into plain ones and skips the rows it cannot read
(51 of 98,557 with GDAL 3.12, their content unknown), both of which stop pyogrio.
Writes cec-protected-areas_CA-US_2025.fgb into DIR (default sdm-protected-areas-out/, gitignored); upload it to protected-areas/ on the bucket.

Terrestrial IUCN-category layer only (no OECMs, no marine layers), Canada and the US only: the map is masked to those two countries and the
Mexican polygons come from WDPA under non-commercial terms. Parts and holes under --min-km2 are dropped, the rest simplified to --tol metres and written
as attribute-free boundary lines in the bucket's LAEA grid, which is what fetchLaeaFgb in src/data/sdmRange.ts expects.
"""
import argparse
import subprocess
import tempfile
from pathlib import Path

import geopandas as gpd
from shapely import Polygon

LAYER = "CEC_NA_2025_terrestrial_IUCN_categories"
LAEA = "+proj=laea +lat_0=45 +lon_0=-100 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs"  # same string as sdmRange.ts
NAME = "cec-protected-areas_CA-US_2025.fgb"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("gdb", type=Path)
    ap.add_argument("--out", type=Path, default=Path("sdm-protected-areas-out"))
    ap.add_argument("--tol", type=float, default=1000, help="simplification tolerance, metres")
    ap.add_argument("--min-km2", type=float, default=10, help="drop parts and holes smaller than this")
    a = ap.parse_args()
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["ogr2ogr", "-skipfailures", "-nlt", "CONVERT_TO_LINEAR", "-nlt", "PROMOTE_TO_MULTI", "-select", "COUNTRY", "-lco", "SPATIAL_INDEX=NO",
                        f"{tmp}/all.fgb", a.gdb, LAYER], check=True, stderr=subprocess.DEVNULL)
        gdf = gpd.read_file(f"{tmp}/all.fgb", on_invalid="ignore")
    print(f"{gdf.geometry.isna().sum()} features with an unclosed ring dropped")
    gdf = gdf[gdf.geometry.notna()]
    print("features by country:", gdf.COUNTRY.value_counts().to_dict())
    gdf = gdf[gdf.COUNTRY.isin(["CAN", "USA"])]
    assert len(gdf) > 10000, "country codes changed?"
    # Per part and per hole, not per area: one area is often thousands of slivers, and simplifying keeps every ring however small.
    # The source grid is equal-area, so .area is true area
    big = lambda g: g.area >= a.min_km2 * 1e6
    parts = gdf.geometry.explode()
    geom = parts[big(parts)].map(lambda p: Polygon(p.exterior, [h for h in p.interiors if big(Polygon(h))]))
    print(f"{len(gdf)} areas in CA/US, {len(geom)} of their {len(parts)} parts are at least {a.min_km2} km2")
    lines = gpd.GeoSeries(geom, crs=gdf.crs).simplify(a.tol).boundary.to_crs(LAEA)
    lines = lines[~lines.is_empty]
    a.out.mkdir(parents=True, exist_ok=True)
    out = a.out / NAME
    # No spatial index: the browser fetches the file whole
    gpd.GeoDataFrame(geometry=lines.reset_index(drop=True)).to_file(out, driver="FlatGeobuf", engine="pyogrio", SPATIAL_INDEX="NO")
    print(f"{out}: {len(lines)} features, {lines.count_coordinates().sum()} vertices, {out.stat().st_size / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
