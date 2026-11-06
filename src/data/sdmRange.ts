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

type Ring = { pts: number[][]; box: [number, number, number, number] };
const inRing = ({ pts, box }: Ring, x: number, y: number) => {
  if (x < box[0] || x > box[2] || y < box[1] || y > box[3]) return false;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

// Sets properties.inside on each point: is it within the range polygons (holes respected)?
// Done once here because MapLibre's `within` re-evaluates per tile and stalls on 90k-vertex ranges.
// shortcut: brute-force ray cast takes ~1 s on the main thread for caribou (4k points, 90k vertices), move to a worker or grid index if larger species lag.
export function markInsideRange(points: GeoJSON.FeatureCollection, range: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection {
  const polys: Ring[][] = [];
  for (const f of range.features) {
    const g = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    for (const poly of g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []) {
      polys.push(poly.map((pts) => {
        const box: Ring['box'] = [Infinity, Infinity, -Infinity, -Infinity];
        for (const [x, y] of pts) { box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y); }
        return { pts, box };
      }));
    }
  }
  const hit = (x: number, y: number) => polys.some(([outer, ...holes]) => inRing(outer, x, y) && !holes.some((h) => inRing(h, x, y)));
  return {
    ...points,
    features: points.features.map((f) => {
      const [x, y] = (f.geometry as GeoJSON.Point).coordinates;
      // Range rings may be unwrapped past ±180, so try the point's wrapped copies too
      return { ...f, properties: { ...f.properties, inside: hit(x, y) || hit(x + 360, y) || hit(x - 360, y) } };
    }),
  };
}
