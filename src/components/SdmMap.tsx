import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Maximize2, Minimize2, Plus, Minus } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getGreyStyle } from './BaseMap';
import { sdmCogUrl, sdmTileUrl, sdmPointUrl, sdmRangeUrl, sdmOccurrenceUrl, SdmPeriod } from '../data/sdmSource';
import { useLanguage } from '../lib/LanguageContext';

const SRC = 'sdm-source';
const LAYER = 'sdm-layer';
// The models are fit with a ~500 km buffer south of the US border; only Canada and the US are shown. Fill matches the basemap land; a sea-colored coastal band hides raster pixels past the Natural Earth coast.
const MASK = 'outside-ca-us-mask';
const RANGE = 'iucn-range';
const OCC = 'gbif-occurrences';
const OCC_IN = '#ffffff';
const OCC_OUT = '#991b1b';
const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
// Keep in sync with the sidebar widths in SdmSidebar (w-72, sm:w-[310px], md:w-[350px])
const sidebarWidth = () => (window.innerWidth >= 768 ? 350 : window.innerWidth >= 640 ? 310 : 288);
// Left offset of the overlay controls so they clear the open sidebar
const LEFT_OPEN = 'left-3 sm:left-[322px] md:left-[362px]';
const LEFT_CLOSED = 'left-13 sm:left-14';

interface SdmMapProps {
  slug?: string;
  period: SdmPeriod;
  onPeriodChange: (p: SdmPeriod) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isSidebarOpen: boolean;
}

export default function SdmMap({ slug, period, onPeriodChange, isExpanded, onToggleExpand, isSidebarOpen }: SdmMapProps) {
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
  const sidebarRef = useRef(isSidebarOpen);
  sidebarRef.current = isSidebarOpen;

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
    map.setPadding({ left: sidebarRef.current ? sidebarWidth() : 0, top: 0, right: 0, bottom: 0 });
    map.on('load', () => {
      map.addSource(MASK, { type: 'geojson', data: `${import.meta.env.BASE_URL}outside-ca-us.geojson` });
      map.addLayer({ id: MASK, type: 'fill', source: MASK, paint: { 'fill-color': ['match', ['get', 'id'], 'sea', '#d2d7d9', '#fbfaf8'] } });
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

  // Resize with the container (expand mode) and re-center in the space the sidebar leaves free
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => mapRef.current?.resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    mapRef.current?.easeTo({ padding: { left: isSidebarOpen ? sidebarWidth() : 0, top: 0, right: 0, bottom: 0 }, duration: 350 });
  }, [isSidebarOpen]);

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
    <div className="relative w-full h-full min-h-[480px] overflow-hidden bg-[#e8eae8]">
      <div ref={containerRef} className="w-full h-full" />
      <div className={`absolute top-3 ${isSidebarOpen ? LEFT_OPEN : LEFT_CLOSED} right-16 flex flex-wrap gap-2 text-xs font-sans z-10 transition-all duration-300`}>
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
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 items-center">
        <button type="button" onClick={onToggleExpand} aria-pressed={isExpanded}
          title={isExpanded ? (lang === 'EN' ? 'Exit expanded view (Esc)' : 'Quitter le mode plein écran (Échap)') : (lang === 'EN' ? 'Expand viewer' : 'Agrandir le visualiseur')}
          aria-label={isExpanded ? (lang === 'EN' ? 'Exit expanded view' : 'Quitter le mode plein écran') : (lang === 'EN' ? 'Expand viewer' : 'Agrandir le visualiseur')}
          className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white shadow-md border border-gray-200 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-sage-500">
          {isExpanded ? <Minimize2 className="w-4 h-4 text-sage-700" /> : <Maximize2 className="w-4 h-4 text-sage-700" />}
        </button>
        <div className="flex flex-col rounded-lg bg-white/95 shadow-md border border-gray-200 overflow-hidden divide-y divide-gray-200">
          {([[Plus, () => mapRef.current?.zoomIn(), lang === 'EN' ? 'Zoom in' : 'Zoom avant'], [Minus, () => mapRef.current?.zoomOut(), lang === 'EN' ? 'Zoom out' : 'Zoom arrière']] as const).map(([Icon, fn, label]) => (
            <button key={label} type="button" onClick={fn} title={label} aria-label={label}
              className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-50 cursor-pointer">
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
      {period === '2100' && (
        <p className={`absolute top-12 ${isSidebarOpen ? LEFT_OPEN : LEFT_CLOSED} max-w-xs bg-white/90 rounded-lg px-3 py-2 text-xs font-sans text-gray-700 shadow-sm pointer-events-none z-10 transition-all duration-300`}>
          {lang === 'EN'
            ? 'Not clipped to the known range, unlike the current map. Suitability outside today\'s range may not be a range gain.'
            : "Contrairement à la carte actuelle, non découpée selon l'aire connue. La convenance hors de l'aire actuelle n'est pas forcément un gain d'aire."}
        </p>
      )}
      <div className="absolute bottom-7 right-3 bg-white/95 rounded-xl px-3 py-2 text-[10px] font-mono text-gray-600 shadow-lg border border-gray-200 pointer-events-none z-10">
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
                {([[OCC_IN, lang === 'EN' ? 'Records inside IUCN range' : "Observations dans l'aire UICN"], [OCC_OUT, lang === 'EN' ? 'Records outside IUCN range' : "Observations hors de l'aire UICN"]] as const).map(([c, label]) => (
                  <div key={c} className="flex items-center gap-2 mt-1">
                    <span className="inline-block w-6 text-center"><span className="inline-block w-1.5 h-1.5 rounded-full border border-gray-800" style={{ background: c }} /></span>
                    <span>{label}</span>
                  </div>
                ))}
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
