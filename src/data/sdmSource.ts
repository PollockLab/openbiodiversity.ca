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

// Light-to-dark project ramp (cream to plum to charcoal), fading to clear below 10% so the relief shows through where the species is not; [from %, r, g, b, alpha]
// Ramps to compare for the proposal, picked with #sdm-explorer?ramp=. Stops sampled from published perceptual maps (Crameri acton, cmocean dense, matplotlib magma), light to dark
const RAMPS: Record<string, [number, number, number][]> = {
  // The project's own palette: lightness falls evenly, 8 to 10 L* per step
  project: [[248, 236, 223], [237, 210, 190], [219, 183, 177], [191, 159, 173], [162, 137, 160], [132, 113, 138], [103, 91, 114], [75, 71, 89], [53, 54, 59]],
  plum: [[237, 231, 245], [218, 205, 235], [194, 174, 221], [167, 141, 204], [140, 108, 186], [113, 77, 166], [88, 50, 143], [66, 28, 118], [45, 12, 90]],
  // acton with its greyish mid stops pushed 35% further from grey so flat lowland reads as colour, not mud
  acton: [[234, 214, 235], [226, 180, 209], [228, 128, 176], [211, 92, 147], [159, 89, 146], [115, 91, 148], [80, 72, 133], [62, 47, 95], [38, 12, 63]],
  dense: [[196, 224, 230], [152, 199, 226], [121, 170, 228], [115, 137, 225], [120, 101, 203], [119, 69, 168], [107, 41, 123], [86, 22, 76], [54, 14, 36]],
  magma: [[253, 216, 154], [253, 162, 111], [245, 106, 91], [212, 67, 109], [164, 48, 125], [118, 33, 129], [71, 15, 119], [24, 15, 63], [0, 0, 3]],
};
const RAMP = RAMPS[new URLSearchParams(window.location.hash.split('?')[1]).get('ramp') ?? ''] ?? RAMPS.project;
// Below 10% is clear, then alpha rises with suitability so weak cells fade into the relief
const ALPHA = [90, 120, 140, 160, 175, 190, 200, 210, 220];
export const SUIT_RAMP: [number, number, number, number, number][] = RAMP.map(([r, g, b], i) => [10 + 10 * i, r, g, b, ALPHA[i]]);
const SUIT_COLORMAP = JSON.stringify(SUIT_RAMP.map(([lo, ...rgba], i) => [[lo, SUIT_RAMP[i + 1]?.[0] ?? 100], rgba]));
// Byte 0..99 suitability %, nodata 255
export const sdmTileUrl = (cogUrl: string, classic = false) =>
  `${TITILER_BASE}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${encodeURIComponent(cogUrl)}&${classic ? 'colormap_name=viridis&rescale=0,99' : `colormap=${encodeURIComponent(SUIT_COLORMAP)}`}&nodata=255`;

export const sdmPointUrl = (cogUrl: string, lon: number, lat: number) =>
  `${TITILER_BASE}/point/${lon},${lat}?url=${encodeURIComponent(cogUrl)}`;

// Expert range, one file per species; the bucket rejects Range preflights, so fetch it whole
export const sdmRangeUrl = (slug: string) => `${ARBUTUS_BASE}/${slug}_iucn-range_NA_na_NA_NA.fgb`;

// Other expert ranges drawn beside it for comparison: USGS GAP 2018 (contiguous US) and NatureServe Canada EBAR; only slugs listed in public/sdm-expert-ranges.json have a file
export const sdmGapUrl = (slug: string) => `${ARBUTUS_BASE}/expert-ranges/${slug}_usgs-gap-range_NA_NA_2018-08.fgb`;
export const sdmEbarUrl = (slug: string) => `${ARBUTUS_BASE}/expert-ranges/${slug}_ebar-range_NA_NA_2026-03.fgb`;

// Protected area outlines for Canada and the US (CEC North American Protected Areas 2025), one LAEA file built by scripts/sdm-protected-areas.py
export const protectedAreasUrl = `${ARBUTUS_BASE}/protected-areas/cec-protected-areas_CA-US_2025.fgb`;

// GBIF records used to fit and clip the model, snapped to the 1 km grid; no date or other attributes
export const sdmOccurrenceUrl = (slug: string) => `${ARBUTUS_BASE}/${slug}_gbif-occurrence-points-filtered_NA_na_NA_NA.fgb`;

// Zones precomputed by scripts/sdm-zones.py for one evidence span ('2016-2025'): a uint8 COG of category codes and its stats
export const sdmZonesUrl = (slug: string, span: string, ext: 'tif' | 'json') => `${ARBUTUS_BASE}/${slug}_sdm-zones_1km_na_${span}.${ext}`;
