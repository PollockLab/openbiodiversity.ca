import maplibregl from 'maplibre-gl';
import { TITILER_BASE, sdmCogUrl, sdmCurrentUnclippedUrl } from './sdmSource';

// Category map after Laura's evidence-clip framework (lab meeting 2026-11-16): each cell gets one fixed category,
// and the evidence setting only changes its transparency.
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
const triple = (slug: string, z: number, x: number, y: number) =>
  Promise.all([raw(sdmCurrentUnclippedUrl(slug), z, x, y), raw(sdmCogUrl(slug, 'current'), z, x, y), raw(sdmCogUrl(slug, '2100'), z, x, y)]);

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

// sdmcat://{slug}/{evidence}/{record set}/{z}/{x}/{y}
let registered = false;
export function registerCategoryProtocol() {
  if (registered) return;
  registered = true;
  maplibregl.addProtocol('sdmcat', async (params) => {
    const [slug, evidence, set, zs, xs, ys] = params.url.replace('sdmcat://', '').split('/');
    const z = +zs, x = +xs, y = +ys;
    const [u, c, f] = await triple(slug, z, x, y);
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
    if (u && f) for (let p = 0; p < T * T; p++) {
      const i = p * 4;
      if (!u.v[i + 3] || !f.v[i + 3]) continue;
      const uv = u.v[i], fv = f.v[i];
      const w = uv > 0 && c && c.v[i + 3] ? c.v[i] / uv : 0;
      if (uv < SUITABLE && fv < SUITABLE) continue;
      const near = idx ? nearAt(p) : 0;
      const cat = categorize(uv, fv, near)!;
      // Evidence only fades: medium is the range clip, high also decays with distance from records
      const alpha = evidence === 'none' ? 1 : Math.min(1, w, evidence === 'high' ? Math.exp(-near / HIGH_DECAY_KM) : 1);
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
  const [u, c, f] = await triple(slug, z, x, y);
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
