import { VectorTile } from '@mapbox/vector-tile';
import Pbf from 'pbf';
import { CATEGORIES, T, categoryAt, distanceToTrainingKm, hasTrainingRecords, recordsKey, setTrainingRecords, zoneTile, zonesOf } from './sdmCategories';

// GBIF density tiles carry per-year counts for every cell, so one pass gives the full dated record history (no 100k
// search cap, no sampling). z3 tiles with a 512 extent are ~9.8 km cells at the equator, ~7 km at 45°N.
const Z = 3, EXTENT = 512;
// Tiles covering Canada and the US (lon -180..-45, lat 0..85)
const TILES = [0, 1, 2].flatMap((x) => [0, 1, 2, 3].map((y) => [x, y]));
export const BASIS = ['HUMAN_OBSERVATION', 'MACHINE_OBSERVATION', 'OBSERVATION', 'OCCURRENCE', 'PRESERVED_SPECIMEN', 'MATERIAL_SAMPLE'];
export const LAST_YEAR = new Date().getFullYear();

// years is flat [year, count, year, count, ...]: a dict keyed by year sits in V8's slow dictionary mode, about 4x the memory over 150k cells
export type Cell = { lon: number; lat: number; first: number; years: number[] };
export const yearsOf = (c: Cell) => c.years.filter((_, i) => i % 2 === 0);

const taxonKeys = new Map<string, Promise<number | null>>();
export const taxonKey = (sci: string) => {
  if (!taxonKeys.has(sci)) taxonKeys.set(sci, fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(sci)}`)
    .then((r) => r.json()).then((m) => m.usageKey ?? null));
  return taxonKeys.get(sci)!;
};

// A cell's bounds [west, south, east, north], the inverse of how load() places its centre
export function cellBox(c: Cell): [number, number, number, number] {
  const n = EXTENT * 2 ** Z, wy = (1 - Math.log(Math.tan(Math.PI / 4 + c.lat * Math.PI / 360)) / Math.PI) / 2;
  const lat = (w: number) => Math.atan(Math.sinh(Math.PI * (1 - 2 * w))) * 180 / Math.PI;
  return [c.lon - 180 / n, lat(wy + 0.5 / n), c.lon + 180 / n, lat(wy - 0.5 / n)];
}
// The cell a map point belongs to: the nearest centre, if it is within a cell
export const cellAt = (cells: Cell[], lon: number, lat: number) => {
  let best: Cell | null = null, d = 0.1; // degrees; cells are < 0.1 across
  for (const c of cells) { const e = Math.hypot(c.lon - lon, c.lat - lat); if (e < d) { d = e; best = c; } }
  return best;
};

const cellCache = new Map<string, Promise<Cell[]>>();
export function fetchCells(sci: string): Promise<Cell[]> {
  if (!cellCache.has(sci)) cellCache.set(sci, load(sci).catch((e) => { cellCache.delete(sci); throw e; }));
  return cellCache.get(sci)!;
}

async function load(sci: string): Promise<Cell[]> {
  const key = await taxonKey(sci);
  if (key == null) return [];
  const basis = BASIS.map((b) => `&basisOfRecord=${b}`).join('');
  const cells: Cell[] = [];
  await Promise.all(TILES.map(async ([x, y]) => {
    const res = await fetch(`https://api.gbif.org/v2/map/occurrence/density/${Z}/${x}/${y}.mvt?srs=EPSG:3857&verbose=true&taxonKey=${key}&year=1600,${LAST_YEAR}${basis}`);
    if (!res.ok) throw new Error(`GBIF map tile ${res.status}`);
    const layer = new VectorTile(new Pbf(new Uint8Array(await res.arrayBuffer()))).layers.occurrence;
    for (let i = 0; i < (layer?.length ?? 0); i++) {
      const f = layer.feature(i), [[pt]] = f.loadGeometry();
      if (pt.x < 0 || pt.y < 0 || pt.x >= EXTENT || pt.y >= EXTENT) continue; // tile buffer: the neighbour tile owns it
      const years: number[] = [];
      for (const [k, v] of Object.entries(f.properties)) if (/^\d{4}$/.test(k)) years.push(+k, Number(v));
      const ys = years.filter((_, i) => i % 2 === 0);
      if (!ys.length) continue; // undated records cannot be placed in time
      const wx = (x * EXTENT + pt.x + 0.5) / (EXTENT * 2 ** Z), wy = (y * EXTENT + pt.y + 0.5) / (EXTENT * 2 ** Z);
      cells.push({ lon: wx * 360 - 180, lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * wy))) * 180 / Math.PI, first: Math.min(...ys), years });
    }
  }));
  return cells;
}

export type Span = [number, number]; // inclusive years
export const TIMELINE_START = 1990; // earliest evidence year the timeline offers
// Default evidence period: the last 10 full years (the IUCN Red List's recent-presence span)
export const DEFAULT_SPAN: Span = [LAST_YEAR - 10, LAST_YEAR - 1];
const inSpan = (c: Cell, [a, b]: Span) => yearsOf(c).some((y) => y >= a && y <= b);
export const spanSet = ([a, b]: Span) => `${a}-${b}`;
export const evidenceCells = (cells: Cell[], span: Span) => cells.filter((c) => inSpan(c, span));
const built = new Map<string, Cell[]>();
export function evidenceKey(slug: string, cells: Cell[], span: Span) {
  const key = recordsKey(slug, spanSet(span));
  // Rebuilt when the cell list changes: an index built from the empty list of a failed GBIF fetch must not outlive it
  if (!hasTrainingRecords(key) || built.get(key) !== cells) { setTrainingRecords(key, evidenceCells(cells, span).map((c) => [c.lon, c.lat])); built.set(key, cells); }
  return key;
}

// Ground area in each zone (keyed like CATEGORIES, relative units) inside `box` [west, south, east, north] and on the
// whole map, and the share of all zoned area that the box holds. From the same z3 tiles as the records.
// Web Mercator pixels shrink on the ground by cos²(lat), so each row is weighted by it.
export async function zoneShares(slug: string, cells: Cell[], span: Span, box?: number[] | null): Promise<{ area: number[]; whole: number[]; share: number }> {
  evidenceKey(slug, cells, span);
  const area = CATEGORIES.map(() => 0), whole = CATEGORIES.map(() => 0);
  // Precomputed zones carry the whole map's areas at 1 km, so only the box is summed from tiles
  const pre = await zonesOf(slug, spanSet(span));
  await Promise.all(TILES.map(async ([x, y]) => {
    const zones = await zoneTile(slug, spanSet(span), Z, x, y);
    if (!zones) return;
    for (let r = 0; r < T; r++) {
      const my = Math.PI * (1 - 2 * (y + (r + 0.5) / T) / 2 ** Z), w = Math.cosh(my) ** -2, lat = Math.atan(Math.sinh(my)) * 180 / Math.PI;
      const rowIn = !box || (lat >= box[1] && lat <= box[3]);
      for (let c = 0; c < T; c++) {
        const zone = zones[r * T + c];
        if (!zone) continue;
        whole[zone - 1] += w;
        const lon = (x + (c + 0.5) / T) / 2 ** Z * 360 - 180;
        if (rowIn && (!box || (lon >= box[0] && lon <= box[2]))) area[zone - 1] += w;
      }
    }
  }));
  // Equator pixel area in km², so tile sums share units with the precomputed areas
  const px = (40075.017 / (T * 2 ** Z)) ** 2;
  const km2 = (v: number[]) => v.map((a) => a * px);
  const sum = (v: number[]) => v.reduce((a, b) => a + b, 0), all = sum(pre ? pre.km2 : km2(whole));
  return { area: km2(area), whole: pre ? CATEGORIES.map((_, i) => pre.km2[i] ?? 0) : km2(whole), share: all ? Math.min(1, sum(km2(area)) / all) : 0 };
}

export type NewStats = { total: number; discovery: number; byCat: Record<string, [number, number]> };
// New: cells recorded in `after` with no record in the evidence period ("new" is cell-based); discovery = ≥ 10 km from evidence
export async function classifyNew(slug: string, cells: Cell[], span: Span, after: Span) {
  const key = evidenceKey(slug, cells, span);
  const stats: NewStats = { total: 0, discovery: 0, byCat: {} };
  const features: GeoJSON.Feature[] = [];
  await Promise.all(cells.filter((c) => inSpan(c, after) && !inSpan(c, span)).map(async (c) => {
    const discovery = distanceToTrainingKm(key, c.lon, c.lat) >= 10;
    const category = (await categoryAt(slug, c.lon, c.lat, key)) ?? 'unsuitable';
    const row = stats.byCat[category] ??= [0, 0];
    row[0]++; stats.total++;
    if (discovery) { row[1]++; stats.discovery++; }
    features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [c.lon, c.lat] }, properties: { category, discovery, date: yearsOf(c).find((y) => y >= after[0] && y <= after[1]) } });
  }));
  return { stats, features };
}
