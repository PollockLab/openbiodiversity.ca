import { BASIS, taxonKey } from './sdmTemporal';

export type GbifRecord = { key: number; date?: string; basis?: string; who?: string; photo?: string; src?: string };
export type RecordList = { total: number; records: GbifRecord[] };

// Individual GBIF records of one place and period, fetched once per (species, box, years) and shared by the hover prefetch and the click
const cache = new Map<string, Promise<RecordList>>();
export function fetchRecords(sci: string, box: [number, number, number, number], years: [number, number] | null, limit = 20): Promise<RecordList> {
  const k = `${sci}|${box.join()}|${years?.join('-')}`;
  if (!cache.has(k)) cache.set(k, load(sci, box, years, limit).catch((e) => { cache.delete(k); throw e; }));
  return cache.get(k)!;
}

async function load(sci: string, [w, s, e, n]: [number, number, number, number], years: [number, number] | null, limit: number): Promise<RecordList> {
  const key = await taxonKey(sci);
  if (key == null) return { total: 0, records: [] };
  const q = `taxonKey=${key}&decimalLatitude=${s},${n}&decimalLongitude=${w},${e}&hasCoordinate=true${years ? `&year=${years[0]},${years[1]}` : ''}${BASIS.map((b) => `&basisOfRecord=${b}`).join('')}&limit=${limit}`;
  const res = await fetch(`https://api.gbif.org/v1/occurrence/search?${q}`);
  if (!res.ok) throw new Error(`GBIF occurrence search ${res.status}`);
  const page = await res.json();
  return {
    total: page.count ?? 0,
    records: (page.results ?? []).map((r: any) => ({ key: r.key, date: r.eventDate, basis: r.basisOfRecord, who: r.datasetName || r.recordedBy, photo: (r.media ?? []).map((m: any) => m.identifier).find((u: unknown) => typeof u === 'string' && /^https:\/\//.test(u))?.replace(/\/original\.(\w+)$/, '/small.$1'), src: /^https:\/\//.test(r.references ?? '') ? r.references : undefined })),
  };
}
