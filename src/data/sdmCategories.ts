import maplibregl from 'maplibre-gl';
import { TITILER_BASE, sdmCogUrl, sdmRangeUrl } from './sdmSource';

// Category map after Laura's evidence-clip framework (lab meeting 2026-11-16): each cell gets one fixed category,
// and the evidence setting only changes its transparency: medium fades with distance from the IUCN expert range, high also from records.
export type Category = 'expected' | 'frontier' | 'climate-risk' | 'newly-suitable';
export type Evidence = 'none' | 'medium' | 'high';
export const CATEGORIES: Category[] = ['expected', 'frontier', 'climate-risk', 'newly-suitable'];
export const CATEGORY_COLORS: Record<Category, [number, number, number]> = {
  expected: [107, 114, 128], frontier: [14, 165, 233], 'climate-risk': [220, 38, 38], 'newly-suitable': [22, 163, 74],
};
export const hex = (c: Category) => `#${CATEGORY_COLORS[c].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

// shortcut: fixed thresholds, not yet agreed with Laura; expose as controls once the paper fixes them
export const SUITABLE = 50; // ensemble suitability % at or above which a cell counts as suitable
// The range clip leaves ≥50% cells almost untouched (clipped/unclipped ≈ 1 at the 5th percentile for caribou and tailed frog),
// so frontier uses distance to training records instead: suitable, but nobody has recorded the species nearby
export const FRONTIER_KM = 40;
const HIGH_DECAY_KM = 20; // e-folding distance from training records for the high-evidence weight
const MEDIUM_FADE_KM = 100, MEDIUM_FLOOR = 0.15; // medium weight: 1 inside the expert range, falling linearly to the floor this far outside it

export function categorize(u: number, f: number, nearKm: number): Category | null {
  const now = u >= SUITABLE, later = f >= SUITABLE;
  if (now && !later) return 'climate-risk';
  if (!now && later) return 'newly-suitable'; // wins over frontier where both apply
  if (!now) return null;
  return nearKm <= FRONTIER_KM ? 'expected' : 'frontier';
}

// Raw byte tiles: titiler returns gray+alpha PNG with the suitability % as gray when no colormap or rescale is set
// 512 px tiles (titiler ?tilesize=512; this deployment rejects the @2x suffix with a 422): a quarter of the requests and reprojections of 256 px tiles
export const T = 512;
const rawUrl = (cog: string, z: number, x: number, y: number) =>
  `${TITILER_BASE}/tiles/WebMercatorQuad/${z}/${x}/${y}.png?tilesize=512&url=${encodeURIComponent(cog)}&nodata=255`;
type Raw = { v: Uint8ClampedArray } | null; // RGBA with R = value, A = 0 for nodata
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
      return { v: ctx.getImageData(0, 0, T, T).data };
    }).catch(() => { rawCache.delete(k); return null; }));
  }
  return rawCache.get(k)!;
}
// Unclipped present-day and 2100 suitability: the categories compare the two
const pair = (slug: string, z: number, x: number, y: number) =>
  Promise.all([raw(sdmCogUrl(slug, 'current-model'), z, x, y), raw(sdmCogUrl(slug, '2100'), z, x, y)]);

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

// Expert range as Web Mercator rings (flat x,y pairs) per polygon, or null when it cannot be loaded
type RangePoly = { box: [number, number, number, number]; rings: number[][] };
const ranges = new Map<string, Promise<RangePoly[] | null>>();
const rangeOf = (slug: string) => {
  if (!ranges.has(slug)) ranges.set(slug, import('./sdmRange').then((m) => m.fetchLaeaFgb(sdmRangeUrl(slug))).then((fc) => fc.features.flatMap((f) => {
    const g = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    return (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []).map((poly) => {
      const box: RangePoly['box'] = [Infinity, Infinity, -Infinity, -Infinity];
      const rings = poly.map((ring) => ring.flatMap(([lon, lat]) => {
        const [mx, my] = merc(lon, lat);
        box[0] = Math.min(box[0], mx); box[1] = Math.min(box[1], my); box[2] = Math.max(box[2], mx); box[3] = Math.max(box[3], my);
        return [mx, my];
      }));
      return { box, rings };
    });
  })).catch((e) => { console.warn('IUCN range unavailable', e); return null; }));
  return ranges.get(slug)!;
};

// Distance (Web Mercator metres) from each cell of an N x N grid to the range, 0 inside it. The range is filled onto a canvas
// (even-odd, so holes count) and a two-pass chamfer transform measures the distance: cost is per grid cell, not per range vertex.
const RG = 256;
function rangeDistance(polys: RangePoly[], gx0: number, gy0: number, cell: number): Float32Array {
  const ctx = new OffscreenCanvas(RG, RG).getContext('2d', { willReadFrequently: true })!;
  const W = 2 * Math.PI * R, ext = RG * cell;
  ctx.fillStyle = '#000';
  // Rings may be unwrapped past the antimeridian, so draw each polygon's wrapped copies too
  for (const off of [-W, 0, W]) {
    ctx.setTransform(1 / cell, 0, 0, -1 / cell, (off - gx0) / cell, gy0 / cell);
    for (const { box, rings } of polys) {
      if (box[2] + off < gx0 || box[0] + off > gx0 + ext || box[3] < gy0 - ext || box[1] > gy0) continue;
      ctx.beginPath();
      for (const r of rings) { ctx.moveTo(r[0], r[1]); for (let i = 2; i < r.length; i += 2) ctx.lineTo(r[i], r[i + 1]); ctx.closePath(); }
      ctx.fill('evenodd');
    }
  }
  const px = ctx.getImageData(0, 0, RG, RG).data, d = new Float32Array(RG * RG);
  for (let i = 0; i < d.length; i++) d[i] = px[i * 4 + 3] > 127 ? 0 : 1e9;
  const D = Math.SQRT2;
  for (let j = 0; j < RG; j++) for (let i = 0; i < RG; i++) {
    const k = j * RG + i;
    if (i) d[k] = Math.min(d[k], d[k - 1] + 1);
    if (j) { d[k] = Math.min(d[k], d[k - RG] + 1); if (i) d[k] = Math.min(d[k], d[k - RG - 1] + D); if (i < RG - 1) d[k] = Math.min(d[k], d[k - RG + 1] + D); }
  }
  for (let j = RG - 1; j >= 0; j--) for (let i = RG - 1; i >= 0; i--) {
    const k = j * RG + i;
    if (i < RG - 1) d[k] = Math.min(d[k], d[k + 1] + 1);
    if (j < RG - 1) { d[k] = Math.min(d[k], d[k + RG] + 1); if (i < RG - 1) d[k] = Math.min(d[k], d[k + RG + 1] + D); if (i) d[k] = Math.min(d[k], d[k + RG - 1] + D); }
  }
  for (let i = 0; i < d.length; i++) d[i] = Math.max(0, d[i] * cell - cell / 2); // cell centres, so the edge lies half a cell closer
  return d;
}

// sdmcat://{slug}/{evidence}/{record set}/{z}/{x}/{y}
let registered = false;
export function registerCategoryProtocol() {
  if (registered) return;
  registered = true;
  maplibregl.addProtocol('sdmcat', async (params) => {
    const [slug, evidence, set, zs, xs, ys] = params.url.replace('sdmcat://', '').split('/');
    const z = +zs, x = +xs, y = +ys;
    const [[u, f], polys] = await Promise.all([pair(slug, z, x, y), evidence === 'none' ? null : rangeOf(slug)]);
    const out = new ImageData(T, T);
    const idx = records.get(recordsKey(slug, set));
    const size = 2 * Math.PI * R / 2 ** z;
    // Distances vary on a 20-40 km scale, so compute them on a lazily filled 32x32 grid instead of per pixel
    const G = 32, step = T / G, grid = new Float32Array(G * G).fill(-1);
    const nearAt = (p: number) => {
      const g = Math.floor(Math.floor(p / T) / step) * G + Math.floor((p % T) / step);
      if (grid[g] < 0) {
        const gx = g % G, gy = Math.floor(g / G);
        grid[g] = nearestKm(idx!, -Math.PI * R + (x * T + (gx + 0.5) * step) * size / T, Math.PI * R - (y * T + (gy + 0.5) * step) * size / T, 5 * HIGH_DECAY_KM);
      }
      return grid[g];
    };
    // Medium weight from a grid over the tile plus a margin of the fade distance, so ranges just outside the tile still count
    const x0 = -Math.PI * R + x * size, y0 = Math.PI * R - y * size;
    const merc100 = Math.min(MEDIUM_FADE_KM * 1000 * Math.cosh(Math.max(Math.abs(y0), Math.abs(y0 - size)) / R), size);
    const gcell = (size + 2 * merc100) / RG, gx0 = x0 - merc100, gy0 = y0 + merc100;
    const dist = polys ? rangeDistance(polys, gx0, gy0, gcell) : null;
    // Bilinear lookup, in ground km: Mercator metres scale by 1/cosh(my/R)
    const rangeKm = (mx: number, my: number) => {
      const fx = Math.min(RG - 1, Math.max(0, (mx - gx0) / gcell - 0.5)), fy = Math.min(RG - 1, Math.max(0, (gy0 - my) / gcell - 0.5));
      const i = Math.min(RG - 2, Math.floor(fx)), j = Math.min(RG - 2, Math.floor(fy)), a = fx - i, b = fy - j, k = j * RG + i;
      const m = (dist![k] * (1 - a) + dist![k + 1] * a) * (1 - b) + (dist![k + RG] * (1 - a) + dist![k + RG + 1] * a) * b;
      return m / Math.cosh(my / R) / 1000;
    };
    if (u && f) for (let p = 0; p < T * T; p++) {
      const i = p * 4;
      if (!u.v[i + 3] || !f.v[i + 3]) continue;
      const uv = u.v[i], fv = f.v[i];
      if (uv < SUITABLE && fv < SUITABLE) continue;
      const near = idx ? nearAt(p) : 0;
      const cat = categorize(uv, fv, near)!;
      // Evidence only fades: medium by distance from the expert range, high also by distance from records (no range: medium stays 1)
      let alpha = 1;
      if (evidence !== 'none') {
        if (dist) alpha = 1 - (1 - MEDIUM_FLOOR) * Math.min(1, rangeKm(x0 + (p % T + 0.5) * size / T, y0 - (Math.floor(p / T) + 0.5) * size / T) / MEDIUM_FADE_KM);
        if (evidence === 'high') alpha *= Math.exp(-near / HIGH_DECAY_KM);
      }
      const [r, g, b] = CATEGORY_COLORS[cat];
      out.data[i] = r; out.data[i + 1] = g; out.data[i + 2] = b; out.data[i + 3] = Math.round(alpha * 230);
    }
    const canvas = new OffscreenCanvas(T, T);
    canvas.getContext('2d')!.putImageData(out, 0, 0);
    return { data: await (await canvas.convertToBlob({ type: 'image/png' })).arrayBuffer() };
  });
}

// Category of the cell under a point, read from the same raw tiles at a fixed zoom (512 px z6 ≈ 850 m pixels at 45°N, so records share tiles)
export async function categoryAt(slug: string, lon: number, lat: number, key = recordsKey(slug), z = 6): Promise<Category | null> {
  const n = 2 ** z, fx = (lon + 180) / 360 * n, fy = (1 - Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) / Math.PI) / 2 * n;
  const x = Math.floor(fx), y = Math.floor(fy), i = (Math.floor((fy - y) * T) * T + Math.floor((fx - x) * T)) * 4;
  const [u, f] = await pair(slug, z, x, y);
  if (!u || !f || !u.v[i + 3] || !f.v[i + 3]) return null;
  return categorize(u.v[i], f.v[i], distanceToTrainingKm(key, lon, lat));
}

// Records added to GBIF after the models' training download (15 Dec 2025)
export const TRAINING_CUTOFF = '2025-12-15';
export async function fetchNewRecords(sci: string, max = 1500): Promise<{ lon: number; lat: number; date?: string }[]> {
  const match = await (await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(sci)}`)).json();
  if (!match.usageKey) return [];
  const out: { lon: number; lat: number; date?: string }[] = [];
  const today = new Date().toISOString().slice(0, 10);
  for (let offset = 0; offset < max; offset += 300) {
    const q = `taxonKey=${match.usageKey}&country=CA&country=US&hasCoordinate=true&hasGeospatialIssue=false&occurrenceStatus=PRESENT&eventDate=2025-12-16,${today}&limit=300&offset=${offset}`;
    const page = await (await fetch(`https://api.gbif.org/v1/occurrence/search?${q}`)).json();
    for (const r of page.results ?? []) out.push({ lon: r.decimalLongitude, lat: r.decimalLatitude, date: r.eventDate });
    if (page.endOfRecords) break;
  }
  return out;
}
