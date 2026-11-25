const ARBUTUS_BASE = 'https://object-arbutus.alliancecan.ca/swift/v1/4903c6264e0c4191a74a54c93b6fe1d9/def-pollock-eckert/vertebrates_NA/ECCC_2026';
// Biodiversité Québec's titiler: reprojects the bucket's LAEA COGs on the fly, so no Web Mercator copies are needed
export const TITILER_BASE = 'https://tiler2.biodiversite-quebec.ca/cog';

export type SdmPeriod = 'current' | 'current-model' | '2100';

// Only 1980-2010 has a clipped product; 'current-model' is its unclipped twin, the like-for-like match for 2100
const SDM_FILES: Record<SdmPeriod, string> = {
  current: 'sdm-ensemble-clipped_1km_na_1980-2010',
  'current-model': 'sdm-ensemble_1km_na_1980-2010',
  '2100': 'sdm-ensemble_1km_na_2071-2100',
};

export const sdmCogUrl = (slug: string, period: SdmPeriod = 'current') =>
  `${ARBUTUS_BASE}/${slug}_${SDM_FILES[period]}_sett1.tif`;

// Light-to-dark plum, fading to clear below 10% so the relief shows through where the species is not; [from %, r, g, b, alpha]
export const SUIT_RAMP: [number, number, number, number, number][] = [
  [10, 237, 231, 245, 60], [20, 218, 205, 235, 100], [30, 194, 174, 221, 130], [40, 167, 141, 204, 160], [50, 140, 108, 186, 175],
  [60, 113, 77, 166, 190], [70, 88, 50, 143, 200], [80, 66, 28, 118, 210], [90, 45, 12, 90, 220],
];
const SUIT_COLORMAP = JSON.stringify(SUIT_RAMP.map(([lo, ...rgba], i) => [[lo, SUIT_RAMP[i + 1]?.[0] ?? 100], rgba]));
// Byte 0..99 suitability %, nodata 255
export const sdmTileUrl = (cogUrl: string, classic = false) =>
  `${TITILER_BASE}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${encodeURIComponent(cogUrl)}&${classic ? 'colormap_name=viridis&rescale=0,99' : `colormap=${encodeURIComponent(SUIT_COLORMAP)}`}&nodata=255`;

export const sdmPointUrl = (cogUrl: string, lon: number, lat: number) =>
  `${TITILER_BASE}/point/${lon},${lat}?url=${encodeURIComponent(cogUrl)}`;

// Expert range, one file per species; the bucket rejects Range preflights, so fetch it whole
export const sdmRangeUrl = (slug: string) => `${ARBUTUS_BASE}/${slug}_iucn-range_NA_na_NA_NA.fgb`;

// GBIF records used to fit and clip the model, snapped to the 1 km grid; no date or other attributes
export const sdmOccurrenceUrl = (slug: string) => `${ARBUTUS_BASE}/${slug}_gbif-occurrence-points-filtered_NA_na_NA_NA.fgb`;
