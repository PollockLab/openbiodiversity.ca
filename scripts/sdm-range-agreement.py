# /// script
# requires-python = ">=3.10"
# dependencies = ["geopandas", "rasterio", "numpy", "pandas", "pyogrio", "requests"]
# ///
"""How much expert range maps (IUCN, USGS GAP, EBAR) disagree with each other, next to how much the SDM disagrees with them.

Usage: uv run scripts/sdm-range-agreement.py --gap DIR --ebar DIR [--out DIR] [--slugs a b c] [--limit N] [--workers N] [--selfcheck]
No --slugs: every species in public/sdm-species.json. Resumable: species already in points.csv are skipped; summary.json is rebuilt from the csvs every run.
A species that fails is logged to errors.log with its traceback and retried on the next run.

Grid: the clipped 1980-2010 ensemble read at overview level OVERVIEW (factor 4, 4 km cells, as stored in the COG). Model suitable = overview value >= the species
threshold (public/sdm-thresholds.json, else 50). Expert polygons are rasterized on that grid by cell centre (all_touched=False). All sources share one equal-area
LAEA CRS, so areas are cell counts times the cell area.

Domains (every one also requires a non-nodata model cell): valid = all model cells; us = contiguous US; ca = Canada (Natural Earth 1:10m admin-1, cached in --out/ne).
Pairs: iucn_gap and model_gap in us; iucn_ebar and model_ebar in ca for EBAR scope N, in valid for scope G; gap_ebar in us (scope G only); model_iucn in valid.
model_iucn and model_ebar are also scored in the domain of each expert pair the species has, so the headline compares on the same species and the same cells.
EBAR variants: P (present only) and PX (present + presence expected); historical (H) and blank presence (ecoshape removed by expert review) are never counted. GAP: union of every feature, the seasons present are
recorded in gap_seasons (features with a blank season, GAP codes 5 to 8, as "code N"). GAP variant YS = season codes 1 and 4 only (year-round + summer): the IUCN bird
files hold breeding and resident range, so YS is the season-matched comparison and the one to read for birds; variant "" is every season.
Species flagged gap.shared in public/sdm-expert-ranges.json (one GAP range for several species after a split) get no GAP comparison.
A pair whose union in the domain is under MIN_UNION cells is written with skipped=1 and left out of the summary.

pairs.csv: one row per species x pair x domain x variant; A is the first name in the pair. a_not_b = share of A outside B, b_not_a = share of B outside A.
points.csv: share of the model's training records (inside the domain) falling in each source. The model and its clip were fitted on these records, so the model's
share is not an independent test; it is there as a ceiling next to the expert shares.
points.csv also carries the range area in the domain and records inside per 1000 km2 of range, so a larger range does not win on share alone; summary.json "fair"
pairs IUCN with GAP (us) and with EBAR (ca, or valid for scope G) on both, per species. lift = share inside / (range area / domain area) is the area-controlled score.
Read the records tests with three limits: the training records were filtered by distance to the IUCN range (some at 100 km, all within 1000 km in a 60-species
sample), so records-inside favours IUCN; density and lift favour the smaller range once the share inside is near 1; and the model's lift is not independent,
its threshold was set on these records.
hybrid.csv: one row per species: whether an IUCN file exists, and the hybrid range = IUCN + GAP (contiguous US, not gap.shared) + EBAR P+X inside valid model cells,
with its area next to IUCN's, the area GAP and EBAR each add to IUCN, and the share of training records outside IUCN and outside the hybrid.
summary.json: per pair type and class n, median and IQR of Jaccard distance; headline per expert pair: expert-vs-expert distance on every species with both experts (n_expert), and on the paired set (n_paired, species where
both model pairs were also scored) next to the median model-vs-expert distance (mean of model-vs-A and model-vs-B per species), with a bootstrap 95% interval over
species for the difference. EBAR pairs in Canada are also given for the subset with at least 10% of the IUCN range (valid cells) in Canada.
"""
import argparse
import csv
import io
import json
import threading
import time
import traceback
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import numpy as np
import pandas as pd
import pyogrio
import rasterio
import requests
from rasterio.features import rasterize
from shapely.geometry import box

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://object-arbutus.alliancecan.ca/swift/v1/4903c6264e0c4191a74a54c93b6fe1d9/def-pollock-eckert/vertebrates_NA/ECCC_2026"
NE = "https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip"
SUITABLE, NODATA, OVERVIEW, MIN_UNION, TRIES, BOOT = 50, 255, 1, 100, 6, 5000  # OVERVIEW 1 = second overview = factor 4
PAIR_COLS = ["slug", "class", "pair", "domain", "variant", "ebar_scope", "gap_seasons", "threshold", "cell_m", "a_km2", "b_km2", "inter_km2", "union_km2", "union_cells", "jaccard_dist", "a_not_b", "b_not_a", "skipped"]
POINT_COLS = ["slug", "class", "source", "domain", "variant", "n_points", "n_inside", "share", "range_km2", "domain_km2", "inside_per_1000km2", "lift", "seconds"]
LABEL, GAP_MATCHED = {"ebarP": "ebar", "ebarPX": "ebar", "gapYS": "gap"}, [1, 4]  # GAP season codes: 1 year-round, 4 summer only
HYBRID_COLS = ["slug", "class", "has_iucn", "has_gap", "has_ebar", "iucn_km2", "hybrid_km2", "hybrid_over_iucn", "gap_adds_km2", "ebar_adds_km2", "n_points", "outside_iucn", "outside_hybrid"]
_masks, _lock = {}, threading.Lock()


def retry(fn):
    """The bucket drops connections now and then: back off and try again."""
    for i in range(TRIES):
        try:
            return fn()
        except (requests.RequestException, rasterio.errors.RasterioIOError):
            if i == TRIES - 1:
                raise
            time.sleep(2**i)


def fetch(name):
    """Bytes of a bucket object, None on 404."""
    def get():
        r = requests.get(f"{BASE}/{name}", timeout=120)
        if r.status_code != 404:
            r.raise_for_status()
        return r
    r = retry(get)
    return None if r.status_code == 404 else r.content


def burn(geoms, shape, transform):
    shapes = [(g, 1) for g in geoms if g is not None and not g.is_empty]
    return rasterize(shapes, out_shape=shape, transform=transform, fill=0, dtype=np.uint8).astype(bool) if shapes else np.zeros(shape, bool)


def score(a, b, dom, cell_m):
    """Areas and Jaccard distance of two boolean grids inside dom."""
    a, b = a & dom, b & dom
    na, nb, ni, nu = (int(v.sum()) for v in (a, b, a & b, a | b))
    km2, skip = cell_m * cell_m / 1e6, nu < MIN_UNION
    return {"cell_m": cell_m, "a_km2": na * km2, "b_km2": nb * km2, "inter_km2": ni * km2, "union_km2": nu * km2, "union_cells": nu, "skipped": int(skip),
            "jaccard_dist": "" if skip else round(1 - ni / nu, 5), "a_not_b": "" if skip or not na else round(1 - ni / na, 5), "b_not_a": "" if skip or not nb else round(1 - ni / nb, 5)}


def selfcheck():
    """Two 20x20-cell squares offset by 10 cells: I = 200, U = 600, distance 2/3. Goes through burn() so cell-centre rasterizing is covered too."""
    t, shape = rasterio.transform.from_origin(0, 400_000, 4000, 4000), (100, 100)
    a, b = burn([box(40_000, 40_000, 120_000, 120_000)], shape, t), burn([box(80_000, 40_000, 160_000, 120_000)], shape, t)
    s = score(a, b, np.ones(shape, bool), 4000)
    assert (s["a_km2"], s["inter_km2"], s["union_cells"]) == (6400, 3200, 600) and abs(s["jaccard_dist"] - 2 / 3) < 1e-4 and s["a_not_b"] == s["b_not_a"] == 0.5, s
    assert score(a, a, np.ones(shape, bool), 4000)["jaccard_dist"] == 0 and score(a, burn([box(200_000, 200_000, 300_000, 300_000)], shape, t), np.ones(shape, bool), 4000)["jaccard_dist"] == 1
    half = np.zeros(shape, bool); half[:, :20] = True  # domain keeps only the half of A that B misses
    assert score(a, b, half, 4000)["jaccard_dist"] == 1 and score(a, b, np.zeros(shape, bool), 4000)["skipped"] == 1
    h = paired(pd.DataFrame({"expert": [0.2, 0.4, 1.0], "model_a": [0.5, 0.6, np.nan], "model_b": [0.7, 0.8, np.nan]}), np.random.default_rng(0))  # third species: a model pair was skipped
    assert (h["n_expert"], h["median_expert_all"], h["n_paired"], h["median_expert_paired"], h["median_model_vs_expert"]) == (3, 0.4, 2, 0.3, 0.65), h
    print("selfcheck ok")


def ensure_ne(out):
    """Natural Earth admin-1, downloaded once."""
    shp = out / "ne" / "ne_10m_admin_1_states_provinces.shp"
    if not shp.exists():
        shp.parent.mkdir(parents=True, exist_ok=True)
        zipfile.ZipFile(io.BytesIO(retry(lambda: requests.get(NE, timeout=300)).content)).extractall(shp.parent)
    return shp


def countries(shp, shape, transform, crs):
    """(us, ca) boolean grids, built once per grid. Contiguous US = the 48 states and DC."""
    key = (shape, tuple(transform))
    with _lock:
        if key not in _masks:
            ne = pyogrio.read_dataframe(shp, columns=["iso_a2", "postal"], where="iso_a2 IN ('US', 'CA')").to_crs(crs)
            us = ne[(ne.iso_a2 == "US") & ~ne.postal.isin(["AK", "HI"])]
            assert len(us) == 49 and (ne.iso_a2 == "CA").sum() == 13, "Natural Earth admin-1 layout changed"
            _masks[key] = burn(us.geometry, shape, transform), burn(ne[ne.iso_a2 == "CA"].geometry, shape, transform)
        return _masks[key]


def run(sp, thr, shared, a, shp):
    slug, t0 = sp["slug"], time.time()
    def model():
        with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", GDAL_HTTP_MAX_RETRY=4, GDAL_HTTP_RETRY_DELAY=2), \
                rasterio.open(f"/vsicurl/{BASE}/{slug}_sdm-ensemble-clipped_1km_na_1980-2010_sett1.tif", overview_level=OVERVIEW) as src:
            return src.read(1), src.transform, src.crs
    u, transform, crs = retry(model)
    cell_m, valid = round(abs(transform.a * transform.e) ** 0.5, 1), u != NODATA  # overview sizes round up, so not exactly 4000
    us, ca = countries(shp, u.shape, transform, crs)
    dom = {"valid": valid, "us": valid & us, "ca": valid & ca}
    src, variant, seasons, scope = {"model": (u >= thr) & valid}, {}, "", ""
    if (raw := fetch(f"{slug}_iucn-range_NA_na_NA_NA.fgb")) is not None:
        src["iucn"] = burn(pyogrio.read_dataframe(io.BytesIO(raw)).geometry, u.shape, transform)
    gap = a.gap / f"{slug}_usgs-gap-range_NA_NA_2018-08.fgb"
    if gap.exists() and not shared and len(g := pyogrio.read_dataframe(gap)):  # a GAP file without features counts as no GAP range
        # season is blank for codes 5 to 8 (passage, unknown, extralimital): kept in the union, recorded by code
        src["gap"], seasons = burn(g.geometry, u.shape, transform), "|".join(sorted(g.season.fillna("code " + g.season_code.astype(str)).unique()))
        src["gapYS"], variant["gapYS"] = burn(g[g.season_code.isin(GAP_MATCHED)].geometry, u.shape, transform), "YS"
    ebar = a.ebar / f"{slug}_ebar-range_NA_NA_2026-03.fgb"
    if ebar.exists():
        e = pyogrio.read_dataframe(ebar)
        assert e.rangemapscope.nunique() == 1 and e.rangemapscope.iloc[0] in ("N", "G"), f"unexpected EBAR scope {e.rangemapscope.unique()}"
        scope = e.rangemapscope.iloc[0]
        for v, keep in (("P", ["P"]), ("PX", ["P", "X"])):
            src[f"ebar{v}"] = burn(e[e.presence.isin(keep)].geometry, u.shape, transform)
            variant[f"ebar{v}"] = v
    todo = []  # (A, B, domain)
    if "iucn" in src:
        todo.append(("model", "iucn", "valid"))
    for gp in ("gap", "gapYS") if "gap" in src else ():
        todo.append(("model", gp, "us"))
        if "iucn" in src:
            todo += [("iucn", gp, "us"), ("model", "iucn", "us")]
    for eb in ("ebarP", "ebarPX") if scope else ():
        ed = "ca" if scope == "N" else "valid"
        todo.append(("model", eb, ed))
        if "iucn" in src:
            todo += [("iucn", eb, ed), ("model", "iucn", ed)]
        if "gap" in src and scope == "G":
            todo += [("gap", eb, "us"), ("model", eb, "us")]
    base = {"slug": slug, "class": sp["class"], "ebar_scope": scope, "gap_seasons": seasons, "threshold": thr}
    pairs = [base | {"pair": f"{LABEL.get(x, x)}_{LABEL.get(y, y)}", "domain": d, "variant": variant.get(y, "")} | score(src[x], src[y], dom[d], cell_m) for x, y, d in dict.fromkeys(todo)]
    # shortcut: a record counts as inside a source when its 4 km cell is; test against the polygons if border-cell precision ever matters
    pts = pyogrio.read_dataframe(io.BytesIO(fetch(f"{slug}_gbif-occurrence-points-filtered_NA_na_NA_NA.fgb"))).geometry
    cols, rows = (~transform * (pts.x.to_numpy(), pts.y.to_numpy()))
    rows, cols = np.floor(rows).astype(int), np.floor(cols).astype(int)
    ok = (rows >= 0) & (rows < u.shape[0]) & (cols >= 0) & (cols < u.shape[1])
    rows, cols, points, km2, none = rows[ok], cols[ok], [], cell_m * cell_m / 1e6, np.zeros(u.shape, bool)
    iucn, gap_us, ebar = src.get("iucn", none) & valid, src.get("gap", none) & dom["us"], src.get("ebarPX", none) & valid
    experts, src["hybrid"] = len(src) > 1, iucn | gap_us | ebar
    for name, d in dict.fromkeys([("model", "valid")] + [("hybrid", "valid")] * experts + [("iucn", "valid")] * ("iucn" in src) + [(n, d) for x, y, d in todo for n in (x, y)]):
        ind, area = dom[d][rows, cols], float((src[name] & dom[d]).sum() * km2)
        n, k = int(ind.sum()), int(src[name][rows, cols][ind].sum())
        points.append({"slug": slug, "class": sp["class"], "source": LABEL.get(name, name), "domain": d, "variant": variant.get(name, ""), "n_points": n, "n_inside": k, "share": round(k / n, 5) if n else "",
                       "range_km2": area, "domain_km2": float(dom[d].sum() * km2), "inside_per_1000km2": round(1000 * k / area, 4) if area else "",
                       "lift": round(k / n / (area / (dom[d].sum() * km2)), 4) if n and area else "", "seconds": round(time.time() - t0, 2)})
    n, out = int(valid[rows, cols].sum()), lambda m: round(1 - float(m[rows, cols][valid[rows, cols]].mean()), 5) if n else ""
    hybrid = {"slug": slug, "class": sp["class"], "has_iucn": int("iucn" in src), "has_gap": int("gap" in src), "has_ebar": int("ebarPX" in src), "iucn_km2": iucn.sum() * km2, "hybrid_km2": src["hybrid"].sum() * km2,
              "hybrid_over_iucn": round(float(src["hybrid"].sum() / iucn.sum()), 4) if iucn.any() else "", "gap_adds_km2": (gap_us & ~iucn).sum() * km2, "ebar_adds_km2": (ebar & ~iucn).sum() * km2,
              "n_points": n, "outside_iucn": out(iucn) if "iucn" in src else "", "outside_hybrid": out(src["hybrid"]) if experts else ""}
    return pairs, points, hybrid


def paired(rows, rng):
    """Headline numbers for one expert pair: expert distance on every species, and next to the model on the species where both model pairs were scored."""
    r, m3 = rows.dropna(subset=["model_a", "model_b"]), lambda v: round(float(np.median(v)), 4)
    out = {"n_expert": len(rows), "median_expert_all": m3(rows.expert), "q25_expert_all": round(float(rows.expert.quantile(0.25)), 4), "q75_expert_all": round(float(rows.expert.quantile(0.75)), 4), "n_paired": len(r)}
    if len(r) < 2:
        return out
    e, m = r.expert.to_numpy(), r[["model_a", "model_b"]].mean(axis=1).to_numpy()
    ix = rng.integers(0, len(r), (BOOT, len(r)))
    lo, hi = np.percentile(np.median(m[ix], axis=1) - np.median(e[ix], axis=1), [2.5, 97.5])
    return out | {"median_expert_paired": m3(e), "median_model_vs_expert": m3(m), "median_model_vs_a": m3(r.model_a), "median_model_vs_b": m3(r.model_b), "diff_of_medians": round(float(np.median(m) - np.median(e)), 4),
                  "diff_ci95": [round(float(lo), 4), round(float(hi), 4)], "median_paired_diff": m3(m - e), "share_model_further": round(float((m > e).mean()), 3)}


def summarize(out, skipped_shared):
    p = pd.read_csv(out / "pairs.csv", keep_default_na=False, na_values=[""]).fillna({"variant": ""}).drop_duplicates(["slug", "pair", "domain", "variant"])
    q = lambda s: {"n": 0} if not len(s) else {"n": len(s), "median": round(float(s.median()), 4), "q25": round(float(s.quantile(0.25)), 4), "q75": round(float(s.quantile(0.75)), 4)}
    ok, rng = p[p.skipped == 0], np.random.default_rng(0)
    table = [{"pair": k[0], "domain": k[1], "variant": k[2], "class": c, "skipped": int(gc.skipped.sum())} | q(gc.jaccard_dist[gc.skipped == 0])
             for k, g in p.groupby(["pair", "domain", "variant"]) for c, gc in [("all", g)] + list(g.groupby("class"))]
    d = ok.set_index(["slug", "pair", "domain", "variant"]).jaccard_dist
    area = p[p.pair == "model_iucn"].pivot(index="slug", columns="domain", values="b_km2")  # IUCN area per domain, skipped rows included
    in_canada = set(area.index[area.ca / area.valid >= 0.1]) if "ca" in area else set()
    headline = []
    for (pair, domain, v), g in ok[~ok.pair.str.startswith("model")].groupby(["pair", "domain", "variant"]):
        x, y = pair.split("_")  # only the second source of a pair carries the variant
        rows = pd.DataFrame({"class": g.set_index("slug")["class"], "expert": g.set_index("slug").jaccard_dist, "model_a": d.xs((f"model_{x}", domain, ""), level=[1, 2, 3]), "model_b": d.xs((f"model_{y}", domain, v), level=[1, 2, 3])}).dropna(subset=["expert"])
        for subset, rs in [("all", rows)] + [("iucn >= 10% in Canada", rows[rows.index.isin(in_canada)])] * (y == "ebar" and domain == "ca"):
            headline += [{"expert_pair": pair, "domain": domain, "variant": v, "subset": subset, "class": c, "a": x, "b": y} | paired(r, rng) for c, r in [("all", rs)] + list(rs.groupby("class")) if len(r)]
    pt = pd.read_csv(out / "points.csv", keep_default_na=False, na_values=[""]).fillna({"variant": ""}).drop_duplicates(["slug", "source", "domain", "variant"]).dropna(subset=["share"])
    points = [{"source": k[0], "domain": k[1], "variant": k[2]} | q(g.share) | {"lift": q(g.lift.dropna())} for k, g in pt.groupby(["source", "domain", "variant"])]
    fair = []  # IUCN against the country-specific range on the same species and domain: share of records inside, range area, records per 1000 km2, lift
    pi, pm = (pt[pt.source == n].set_index(["slug", "domain"]) for n in ("iucn", "model"))
    for (source, domain, v), g in pt[pt.source.isin(["gap", "ebar"])].groupby(["source", "domain", "variant"]):
        j = g.set_index("slug").join(pi.xs(domain, level="domain"), rsuffix="_iucn", how="inner").join(pm.xs(domain, level="domain").lift.rename("lift_model")).dropna(subset=["share_iucn", "lift", "lift_iucn"])
        if len(j):
            med, win = lambda c, j=j: round(float(j[c].median()), 4), lambda c, j=j: round(float((j[c] > j[c + "_iucn"]).mean()), 3)
            fair.append({"country_range": source, "domain": domain, "variant": v, "n": len(j), "median_share_iucn": med("share_iucn"), f"median_share_{source}": med("share"), f"share_species_{source}_higher_share": win("share"),
                         "median_km2_iucn": med("range_km2_iucn"), f"median_km2_{source}": med("range_km2"), "median_area_ratio_country_over_iucn": round(float((j.range_km2 / j.range_km2_iucn).median()), 4),
                         "median_per_1000km2_iucn": med("inside_per_1000km2_iucn"), f"median_per_1000km2_{source}": med("inside_per_1000km2"), f"share_species_{source}_higher_density": win("inside_per_1000km2"),
                         "median_lift_iucn": med("lift_iucn"), f"median_lift_{source}": med("lift"), "median_lift_model": med("lift_model"), "n_lift_model": int(j.lift_model.notna().sum()), f"share_species_{source}_higher_lift": win("lift"),
                         "median_paired_lift_diff_country_minus_iucn": round(float((j.lift - j.lift_iucn).median()), 4),
                         f"share_species_{source}_higher_share_and_lift": round(float(((j.share > j.share_iucn) & (j.lift > j.lift_iucn)).mean()), 3), "dropped_empty_range_in_domain": int(len(g) - len(j))})
    h = pd.read_csv(out / "hybrid.csv").drop_duplicates("slug")
    hy = {"species": len(h), "with_iucn_file": int(h.has_iucn.sum()), "without_iucn_file": sorted(h.slug[h.has_iucn == 0]), "with_gap_or_ebar": int(((h.has_gap + h.has_ebar) > 0).sum()),
          "hybrid_over_iucn": q(h.hybrid_over_iucn.dropna()), "gap_adds_km2": q(h.gap_adds_km2[h.has_gap == 1]), "ebar_adds_km2": q(h.ebar_adds_km2[h.has_ebar == 1]),
          "outside_iucn": q(h.outside_iucn.dropna()), "outside_hybrid": q(h.outside_hybrid.dropna()), "species_over_half_records_outside_iucn": int((h.outside_iucn > 0.5).sum()), "species_over_half_records_outside_hybrid": int((h.outside_hybrid > 0.5).sum())}
    note = ("Jaccard distance = 1 - intersection/union on the model's 4 km overview grid, inside the domain and non-nodata model cells. Headline: *_expert_all is every species with both experts (n_expert); the paired figures use the n_paired species "
            "where both model pairs were also scored, and model_vs_expert is the mean of the model's distance to each of the two experts. GAP variant YS = year-round + summer only, the season-matched comparison for birds because the IUCN bird files hold "
            "breeding and resident range; variant '' is every season. Records tests: the training records were filtered by distance to the IUCN range (some at 100 km, all within 1000 km in a 60-species sample), so records-inside favours IUCN; "
            "density and lift (share inside / share of the domain covered) favour the smaller range once the share inside is near 1; the model and its clip were fitted on these records and its threshold set on them, so neither its share nor its lift is an independent test.")
    (out / "summary.json").write_text(json.dumps({"note": note, "overview_level": OVERVIEW, "overview_factor": 2 ** (OVERVIEW + 1), "cell_m": sorted(p.cell_m.unique().tolist()), "min_union_cells": MIN_UNION, "species": int(pt.slug.nunique()),
                                                  "gap_shared_excluded": skipped_shared, "pairs_skipped_small_union": int(p.skipped.sum()), "headline": headline, "hybrid": hy, "fair": fair, "pairs": table, "points": points}, indent=1) + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slugs", nargs="*")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--out", type=Path, default=Path("sdm-range-agreement-out"))
    ap.add_argument("--gap", type=Path, help="folder of {slug}_usgs-gap-range_NA_NA_2018-08.fgb (*.tmp ignored)")
    ap.add_argument("--ebar", type=Path, help="folder of {slug}_ebar-range_NA_NA_2026-03.fgb")
    ap.add_argument("--selfcheck", action="store_true")
    a = ap.parse_args()
    selfcheck()
    if a.selfcheck:
        return
    if not (a.gap and a.gap.is_dir() and a.ebar and a.ebar.is_dir()):
        ap.error("--gap and --ebar must be existing folders")
    species = {s["slug"]: s for s in json.loads((ROOT / "public/sdm-species.json").read_text())}
    thresholds = json.loads((ROOT / "public/sdm-thresholds.json").read_text())
    shared = {s for s, v in json.loads((ROOT / "public/sdm-expert-ranges.json").read_text()).items() if v.get("gap", {}).get("shared")}
    if unknown := set(a.slugs or []) - set(species):
        ap.error(f"not in sdm-species.json: {sorted(unknown)}")
    a.out.mkdir(parents=True, exist_ok=True)
    files = {n: a.out / f"{n}.csv" for n in ("pairs", "points", "hybrid")}
    done = set(pd.read_csv(files["points"], usecols=["slug"]).slug) if files["points"].exists() else set()
    slugs = [s for s in (a.slugs or list(species)) if s not in done][: a.limit]
    print(f"{len(slugs)} species to do, {len(done)} already done")
    shp, failed, t0 = ensure_ne(a.out), 0, time.time()
    handles = {n: f.open("a", newline="") for n, f in files.items()}
    writers = {"pairs": csv.DictWriter(handles["pairs"], PAIR_COLS), "points": csv.DictWriter(handles["points"], POINT_COLS), "hybrid": csv.DictWriter(handles["hybrid"], HYBRID_COLS)}
    for n, w in writers.items():
        if not handles[n].tell():
            w.writeheader()
    with ThreadPoolExecutor(a.workers) as pool:
        futs = {pool.submit(run, species[s], thresholds.get(s, SUITABLE), s in shared, a, shp): s for s in slugs}
        for fu in as_completed(futs):
            try:
                pairs, points, hybrid = fu.result()
            except (OSError, ValueError, RuntimeError, KeyError, rasterio.errors.RasterioError):  # one bad species must not lose the batch; it stays out of the csvs so the next run retries it
                failed += 1
                with (a.out / "errors.log").open("a") as f:
                    f.write(f"{time.strftime('%F %T')} {futs[fu]}\n{traceback.format_exc()}\n")
                print(f"FAILED {futs[fu]}: see {a.out / 'errors.log'}")
                continue
            writers["pairs"].writerows(pairs)
            writers["points"].writerows(points)
            writers["hybrid"].writerow(hybrid)
            for h in handles.values():
                h.flush()
            print(f"{futs[fu]}: {len(pairs)} pairs, {points[0]['seconds']} s")
    for h in handles.values():
        h.close()
    if slugs:
        print(f"{len(slugs) - failed} done, {failed} failed, {time.time() - t0:.0f} s wall, {(time.time() - t0) / len(slugs):.2f} s per species")
    summarize(a.out, sorted(shared & (set(a.slugs or species))))
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
