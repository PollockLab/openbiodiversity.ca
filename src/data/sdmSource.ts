const ARBUTUS_BASE = 'https://object-arbutus.alliancecan.ca/swift/v1/4903c6264e0c4191a74a54c93b6fe1d9/def-pollock-eckert/vertebrates_NA/ECCC_2026';
// shortcut: titiler.xyz is Development Seed's public demo instance (no SLA) and the pre-CORS bridge; target is EPSG:3857 GoogleMapsCompatible display COGs read client-side with @geomatico/maplibre-cog-protocol once the bucket has CORS.
const TITILER_BASE = 'https://titiler.xyz/cog';

export type SdmPeriod = 'current' | '2100';

// No clipped product exists for the future period
export const sdmCogUrl = (slug: string, period: SdmPeriod = 'current') =>
  period === '2100'
    ? `${ARBUTUS_BASE}/${slug}_sdm-ensemble_1km_na_2071-2100_sett1.tif`
    : `${ARBUTUS_BASE}/${slug}_sdm-ensemble-clipped_1km_na_1980-2010_sett1.tif`;

// Byte 0..99 suitability %, nodata 255
export const sdmTileUrl = (cogUrl: string) =>
  `${TITILER_BASE}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${encodeURIComponent(cogUrl)}&colormap_name=viridis&rescale=0,99&nodata=255`;

export const sdmPointUrl = (cogUrl: string, lon: number, lat: number) =>
  `${TITILER_BASE}/point/${lon},${lat}?url=${encodeURIComponent(cogUrl)}`;
