import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getGreyStyle } from './BaseMap';
import { sdmCogUrl, sdmTileUrl, sdmPointUrl, sdmRangeUrl, sdmOccurrenceUrl, SdmPeriod } from '../data/sdmSource';
import { useLanguage } from '../lib/LanguageContext';

const SRC = 'sdm-source';
const LAYER = 'sdm-layer';
// The models are fit with a ~500 km buffer into Mexico; only Canada and the US are shown. Fill matches the basemap land.
const MASK = 'mexico-mask';
const RANGE = 'iucn-range';
const OCC = 'gbif-occurrences';
const OCC_IN = '#ffffff';
const OCC_OUT = '#e64980';
const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

export default function SdmMap({ slug, period, onPeriodChange }: { slug?: string; period: SdmPeriod; onPeriodChange: (p: SdmPeriod) => void }) {
  const { lang } = useLanguage();
  const [showOcc, setShowOcc] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const slugRef = useRef(slug);
  const periodRef = useRef(period);
  const langRef = useRef(lang);
  slugRef.current = slug;
  periodRef.current = period;
  langRef.current = lang;

  useEffect(() => {
    if (!containerRef.current) return;
    const isRetina = window.devicePixelRatio >= 2;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: { ...getGreyStyle(isRetina), projection: { type: 'mercator' } },
      center: [-96, 58],
      zoom: 2.6,
      attributionControl: { compact: true, customAttribution: 'SDMs: Pollock Lab, <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener">CC BY-NC 4.0</a>' },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => {
      map.addSource(MASK, { type: 'geojson', data: `${import.meta.env.BASE_URL}mexico.geojson` });
      map.addLayer({ id: MASK, type: 'fill', source: MASK, paint: { 'fill-color': '#fbfaf8' } });
      map.addSource(RANGE, { type: 'geojson', data: EMPTY });
      map.addLayer({ id: RANGE, type: 'line', source: RANGE, paint: { 'line-color': '#e8590c', 'line-width': 1.5, 'line-opacity': 0.9 } });
      map.addSource(OCC, { type: 'geojson', data: EMPTY });
      map.addLayer({ id: OCC, type: 'circle', source: OCC, paint: { 'circle-radius': 2.5, 'circle-color': ['case', ['==', ['get', 'inside'], false], OCC_OUT, OCC_IN], 'circle-stroke-color': '#1f2937', 'circle-stroke-width': 1 } });
    });

    map.on('click', async (e) => {
      const s = slugRef.current;
      if (!s) return;
      const fr = langRef.current === 'FR';
      let text = fr ? 'Aucune prédiction' : 'No prediction';
      if (!map.queryRenderedFeatures(e.point, { layers: [MASK] }).length) try {
        const res = await fetch(sdmPointUrl(sdmCogUrl(s, periodRef.current), e.lngLat.lng, e.lngLat.lat));
        if (res.ok) {
          const v = (await res.json()).values?.[0];
          if (typeof v === 'number' && v >= 0 && v <= 99) text = `${fr ? 'Convenance' : 'Suitability'}: ${v}%`;
        } // non-ok (e.g. outside dataset bounds) falls through to "No prediction"
      } catch { /* network failure: keep "No prediction" */ }
      if (mapRef.current !== map) return;
      new maplibregl.Popup({ closeButton: false }).setLngLat(e.lngLat).setText(text).addTo(map);
    });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Swap the raster when the species changes, without re-creating the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (map.getLayer(LAYER)) map.removeLayer(LAYER);
      if (map.getSource(SRC)) map.removeSource(SRC);
      if (!slug) return;
      map.addSource(SRC, { type: 'raster', tiles: [sdmTileUrl(sdmCogUrl(slug, period))], tileSize: 256, bounds: [-180, 24.4, -52.6, 83.2] });
      map.addLayer({ id: LAYER, type: 'raster', source: SRC, paint: { 'raster-opacity': 0.85 } }, map.getLayer(MASK) ? MASK : undefined);
    };
    if (map.isStyleLoaded()) apply(); else map.once('load', apply);
    return () => { map.off('load', apply); };
  }, [slug, period]);

  // IUCN outline is period-independent: reload on species change only
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const src = map.getSource(RANGE) as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      src.setData(EMPTY);
      if (!slug) return;
      // flatgeobuf + proj4 load lazily so they stay out of the main bundle
      import('../data/sdmRange').then((m) => m.fetchLaeaFgb(sdmRangeUrl(slug))).then((fc) => { if (mapRef.current === map && slugRef.current === slug) src.setData(fc); })
        .catch((e) => console.warn('IUCN range unavailable', e));
    };
    if (map.getSource(RANGE)) apply(); else map.once('load', apply);
    return () => { map.off('load', apply); };
  }, [slug]);

  // Occurrences load only while the toggle is on
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let live = true;
    const apply = () => {
      const src = map.getSource(OCC) as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      src.setData(EMPTY);
      if (!slug || !showOcc) return;
      // Records outside the expert range are what widen the clip; without a range, points stay uncolored
      import('../data/sdmRange').then(async (m) => {
        const points = await m.fetchLaeaFgb(sdmOccurrenceUrl(slug));
        const range = await m.fetchLaeaFgb(sdmRangeUrl(slug)).catch(() => null);
        return range ? m.markInsideRange(points, range) : points;
      }).then((fc) => { if (live && mapRef.current === map) src.setData(fc); })
        .catch((e) => console.warn('GBIF occurrences unavailable', e));
    };
    if (map.getSource(OCC)) apply(); else map.once('load', apply);
    return () => { live = false; map.off('load', apply); };
  }, [slug, showOcc]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden card-shadow border border-gray-100">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 right-14 flex flex-wrap gap-2 text-xs font-sans">
      <div className="flex rounded-lg overflow-hidden shadow-sm border border-gray-200">
        {([['current', lang === 'EN' ? 'Current (1980-2010)' : 'Actuel (1980-2010)'], ['2100', lang === 'EN' ? '2100 projection (2071-2100)' : 'Projection 2100 (2071-2100)']] as const).map(([k, label]) => (
          <button key={k} onClick={() => onPeriodChange(k)} aria-pressed={period === k}
            className={`px-3 py-1.5 cursor-pointer ${period === k ? 'bg-sage-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>
      {slug && (
        <button onClick={() => setShowOcc(v => !v)} aria-pressed={showOcc}
          className={`px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 cursor-pointer ${showOcc ? 'bg-sage-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
          {lang === 'EN' ? 'GBIF records' : 'Mentions GBIF'}
        </button>
      )}
      </div>
      {period === '2100' && (
        <p className="absolute top-12 left-3 max-w-xs bg-white/90 rounded-lg px-3 py-2 text-xs font-sans text-gray-700 shadow-sm pointer-events-none">
          {lang === 'EN'
            ? 'Not clipped to the known range, unlike the current map. Suitability outside today\'s range may not be a range gain.'
            : "Contrairement à la carte actuelle, non découpée selon l'aire connue. La convenance hors de l'aire actuelle n'est pas forcément un gain d'aire."}
        </p>
      )}
      <div className="absolute bottom-6 left-3 bg-white/90 rounded-lg px-3 py-2 text-[10px] font-mono text-gray-600 shadow-sm pointer-events-none">
        <div className="mb-1">{period === '2100'
          ? (lang === 'EN' ? 'Ensemble, 2071-2100, 1 km (unclipped)' : 'Ensemble, 2071-2100, 1 km (non découpé)')
          : (lang === 'EN' ? 'Ensemble (clipped), 1980-2010, 1 km' : 'Ensemble (découpé), 1980-2010, 1 km')}</div>
        {slug && (
          <>
            <div className="h-2 w-40 rounded-sm" style={{ background: 'linear-gradient(to right, #440154, #3b528b, #21918c, #5ec962, #fde725)' }} />
            <div className="flex justify-between w-40 mt-0.5">
              <span>0</span>
              <span>{lang === 'EN' ? 'Suitability (%)' : 'Convenance (%)'}</span>
              <span>100</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block w-6 border-t" style={{ borderColor: '#e8590c' }} />
              <span>{lang === 'EN' ? 'IUCN range' : 'Aire de répartition UICN'}</span>
            </div>
            {showOcc && (
              <>
                {([[OCC_IN, lang === 'EN' ? 'GBIF record inside IUCN range' : "Mention GBIF dans l'aire UICN"], [OCC_OUT, lang === 'EN' ? 'GBIF record outside it (widens the clip)' : 'Mention GBIF hors aire (élargit le découpage)']] as const).map(([c, label]) => (
                  <div key={c} className="flex items-center gap-2 mt-1">
                    <span className="inline-block w-6 text-center"><span className="inline-block w-1.5 h-1.5 rounded-full border border-gray-800" style={{ background: c }} /></span>
                    <span>{label}</span>
                  </div>
                ))}
                <div className="mt-1 text-gray-400">{lang === 'EN' ? 'Records of any year, 1 km grid' : 'Mentions de toutes années, grille de 1 km'}</div>
              </>
            )}
          </>
        )}
      </div>
      {!slug && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 pointer-events-none">
          <p className="bg-white px-4 py-2 rounded-lg shadow text-sm text-wood-900 font-sans">
            {lang === 'EN' ? 'No ECCC_2026 model available for this species yet' : "Aucun modèle ECCC_2026 n'est encore disponible pour cette espèce"}
          </p>
        </div>
      )}
    </div>
  );
}
