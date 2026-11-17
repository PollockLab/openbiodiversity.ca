import { geojson } from 'flatgeobuf';
import proj4 from 'proj4';
import type { Feature } from 'geojson';

// The bucket's FlatGeobufs are in LAEA (lat_0=45, lon_0=-100, WGS84), MapLibre needs lon/lat
const fromLaea = proj4('+proj=laea +lat_0=45 +lon_0=-100 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs', 'EPSG:4326');
// Rings crossing the antimeridian are unwrapped (lon past 180) so no segment spans the whole map
const unproject = (c: any): any => {
  if (typeof c[0] === 'number') return fromLaea.forward(c);
  if (typeof c[0][0] !== 'number') return c.map(unproject);
  let off = 0, prev = 0;
  return c.map((p: [number, number], i: number) => {
    const [lon, lat] = fromLaea.forward(p);
    if (i && Math.abs(lon + off - prev) > 180) off += lon + off < prev ? 360 : -360;
    return [prev = lon + off, lat];
  });
};

// Memoized so the range outline and the occurrence classification share one download
const cache = new Map<string, Promise<GeoJSON.FeatureCollection>>();
export function fetchLaeaFgb(url: string): Promise<GeoJSON.FeatureCollection> {
  if (!cache.has(url)) cache.set(url, load(url).catch((e) => { cache.delete(url); throw e; }));
  return cache.get(url)!;
}

async function load(url: string): Promise<GeoJSON.FeatureCollection> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const features: Feature[] = [];
  for await (const f of geojson.deserialize(new Uint8Array(await res.arrayBuffer()))) {
    const g = f.geometry as any;
    features.push({ ...f, geometry: { ...g, coordinates: unproject(g.coordinates) } } as Feature);
  }
  return { type: 'FeatureCollection', features };
}

// A polygon's edges (outer ring and holes), bucketed by latitude band: a point is tested against the edges at its latitude only.
// Even-odd over all the rings is "in the outer ring and in no hole". Brute force over every ring froze the page:
// 2.3 s for the bullfrog (35k points, 30k vertices), minutes for the robin (760k points, 2374 lake holes).
type Box = [number, number, number, number];
type Poly = { box: Box; dy: number; bands: number[][] };
const grow = (box: Box, x: number, y: number) => { box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y); };
const indexPoly = (rings: number[][][]): Poly => {
  const box: Box = [Infinity, Infinity, -Infinity, -Infinity];
  let verts = 0;
  for (const ring of rings) { verts += ring.length; for (const [x, y] of ring) grow(box, x, y); }
  const n = Math.max(1, Math.min(4096, verts >> 2));
  const dy = (box[3] - box[1]) / n || 1;
  const bands: number[][] = Array.from({ length: n }, () => []);
  const band = (y: number) => Math.min(n - 1, Math.floor((y - box[1]) / dy));
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      for (let b = band(Math.min(yi, yj)), last = band(Math.max(yi, yj)); b <= last; b++) bands[b].push(xi, yi, xj, yj);
    }
  }
  return { box, dy, bands };
};
const inPoly = ({ box, dy, bands }: Poly, x: number, y: number) => {
  if (x < box[0] || x > box[2] || y < box[1] || y > box[3]) return false;
  const e = bands[Math.min(bands.length - 1, Math.floor((y - box[1]) / dy))];
  let inside = false;
  for (let k = 0; k < e.length; k += 4) {
    const xi = e[k], yi = e[k + 1], xj = e[k + 2], yj = e[k + 3];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

// Sets properties.inside on each point: is it within the range polygons (holes respected)?
// Done once here because MapLibre's `within` re-evaluates per tile and stalls on 90k-vertex ranges.
export function markInsideRange(points: GeoJSON.FeatureCollection, range: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection {
  const polys: Poly[] = [];
  const all: Box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const f of range.features) {
    const g = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    for (const poly of g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []) {
      const p = indexPoly(poly);
      polys.push(p); grow(all, p.box[0], p.box[1]); grow(all, p.box[2], p.box[3]);
    }
  }
  const hit = (x: number, y: number) => x >= all[0] && x <= all[2] && y >= all[1] && y <= all[3] && polys.some((p) => inPoly(p, x, y));
  return {
    ...points,
    features: points.features.map((f) => {
      const [x, y] = (f.geometry as GeoJSON.Point).coordinates;
      // Range rings may be unwrapped past ±180, so try the point's wrapped copies too
      return { ...f, properties: { ...f.properties, inside: hit(x, y) || hit(x + 360, y) || hit(x - 360, y) } };
    }),
  };
}
