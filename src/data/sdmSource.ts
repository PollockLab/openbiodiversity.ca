const ARBUTUS_BASE = 'https://object-arbutus.alliancecan.ca/swift/v1/4903c6264e0c4191a74a54c93b6fe1d9/def-pollock-eckert/vertebrates_NA/ECCC_2026';
// Biodiversité Québec's titiler: reprojects the bucket's LAEA COGs on the fly, so no Web Mercator copies are needed
export const TITILER_BASE = 'https://tiler2.biodiversite-quebec.ca/cog';

export type SdmPeriod = 'current' | 'current-model' | '2100' | '2100-clipped';

// 'current-model' is the unclipped twin of 'current'; '2100-clipped' is uploaded per species, so probe it with hasClipped2100
const SDM_FILES: Record<SdmPeriod, string> = {
  current: 'sdm-ensemble-clipped_1km_na_1980-2010',
  'current-model': 'sdm-ensemble_1km_na_1980-2010',
  '2100': 'sdm-ensemble_1km_na_2071-2100',
  '2100-clipped': 'sdm-ensemble-clipped_1km_na_2071-2100',
};

export const sdmCogUrl = (slug: string, period: SdmPeriod = 'current') =>
  `${ARBUTUS_BASE}/${slug}_${SDM_FILES[period]}_sett1.tif`;

// One plain HEAD per species (no Range or custom headers, so no preflight); a 404 or a network error means not uploaded yet
const clippedProbe = new Map<string, Promise<boolean>>();
export const hasClipped2100 = (slug: string) => {
  let p = clippedProbe.get(slug);
  if (!p) clippedProbe.set(slug, p = fetch(sdmCogUrl(slug, '2100-clipped'), { method: 'HEAD' }).then(r => r.ok, () => false));
  return p;
};

// Byte 0..99 suitability %, nodata 255
export const sdmTileUrl = (cogUrl: string) =>
  `${TITILER_BASE}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${encodeURIComponent(cogUrl)}&colormap_name=viridis&rescale=0,99&nodata=255`;

export const sdmPointUrl = (cogUrl: string, lon: number, lat: number) =>
  `${TITILER_BASE}/point/${lon},${lat}?url=${encodeURIComponent(cogUrl)}`;

// Expert range, one file per species; the bucket rejects Range preflights, so fetch it whole
export const sdmRangeUrl = (slug: string) => `${ARBUTUS_BASE}/${slug}_iucn-range_NA_na_NA_NA.fgb`;

// GBIF records used to fit and clip the model, snapped to the 1 km grid; no date or other attributes
export const sdmOccurrenceUrl = (slug: string) => `${ARBUTUS_BASE}/${slug}_gbif-occurrence-points-filtered_NA_na_NA_NA.fgb`;
