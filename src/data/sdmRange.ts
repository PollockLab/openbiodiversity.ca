import { geojson } from 'flatgeobuf';
import proj4 from 'proj4';
import { sdmRangeUrl } from './sdmSource';
import type { Feature } from 'geojson';

// The range files are in LAEA (lat_0=45, lon_0=-100, WGS84), MapLibre needs lon/lat
const fromLaea = proj4('+proj=laea +lat_0=45 +lon_0=-100 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs', 'EPSG:4326');
// Rings crossing the antimeridian are unwrapped (lon past 180) so no segment spans the whole map
const unproject = (c: any): any => {
  if (typeof c[0][0] !== 'number') return c.map(unproject);
  let off = 0, prev = 0;
  return c.map((p: [number, number], i: number) => {
    const [lon, lat] = fromLaea.forward(p);
    if (i && Math.abs(lon + off - prev) > 180) off += lon + off < prev ? 360 : -360;
    return [prev = lon + off, lat];
  });
};

export async function fetchSdmRange(slug: string): Promise<GeoJSON.FeatureCollection> {
  const res = await fetch(sdmRangeUrl(slug));
  if (!res.ok) throw new Error(`range ${res.status}`);
  const features: Feature[] = [];
  for await (const f of geojson.deserialize(new Uint8Array(await res.arrayBuffer()))) {
    const g = f.geometry as any;
    features.push({ ...f, geometry: { ...g, coordinates: unproject(g.coordinates) } } as Feature);
  }
  return { type: 'FeatureCollection', features };
}
