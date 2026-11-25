import maplibregl from 'maplibre-gl';
import { TITILER_BASE, sdmCogUrl, sdmRangeUrl, sdmZonesUrl } from './sdmSource';

// Zone map after the lab's evidence framework: each cell gets one zone from
// suitability now and in 2100 (binary, at the species' own threshold), the IUCN expert range and nearby records.
export type Category = 'confirmed' | 'in-range' | 'range-gap' | 'frontier' | 'climate-risk' | 'newly-suitable';
export const CATEGORIES: Category[] = ['confirmed', 'in-range', 'range-gap', 'frontier', 'climate-risk', 'newly-suitable'];
// Colour-blind-safe variant of the paper's palette (Fig. 3); range-gap is a darker shade of frontier, its branch with records
export const CATEGORY_COLORS: Record<Category, [number, number, number]> = {
  confirmed: [28, 26, 59], 'in-range': [157, 169, 192], 'range-gap': [120, 128, 37], frontier: [170, 181, 36], 'climate-risk': [226, 125, 114], 'newly-suitable': [42, 136, 155],
};
export const hex = (c: Category) => `#${CATEGORY_COLORS[c].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

// Fallback for species without a threshold in public/sdm-thresholds.json (too few training records)
export const SUITABLE = 50;
// Per species: the suitability that 90% of the model's training records reach (scripts/sdm-thresholds.py). The same value
// is used for today and 2100, so a cell changes status only when its suitability crosses it.
// A failed load is not kept: the next call asks again, so one network error does not put every species on the fallback
let thresholds: Promise<Record<string, number>> | undefined;
export const thresholdOf = (slug: string): Promise<number> =>
  (thresholds ??= fetch(`${import.meta.env.BASE_URL}sdm-thresholds.json`).then((r) => (r.ok ? r.json() : Promise.reject(r.status))).catch(() => { thresholds = undefined; return {} as Record<string, number>; })).then((t) => t[slug] ?? SUITABLE);
// shortcut: fixed distance and a hard range edge, not yet the paper's per-species decay (tau); replace once that kernel is settled
export const NEAR_KM = 40; // a record this close counts as "near"

export function categorize(u: number, f: number, thr: number, inRange: boolean, near: boolean): Category | null {
  const now = u >= thr, later = f >= thr;
  if (now && !later) return 'climate-risk'; // the two change zones win over range and records
  if (!now && later) return 'newly-suitable';
  if (!now) return null;
  return inRange ? (near ? 'confirmed' : 'in-range') : (near ? 'range-gap' : 'frontier');
}
if (import.meta.env.DEV) {
  const all = [true, false].flatMap((r) => [true, false].map((n) => [categorize(70, 70, 60, r, n), categorize(70, 10, 60, r, n), categorize(10, 70, 60, r, n), categorize(10, 10, 60, r, n)].join()));
  console.assert(all.join(' ') === ['confirmed', 'in-range', 'range-gap', 'frontier'].map((c) => `${c},climate-risk,newly-suitable,`).join(' ') && categorize(60, 59, 60, true, true) === 'climate-risk', 'categorize');
}

// Raw byte tiles: titiler returns gray+alpha PNG with the suitability % as gray when no colormap or rescale is set
// 512 px tiles (titiler ?tilesize=512; this deployment rejects the @2x suffix with a 422): a quarter of the requests and reprojections of 256 px tiles
export const T = 512;
// v: the tile server's cache ignores Vary: Origin, so a tile first requested from another origin is cached without this site's CORS header; bump to leave such copies behind
const rawUrl = (cog: string, z: number, x: number, y: number) =>
  `${TITILER_BASE}/tiles/WebMercatorQuad/${z}/${x}/${y}.png?tilesize=512&url=${encodeURIComponent(cog)}&nodata=255&v=2`;
type Raw = { v: Uint8Array } | null; // one byte per pixel, NODATA where titiler gave alpha 0
const NODATA = 255; // the COGs' own nodata value, so no valid suitability reads as it
const rawCache = new Map<string, Promise<Raw>>();
function raw(cog: string, z: number, x: number, y: number): Promise<Raw> {
  const k = `${cog}|${z}|${x}|${y}`;
  if (!rawCache.has(k)) {
    if (rawCache.size > 600) rawCache.delete(rawCache.keys().next().value!);
    // titiler's occasional 5xx carries no CORS header and surfaces as a network error, so retry once
    const get = () => fetch(rawUrl(cog, z, x, y)).catch(() => new Promise<Response>((ok) => setTimeout(ok, 800)).then(() => fetch(rawUrl(cog, z, x, y))));
    rawCache.set(k, get().then(async (r) => {
      if (!r.ok) return null; // titiler 404s tiles outside the COG
      const bmp = await createImageBitmap(await r.blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
      const ctx = new OffscreenCanvas(T, T).getContext('2d')!;
      ctx.drawImage(bmp, 0, 0);
      // Keep R only: a quarter of the RGBA, so the 600-tile cache holds 150 MB, not 600
      const rgba = ctx.getImageData(0, 0, T, T).data, v = new Uint8Array(T * T);
      for (let p = 0; p < T * T; p++) v[p] = rgba[p * 4 + 3] ? rgba[p * 4] : NODATA;
      return { v };
    }).catch(() => { rawCache.delete(k); return null; }));
  }
  return rawCache.get(k)!;
}
// Unclipped present-day and 2100 suitability: the categories compare the two
const pair = (slug: string, z: number, x: number, y: number) =>
  Promise.all([raw(sdmCogUrl(slug, 'current-model'), z, x, y), raw(sdmCogUrl(slug, '2100'), z, x, y)]);

// Precomputed zones (scripts/sdm-zones.py) for a species and evidence span, or null when there are none (404): then tiles are composed here.
// codes: CATEGORIES index + 1, 0 unsuitable in both periods, 255 no prediction; km2: ground area per CATEGORIES entry
export type Zones = { km2: number[]; threshold: number };
const zonesCache = new Map<string, Promise<Zones | null>>();
export const zonesOf = (slug: string, set: string): Promise<Zones | null> => {
  const k = `${slug}|${set}`;
  // A network error is not kept, so the next call asks again; a 404 is
  if (!zonesCache.has(k)) zonesCache.set(k, fetch(sdmZonesUrl(slug, set, 'json')).then((r) => (r.ok ? r.json() : null), () => { zonesCache.delete(k); return null; }));
  return zonesCache.get(k)!;
};
// Titiler paints the codes directly; a hidden zone has no colormap entry, so it is clear like 0 and nodata
export const zonesTileUrl = (slug: string, set: string, shown: string) => {
  const cmap = Object.fromEntries(CATEGORIES.flatMap((c, i) => (shown[i] === '1' ? [[i + 1, [...CATEGORY_COLORS[c], 255]]] : [])));
  return `${TITILER_BASE}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?tilesize=512&url=${encodeURIComponent(sdmZonesUrl(slug, set, 'tif'))}&nodata=255&resampling=nearest&colormap=${encodeURIComponent(JSON.stringify(cmap))}`;
};

// Training records in Web Mercator metres, bucketed for nearest-distance lookups
const R = 6378137;
const merc = (lon: number, lat: number): [number, number] => [R * lon * Math.PI / 180, R * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))];
type Index = { cell: number; buckets: Map<string, [number, number][]> };
const records = new Map<string, Index>();
// Indexes are keyed per species and evidence set: 'slug|training' or 'slug|2000-2030' (a year window)
export const recordsKey = (slug: string, set = 'training') => `${slug}|${set}`;
export function setTrainingRecords(key: string, pts: [number, number][]) {
  const cell = 50_000, buckets = new Map<string, [number, number][]>();
  for (const [lon, lat] of pts) {
    const p = merc(lon, lat), k = `${Math.floor(p[0] / cell)},${Math.floor(p[1] / cell)}`;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(p);
  }
  records.set(key, { cell, buckets });
}
// Ground distance (km) to the nearest training record, capped at `capKm`; Mercator metres scale by 1/cos(lat)
function nearestKm(idx: Index, mx: number, my: number, capKm: number): number {
  const scale = Math.cosh(my / R) ** -1; // cos(lat) from Mercator y
  const reach = Math.ceil((capKm * 1000 / scale) / idx.cell), cx = Math.floor(mx / idx.cell), cy = Math.floor(my / idx.cell);
  let best = Infinity;
  for (let i = -reach; i <= reach; i++) for (let j = -reach; j <= reach; j++) {
    for (const [px, py] of idx.buckets.get(`${cx + i},${cy + j}`) ?? []) best = Math.min(best, (px - mx) ** 2 + (py - my) ** 2);
  }
  return Math.min(capKm, Math.sqrt(best) * scale / 1000);
}
export const hasTrainingRecords = (key: string) => records.has(key);
export const distanceToTrainingKm = (key: string, lon: number, lat: number, capKm = 100) => {
  const idx = records.get(key);
  return idx ? nearestKm(idx, ...merc(lon, lat), capKm) : Infinity;
};

// Expert range as one Web Mercator path per polygon, or null when it cannot be loaded
const ranges = new Map<string, Promise<Path2D[] | null>>();
// Mercator bounds [minX, minY, maxX, maxY] per polygon: a point outside them skips the exact test (the robin has hundreds of polygons)
const bounds = new WeakMap<Path2D, number[]>();
const rangeOf = (slug: string) => {
  if (!ranges.has(slug)) ranges.set(slug, import('./sdmRange').then((m) => m.fetchLaeaFgb(sdmRangeUrl(slug))).then((fc) => fc.features.flatMap((f) => {
    const g = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    return (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []).map((poly) => {
      const path = new Path2D(), b = [Infinity, Infinity, -Infinity, -Infinity];
      for (const ring of poly) {
        ring.forEach(([lon, lat], i) => {
          const [mx, my] = merc(lon, lat);
          b[0] = Math.min(b[0], mx); b[1] = Math.min(b[1], my); b[2] = Math.max(b[2], mx); b[3] = Math.max(b[3], my);
          if (i) path.lineTo(mx, my); else path.moveTo(mx, my);
        });
        path.closePath();
      }
      bounds.set(path, b);
      return path;
    });
  })).catch((e) => { console.warn('IUCN range unavailable', e); ranges.delete(slug); return null; })); // not kept, so the next tile asks again
  return ranges.get(slug)!;
};
const W = 2 * Math.PI * R;
// Rings may be unwrapped past the antimeridian, so every test also tries the wrapped copies
const probe = new OffscreenCanvas(1, 1).getContext('2d')!;
const inRange = (paths: Path2D[], mx: number, my: number) => paths.some((p) => {
  const b = bounds.get(p)!;
  return my >= b[1] && my <= b[3] && [-W, 0, W].some((off) => mx - off >= b[0] && mx - off <= b[2] && probe.isPointInPath(p, mx - off, my, 'evenodd'));
});

// A tile-sized alpha mask drawn in Web Mercator metres: `draw` runs once per wrapped copy of the world
function mask(x0: number, y0: number, size: number, draw: (ctx: OffscreenCanvasRenderingContext2D) => void): Uint8ClampedArray {
  const ctx = new OffscreenCanvas(T, T).getContext('2d', { willReadFrequently: true })!, s = T / size;
  for (const off of [-W, 0, W]) { ctx.setTransform(s, 0, 0, -s, (off - x0) * s, y0 * s); draw(ctx); }
  return ctx.getImageData(0, 0, T, T).data;
}

// Zone of every pixel of a tile as an index into CATEGORIES + 1 (0 = unsuitable in both periods or no data), or null without rasters
export async function zoneTile(slug: string, set: string, z: number, x: number, y: number): Promise<Uint8Array | null> {
  if (await zonesOf(slug, set)) {
    const v = (await raw(sdmZonesUrl(slug, set, 'tif'), z, x, y))?.v;
    return v ? v.map((c) => (c === NODATA ? 0 : c)) : null;
  }
  const [[u, f], paths, thr] = await Promise.all([pair(slug, z, x, y), rangeOf(slug), thresholdOf(slug)]);
  if (!u || !f) return null;
  const size = W / 2 ** z, x0 = -W / 2 + x * size, y0 = W / 2 - y * size;
  // No range: every cell counts as in range, so only records split the stable cells
  const rm = paths && mask(x0, y0, size, (ctx) => paths.forEach((p) => ctx.fill(p, 'evenodd')));
  // Near a record: discs of NEAR_KM ground distance (Mercator metres scale by cosh(my/R)) around the records in reach of the tile
  const idx = records.get(recordsKey(slug, set));
  const nm = idx && mask(x0, y0, size, (ctx) => {
    ctx.beginPath();
    for (const pts of idx.buckets.values()) for (const [px, py] of pts) {
      const r = NEAR_KM * 1000 * Math.cosh(py / R);
      if (py - r > y0 || py + r < y0 - size) continue;
      ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, 2 * Math.PI);
    }
    ctx.fill();
  });
  const out = new Uint8Array(T * T);
  for (let p = 0; p < T * T; p++) {
    const i = p * 4;
    if (u.v[p] === NODATA || f.v[p] === NODATA) continue;
    const cat = categorize(u.v[p], f.v[p], thr, !rm || rm[i + 3] > 127, !nm || nm[i + 3] > 127);
    if (cat) out[p] = CATEGORIES.indexOf(cat) + 1;
  }
  return out;
}

// sdmcat://{slug}/{record set}/{shown}/{z}/{x}/{y}, shown: one 0/1 per CATEGORIES entry, so a use can hide zones
let registered = false;
export function registerCategoryProtocol() {
  if (registered) return;
  registered = true;
  maplibregl.addProtocol('sdmcat', async (params) => {
    const [slug, set, shown, z, x, y] = params.url.replace('sdmcat://', '').split('/');
    const zones = await zoneTile(slug, set, +z, +x, +y), out = new ImageData(T, T);
    if (zones) for (let p = 0; p < T * T; p++) if (zones[p] && shown[zones[p] - 1] === '1') out.data.set([...CATEGORY_COLORS[CATEGORIES[zones[p] - 1]], 255], p * 4);
    const canvas = new OffscreenCanvas(T, T);
    canvas.getContext('2d')!.putImageData(out, 0, 0);
    return { data: await (await canvas.convertToBlob({ type: 'image/png' })).arrayBuffer() };
  });
}

// Category of the cell under a point, read from the same raw tiles at a fixed zoom (512 px z5 ≈ 1.7 km pixels at 45°N, so records share tiles)
export async function categoryAt(slug: string, lon: number, lat: number, key: string, z = 5): Promise<Category | null | undefined> {
  const n = 2 ** z, fx = (lon + 180) / 360 * n, fy = (1 - Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) / Math.PI) / 2 * n;
  const x = Math.floor(fx), y = Math.floor(fy), i = Math.floor((fy - y) * T) * T + Math.floor((fx - x) * T);
  const set = key.slice(key.indexOf('|') + 1);
  if (await zonesOf(slug, set)) {
    const c = (await raw(sdmZonesUrl(slug, set, 'tif'), z, x, y))?.v[i];
    return c === undefined || c === NODATA ? undefined : c ? CATEGORIES[c - 1] : null;
  }
  const [[u, f], paths, thr] = await Promise.all([pair(slug, z, x, y), rangeOf(slug), thresholdOf(slug)]);
  if (!u || !f || u.v[i] === NODATA || f.v[i] === NODATA) return undefined; // no prediction here (sea, outside the model), not the same as unsuitable
  const both = u.v[i] >= thr && f.v[i] >= thr; // range and records only decide the zone when the cell is suitable in both periods
  return categorize(u.v[i], f.v[i], thr, both && (!paths || inRange(paths, ...merc(lon, lat))), both && distanceToTrainingKm(key, lon, lat) <= NEAR_KM);
}

// Uses from exploratory to evidence-based (paper Fig. 6): each shows only the zones that answer it
export const USES: { id: string; label: [string, string]; zones: Category[] }[] = [
  { id: 'all', label: ['All zones', 'Toutes les zones'], zones: CATEGORIES },
  { id: 'protect', label: ['Protected area planning', 'Planification des aires protégées'], zones: ['confirmed', 'in-range'] },
  { id: 'survey', label: ['Survey for new populations', 'Inventaire de nouvelles populations'], zones: ['in-range', 'frontier'] },
  { id: 'range', label: ['Range map review', "Révision de la carte d'aire"], zones: ['range-gap', 'frontier'] },
  { id: 'climate', label: ['Climate adaptation', 'Adaptation au climat'], zones: ['climate-risk', 'newly-suitable'] },
];
export const shownKey = (zones: Category[]) => CATEGORIES.map((c) => (zones.includes(c) ? 1 : 0)).join('');
