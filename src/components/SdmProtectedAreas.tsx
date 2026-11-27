import React, { useEffect, useState } from 'react';
import type maplibregl from 'maplibre-gl';
import { protectedAreasUrl } from '../data/sdmSource';
import { checkbox } from './SdmControls';

const PA = 'protected-areas';
const PA_FILL = '#15803d';
const CREDIT = '<a href="https://www.cec.org/north-american-environmental-atlas/north-american-protected-areas-2025/" target="_blank" rel="noopener noreferrer">Protected areas: CEC 2025</a>, CC BY 4.0';

// Called once from the map's load handler, before the CA/US mask goes in; the source stays empty until the toggle is first switched on
export function addProtectedAreasLayer(map: maplibregl.Map) {
  map.addSource(PA, { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, attribution: CREDIT });
  map.addLayer({ id: PA, type: 'fill', source: PA, layout: { visibility: 'none' }, paint: { 'fill-color': PA_FILL, 'fill-opacity': 0.25 } });
}

export function useProtectedAreas(mapRef: React.RefObject<maplibregl.Map | null>, show: boolean) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = async () => {
      map.setLayoutProperty(PA, 'visibility', show ? 'visible' : 'none');
      if (!show) return;
      setBusy(true);
      try {
        // fetchLaeaFgb memoizes, so the file downloads once however often the toggle flips
        const { fetchLaeaFgb } = await import('../data/sdmRange');
        (map.getSource(PA) as maplibregl.GeoJSONSource).setData(await fetchLaeaFgb(protectedAreasUrl));
      } catch (e) { console.warn('Protected areas unavailable', e); }
      setBusy(false);
    };
    if (map.getLayer(PA)) apply(); else map.once('load', apply);
    return () => { map.off('load', apply); };
  }, [show]);
  return busy;
}

const t = (lang: string, a: string, b: string) => (lang === 'EN' ? a : b);

export const ProtectedAreasToggle = ({ lang, show, onToggle, busy }: { lang: string; show: boolean; onToggle: () => void; busy: boolean }) =>
  checkbox(onToggle, show, t(lang, 'Protected areas', 'Aires protégées'), { title: t(lang, 'Protected areas of 10 km² or more in Canada and the US, from the CEC North American Environmental Atlas, 2025', 'Aires protégées de 10 km² ou plus au Canada et aux États-Unis, selon l\'Atlas environnemental de l\'Amérique du Nord de la CCE, 2025') }, busy);

export const ProtectedAreasLegend = ({ lang, show }: { lang: string; show: boolean }) => !show ? null : (
  <div className="flex items-center gap-2 mt-1 text-xs">
    <span className="inline-block w-5 h-3" style={{ background: PA_FILL, opacity: 0.25 }} />
    <span>{t(lang, 'Protected areas of 10 km² or more (CEC 2025)', 'Aires protégées de 10 km² ou plus (CCE 2025)')}</span>
  </div>
);
