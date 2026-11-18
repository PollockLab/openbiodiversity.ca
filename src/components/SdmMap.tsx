import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Maximize2, Minimize2, Plus, Minus } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getGreyStyle } from './BaseMap';
import { sdmCogUrl, sdmTileUrl, sdmPointUrl, sdmRangeUrl, sdmOccurrenceUrl, SdmPeriod } from '../data/sdmSource';
import { useLanguage } from '../lib/LanguageContext';
import { CATEGORIES, Category, Evidence, hex, registerCategoryProtocol, SUITABLE } from '../data/sdmCategories';
import Timeline from './SdmTimeline';
import { fetchCells, evidenceCells, evidenceKey, classifyNew, spanSet, NewStats, Span, FIRST_YEAR, LAST_YEAR } from '../data/sdmTemporal';

const SRC = 'sdm-source';
const LAYER = 'sdm-layer';
// The models are fit with a ~500 km buffer south of the US border; only Canada and the US are shown. Fill matches the basemap land; a sea-colored coastal band hides raster pixels past the Natural Earth coast.
const MASK = 'outside-ca-us-mask';
const RANGE = 'iucn-range';
const OCC = 'gbif-occurrences';
const NEW = 'new-records';
const OCC_IN = '#ffffff';
const OCC_OUT = '#991b1b';
const CAT_LABELS: Record<Category, [string, string]> = {
  expected: ['Expected', 'Attendu'], frontier: ['Frontier', 'Frontière'], 'climate-risk': ['Climate risk', 'Risque climatique'], 'newly-suitable': ['Newly suitable', 'Nouvellement favorable'],
};
const EVIDENCE_LABELS: Record<Evidence, [string, string]> = { none: ['None', 'Aucune'], medium: ['Medium', 'Moyenne'], high: ['High', 'Élevée'] };
const YEARS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);
const sciName = (slug: string) => slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
export type View = 'suitability' | 'categories';
const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
type Box = [number, number, number, number];
// A map position in the link, as zoom/lat/lng
export const parseAt = (at: string | null) => {
  const m = /^(\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/.exec(at ?? '');
  if (!m) return null;
  const [zoom, lat, lng] = m.slice(1).map(Number);
  return zoom <= 22 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { center: [lng, lat] as [number, number], zoom } : null;
};
// Extent of the rasters, and the view that shows all of it
const DATA_BOUNDS: Box = [-180, 24.4, -52.6, 83.2];
const FULL_VIEW = { center: [-96, 58] as [number, number], zoom: 2.6 };
// Box around the range, widened by half its size on each side so a shift by 2100 stays in view, and clamped to the rasters
const rangeBounds = (fc: GeoJSON.FeatureCollection): Box | null => {
  const b: Box = [Infinity, Infinity, -Infinity, -Infinity];
  const walk = (c: any) => {
    if (typeof c[0] !== 'number') return c.forEach(walk);
    // Eastern longitudes are the Aleutians past the antimeridian; keep them west of Alaska, not a map-width away
    const x = c[0] > 0 ? c[0] - 360 : c[0];
    b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], c[1]);
  };
  fc.features.forEach((f) => walk((f.geometry as any).coordinates));
  const dx = (b[2] - b[0]) / 2, dy = (b[3] - b[1]) / 2;
  const box: Box = [Math.max(b[0] - dx, DATA_BOUNDS[0]), Math.max(b[1] - dy, DATA_BOUNDS[1]), Math.min(b[2] + dx, DATA_BOUNDS[2]), Math.min(b[3] + dy, DATA_BOUNDS[3])];
  return box[0] < box[2] && box[1] < box[3] ? box : null;
};
// Keep in sync with the sidebar widths in SdmSidebar (w-72, sm:w-[310px], md:w-[350px])
const sidebarWidth = () => (window.innerWidth >= 768 ? 350 : window.innerWidth >= 640 ? 310 : 288);
// Map padding for the open sidebar. On a phone the sidebar covers almost all of the map, so the view is laid out as if it were closed
const sidebarPadding = (open: boolean, mapWidth: number) => ({ left: open && mapWidth - sidebarWidth() >= 320 ? sidebarWidth() : 0, top: 0, right: 0, bottom: 0 });
// Left offset of the overlay controls so they clear the open sidebar
const LEFT_OPEN = 'left-3 sm:left-[322px] md:left-[362px]';
const LEFT_CLOSED = 'left-13 sm:left-14';

interface SdmMapProps {
  slug?: string;
  period: SdmPeriod;
  onPeriodChange: (p: SdmPeriod) => void;
  showOcc: boolean;
  onToggleOcc: () => void;
  // Categories view: its evidence level, and the GBIF evidence period in inclusive years
  view: View;
  onViewChange: (v: View) => void;
  evidence: Evidence;
  onEvidenceChange: (e: Evidence) => void;
  span: Span;
  onSpanChange: (s: Span) => void;
  // Position the user chose, zoom/lat/lng; while it is set the map does not zoom to the species
  at: string | null;
  onMoved: (at: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isSidebarOpen: boolean;
}

export default function SdmMap({ slug, period, onPeriodChange, showOcc, onToggleOcc, view, onViewChange, evidence, onEvidenceChange, span, onSpanChange, at, onMoved, isExpanded, onToggleExpand, isSidebarOpen }: SdmMapProps) {
  const { lang } = useLanguage();
  const [newStats, setNewStats] = useState<NewStats | null>(null);
  const [from, to] = span;
  const spanKey = spanSet(span);
  const [yearly, setYearly] = useState<Record<number, NewStats> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [occBusy, setOccBusy] = useState(false);
  const slugRef = useRef(slug);
  const periodRef = useRef(period);
  const langRef = useRef(lang);
  slugRef.current = slug;
  periodRef.current = period;
  langRef.current = lang;
  const atRef = useRef(at);
  const onMovedRef = useRef(onMoved);
  atRef.current = at;
  onMovedRef.current = onMoved;
  const sidebarRef = useRef(isSidebarOpen);
  sidebarRef.current = isSidebarOpen;

  useEffect(() => {
    if (!containerRef.current) return;
    registerCategoryProtocol();
    const isRetina = window.devicePixelRatio >= 2;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: { ...getGreyStyle(isRetina), projection: { type: 'mercator' } },
      ...(parseAt(atRef.current) ?? FULL_VIEW),
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.setPadding(sidebarPadding(sidebarRef.current, containerRef.current.clientWidth));
    map.on('load', () => {
      map.addSource(RANGE, { type: 'geojson', data: EMPTY });
      map.addLayer({ id: RANGE, type: 'line', source: RANGE, paint: { 'line-color': '#e8590c', 'line-width': 1.5, 'line-opacity': 0.9 } });
      // Mask over the range outline so it stops at the border like the raster; records sit on top and are filtered instead, since the mask would cut circles in half
      map.addSource(MASK, { type: 'geojson', data: `${import.meta.env.BASE_URL}outside-ca-us.geojson` });
      map.addLayer({ id: MASK, type: 'fill', source: MASK, paint: { 'fill-color': ['match', ['get', 'id'], 'sea', '#d2d7d9', '#fbfaf8'] } });
      map.addSource(OCC, { type: 'geojson', data: EMPTY });
      map.addSource(NEW, { type: 'geojson', data: EMPTY });
      map.addLayer({ id: NEW, type: 'circle', source: NEW, paint: {
        // Records below the suitability threshold are hollow grey rings: kept visible as model misses, but recessive
        'circle-radius': ['case', ['==', ['get', 'category'], 'unsuitable'], 2, ['get', 'discovery'], 4.5, 3],
        'circle-color': ['match', ['get', 'category'], 'expected', hex('expected'), 'frontier', hex('frontier'), 'climate-risk', hex('climate-risk'), 'newly-suitable', hex('newly-suitable'), '#9ca3af'],
        'circle-opacity': ['case', ['==', ['get', 'category'], 'unsuitable'], 0, 1],
        'circle-stroke-color': ['case', ['==', ['get', 'category'], 'unsuitable'], '#6b7280', ['get', 'discovery'], '#111827', '#ffffff'],
        'circle-stroke-width': ['case', ['==', ['get', 'category'], 'unsuitable'], 1, ['get', 'discovery'], 1.5, 0.8] } });
      map.addLayer({ id: OCC, type: 'circle', source: OCC, paint: { 'circle-radius': ['case', ['has', 'evidence'], 2, 2.5], 'circle-color': ['case', ['==', ['get', 'inside'], false], OCC_OUT, OCC_IN], 'circle-stroke-color': '#374151', 'circle-stroke-width': 0.5, 'circle-stroke-opacity': ['case', ['has', 'evidence'], 0.35, 1] } });
      map.moveLayer(OCC, NEW); // evidence under the new records
    });

    // Only moves the user made go in the link, not the fit to a species, a resize or the sidebar
    const moved = () => {
      const c = map.getCenter();
      onMovedRef.current(`${map.getZoom().toFixed(1)}/${c.lat.toFixed(3)}/${c.lng.toFixed(3)}`);
    };
    map.on('moveend', (e: any) => { if (e.originalEvent || e.user) moved(); });
    // A shift-drag box zoom ends with a moveend that does not carry the user's event
    map.on('boxzoomend', moved);

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
    const ro = new ResizeObserver(() => {
      mapRef.current?.resize();
      mapRef.current?.setPadding(sidebarPadding(sidebarRef.current, el.clientWidth));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    mapRef.current?.easeTo({ padding: sidebarPadding(isSidebarOpen, containerRef.current?.clientWidth ?? 0), duration: 350 });
  }, [isSidebarOpen]);

  // Swap the raster when the species changes, without re-creating the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let live = true;
    const apply = async () => {
      if (map.getLayer(LAYER)) map.removeLayer(LAYER);
      if (map.getSource(SRC)) map.removeSource(SRC);
      if (!slug) return;
      const cats = view === 'categories';
      if (cats) evidenceKey(slug, await fetchCells(sciName(slug)), span);
      if (!live || map.getSource(SRC)) return;
      // Category tiles are composed client-side from two COGs, so cap their zoom (512 px z7 ≈ 600 m pixels at 45°N) and let MapLibre overzoom
      map.addSource(SRC, { type: 'raster', tiles: [cats ? `sdmcat://${slug}/${evidence}/${spanKey}/{z}/{x}/{y}` : sdmTileUrl(sdmCogUrl(slug, period))], tileSize: cats ? 512 : 256, bounds: DATA_BOUNDS, ...(cats ? { maxzoom: 7 } : {}) });
      map.addLayer({ id: LAYER, type: 'raster', source: SRC, paint: { 'raster-opacity': cats ? 1 : 0.85 } }, map.getLayer(RANGE) ? RANGE : undefined);
    };
    if (map.isStyleLoaded()) apply(); else map.once('load', apply);
    return () => { live = false; map.off('load', apply); };
  }, [slug, period, view, evidence, spanKey]);

  // Records added after the training download, coloured by the category of the cell they land in
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let live = true;
    setNewStats(null);
    const apply = async () => {
      const src = map.getSource(NEW) as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      src.setData(EMPTY);
      if (!slug || view !== 'categories') return;
      let features: GeoJSON.Feature[] = [], stats: NewStats = { total: 0, discovery: 0, byCat: {} };
      if (span[1] < LAST_YEAR) ({ features, stats } = await classifyNew(slug, await fetchCells(sciName(slug)), span, [span[1] + 1, LAST_YEAR]));
      if (!live || mapRef.current !== map) return;
      src.setData({ type: 'FeatureCollection', features });
      setNewStats(stats);
    };
    if (map.getSource(NEW)) apply().catch((e) => console.warn('New GBIF records unavailable', e)); else map.once('load', apply);
    return () => { live = false; map.off('load', apply); };
  }, [slug, view, spanKey]);

  // Per-year new cells by category, sliding a period of the chosen length: evidence from the N years before Y, then what Y added
  const len = to - from + 1;
  useEffect(() => {
    setYearly(null);
    if (!slug || view !== 'categories') return;
    let live = true;
    fetchCells(sciName(slug)).then(async (cells) => {
      const out: Record<number, NewStats> = {};
      for (const y of YEARS) out[y] = (await classifyNew(slug, cells, [y - len, y - 1], [y, y])).stats;
      if (live) setYearly(out);
    }).catch((e) => console.warn('GBIF yearly records unavailable', e));
    return () => { live = false; };
  }, [slug, view, len]);

  // IUCN outline is period-independent: reload on species change only. The map zooms to it here and nowhere else, so the view holds still when the period, clip or records change. A position the user chose (at) is kept instead
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const src = map.getSource(RANGE) as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      src.setData(EMPTY);
      if (!slug) return;
      const current = () => mapRef.current === map && slugRef.current === slug;
      // flatgeobuf + proj4 load lazily so they stay out of the main bundle
      import('../data/sdmRange').then((m) => m.fetchLaeaFgb(sdmRangeUrl(slug))).then((fc) => {
        if (!current()) return;
        src.setData(fc);
        if (atRef.current) return;
        const box = rangeBounds(fc);
        if (box) map.fitBounds(box, { maxZoom: 7 }); else map.easeTo(FULL_VIEW);
      }).catch((e) => { console.warn('IUCN range unavailable', e); if (current() && !atRef.current) map.easeTo(FULL_VIEW); });
    };
    if (map.getSource(RANGE)) apply(); else map.once('load', apply);
    return () => { map.off('load', apply); };
  }, [slug]);

  // Occurrences load only while the toggle is on
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // A worker per load: leaving the species or the toggle stops the download and frees the records
    let worker: Worker | undefined;
    let blobUrl = '';
    let live = true;
    const apply = () => {
      const src = map.getSource(OCC) as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      src.setData(EMPTY);
      const windowed = view === 'categories' ? span : null;
      if (!slug || !(showOcc || windowed)) return;
      // In the categories view, show the evidence records (white dots): the same points the fade and frontier are computed from
      if (windowed) {
        import('../data/sdmRange').then(async (m) => {
          const cells = evidenceCells(await fetchCells(sciName(slug)), windowed);
          const mask: GeoJSON.FeatureCollection = await (await fetch(`${import.meta.env.BASE_URL}outside-ca-us.geojson`)).json();
          const all: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: cells.map((c) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [c.lon, c.lat] }, properties: { evidence: true } })) };
          // Points over the sea mask are dropped; the rest carry no `inside`, so they draw white
          return { ...all, features: m.markInsideRange(all, mask).features.filter((f) => !f.properties?.inside).map((f) => ({ ...f, properties: { evidence: true } })) };
        }).then((fc) => { if (live && mapRef.current === map) src.setData(fc); })
          .catch((e) => console.warn('GBIF evidence records unavailable', e));
        return;
      }
      setOccBusy(true);
      worker = new Worker(new URL('../data/sdmOccWorker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }: MessageEvent<Blob | string>) => {
        setOccBusy(false);
        if (typeof data === 'string') return console.warn('GBIF occurrences unavailable', data);
        if (mapRef.current === map) src.setData(blobUrl = URL.createObjectURL(data));
      };
      worker.onerror = (e) => { setOccBusy(false); console.warn('GBIF occurrences unavailable', e.message); };
      worker.postMessage({ occUrl: sdmOccurrenceUrl(slug), rangeUrl: sdmRangeUrl(slug), maskUrl: new URL(`${import.meta.env.BASE_URL}outside-ca-us.geojson`, location.href).href });
    };
    if (map.getSource(OCC)) apply(); else map.once('load', apply);
    return () => { live = false; worker?.terminate(); URL.revokeObjectURL(blobUrl); setOccBusy(false); map.off('load', apply); };
  }, [slug, showOcc, view, spanKey]);

  return (
    <div className="relative w-full h-full min-h-[480px] overflow-hidden bg-[#e8eae8]">
      <div ref={containerRef} className="w-full h-full" />
      <div className={`absolute top-3 ${isSidebarOpen ? LEFT_OPEN : LEFT_CLOSED} right-16 flex flex-wrap gap-2 text-xs font-sans z-10 transition-all duration-300`}>
      <div className="flex rounded-lg overflow-hidden shadow-sm border border-gray-200">
        {([['current', lang === 'EN' ? 'Current (1980-2010)' : 'Actuel (1980-2010)'], ['2100', lang === 'EN' ? '2100 projection (2071-2100)' : 'Projection 2100 (2071-2100)']] as const).map(([k, label]) => {
          const on = view === 'suitability' && (period === '2100') === (k === '2100');
          // Leaving 2100 keeps the clip off, so the two periods compare like with like
          return (
            <button key={k} onClick={() => { onViewChange('suitability'); on || onPeriodChange(k === '2100' ? '2100' : 'current-model'); }} aria-pressed={on}
              className={`px-3 py-1.5 cursor-pointer ${on ? 'bg-sage-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {label}
            </button>
          );
        })}
        {slug && (
          <button onClick={() => onViewChange('categories')} aria-pressed={view === 'categories'}
            className={`px-3 py-1.5 cursor-pointer ${view === 'categories' ? 'bg-sage-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            {lang === 'EN' ? 'Categories (prototype)' : 'Catégories (prototype)'}
          </button>
        )}
      </div>
      {view === 'suitability' && (
      <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 bg-white ${period === '2100' ? 'text-gray-400' : 'text-gray-600 cursor-pointer'}`}>
        <input type="checkbox" className="accent-sage-500" checked={period === 'current'} disabled={period === '2100'}
          onChange={e => onPeriodChange(e.target.checked ? 'current' : 'current-model')} />
        {lang === 'EN' ? 'Clip to known range' : "Découper selon l'aire connue"}
        {period === '2100' && (lang === 'EN' ? ' (no clipped version for 2100)' : ' (pas de version découpée pour 2100)')}
      </label>
      )}
      {slug && view === 'categories' && (
        <div className="flex items-center rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white" role="group" aria-label={lang === 'EN' ? 'Evidence' : 'Preuves'}>
          <span className="px-2 text-gray-500">{lang === 'EN' ? 'Evidence' : 'Preuves'}</span>
          {(['none', 'medium', 'high'] as const).map((e) => (
            <button key={e} onClick={() => onEvidenceChange(e)} aria-pressed={evidence === e}
              className={`px-2.5 py-1.5 cursor-pointer ${evidence === e ? 'bg-sage-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {EVIDENCE_LABELS[e][lang === 'EN' ? 0 : 1]}
            </button>
          ))}
        </div>
      )}
      {slug && view === 'categories' && (
        <div className="flex items-center gap-1.5 rounded-lg shadow-sm border border-gray-200 bg-white px-2 py-1 text-gray-500">
          {lang === 'EN' ? 'Evidence' : 'Preuves'}
          <Timeline from={from} to={to} onChange={onSpanChange} lang={lang} />
        </div>
      )}
      {slug && !(view === 'categories') && (
        <button onClick={onToggleOcc} aria-pressed={showOcc} aria-busy={occBusy}
          className={`px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 cursor-pointer ${occBusy ? 'animate-pulse ' : ''}${showOcc ? 'bg-sage-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
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
          {([[Plus, () => mapRef.current?.zoomIn({}, { user: true }), lang === 'EN' ? 'Zoom in' : 'Zoom avant'], [Minus, () => mapRef.current?.zoomOut({}, { user: true }), lang === 'EN' ? 'Zoom out' : 'Zoom arrière']] as const).map(([Icon, fn, label]) => (
            <button key={label} type="button" onClick={fn} title={label} aria-label={label}
              className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-50 cursor-pointer">
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
      <div className={`absolute bottom-3 ${isSidebarOpen ? LEFT_OPEN : 'left-3'} max-w-[calc(100%-240px)] bg-white/90 rounded-lg px-3 py-1.5 text-[11px] font-sans text-gray-600 shadow-sm border border-gray-200 z-10 transition-all duration-300 flex items-center gap-1.5 flex-wrap`}>
        <span>{lang === 'EN' ? 'Models: Pollock Lab, licensed under ' : 'Modèles : Laboratoire Pollock, sous licence '}</span>
        <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer license" className="underline text-sage-700 hover:text-sage-900 font-medium">CC BY-NC 4.0</a>
      </div>
      {view === 'categories' && slug && (
        <p className={`absolute top-24 ${isSidebarOpen ? LEFT_OPEN : LEFT_CLOSED} max-w-xs bg-amber-50/95 border border-amber-300 rounded-lg px-3 py-2 text-xs font-sans text-amber-900 shadow-sm pointer-events-none z-10 transition-all duration-300`}>
          {lang === 'EN'
            ? 'Prototype for discussion. Thresholds are provisional and the categories are not peer reviewed; do not use for decisions.'
            : "Prototype à des fins de discussion. Les seuils sont provisoires et les catégories n'ont pas été évaluées par des pairs; ne pas utiliser pour prendre des décisions."}
        </p>
      )}
      <div className="absolute bottom-7 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2.5 text-[11px] font-sans text-gray-700 shadow-lg border border-gray-200 pointer-events-none z-10 max-w-[210px] sm:max-w-xs">
        {view === 'categories' && slug ? (
          <>
            {newStats && <div className="text-right text-[9px] text-gray-400">{lang === 'EN' ? 'new records / ringed (>10 km)' : 'nouvelles / cerclées (>10 km)'}</div>}
            <div className="mb-1 text-gray-600 font-semibold">{lang === 'EN' ? `Categories, 1980-2010 vs 2071-2100, suitable ≥ ${SUITABLE}%` : `Catégories, 1980-2010 c. 2071-2100, favorable ≥ ${SUITABLE} %`}</div>
            {CATEGORIES.map((c) => {
              const row = newStats?.byCat[c];
              return (
                <div key={c} className="flex items-center gap-2 mt-0.5 text-[10px]">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ background: hex(c) }} />
                  <span className="flex-1">{CAT_LABELS[c][lang === 'EN' ? 0 : 1]}</span>
                  {newStats && <span className="tabular-nums text-gray-500">{row?.[0] ?? 0} / {row?.[1] ?? 0}</span>}
                </div>
              );
            })}
            {(
              <div className="mt-1 pt-1 border-t border-gray-100 text-[10px] text-gray-600">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-white border border-gray-600 mr-1" />
                {lang === 'EN'
                  ? `White: records ${from}–${to}. Coloured: records since ${to + 1} where none existed, coloured by the category they fell in; ringed = over 10 km from any white dot. ${newStats?.byCat.unsuitable?.[0] ?? 0} of ${newStats?.total ?? 0} fell below ${SUITABLE}% suitability (hollow grey).`
                  : `Blanc : mentions ${from}–${to}. Couleur : mentions depuis ${to + 1} là où il n'y en avait pas, selon la catégorie où elles tombent; cerclé = à plus de 10 km d'un point blanc. ${newStats?.byCat.unsuitable?.[0] ?? 0} sur ${newStats?.total ?? 0} sous ${SUITABLE} % de convenance (cercle gris vide).`}
              </div>
            )}
            {yearly && (
              <div className="mt-1 pt-1 border-t border-gray-100 text-[10px] text-gray-500 pointer-events-auto">
                <div>{lang === 'EN' ? `Where each year's new records landed (%, against the ${len} years before)` : `Où tombent les nouvelles mentions de chaque année (%, c. les ${len} années précédentes)`}</div>
                <div className="flex items-end gap-px h-12 mt-1">
                  {YEARS.map((y) => {
                    const st = yearly[y], max = Math.max(1, st.total);
                    return (
                      <button key={y} type="button" onClick={() => onSpanChange([y - len, y - 1])} title={`${y}: ${st.total} new`} aria-label={`${y}: ${st.total} new`}
                        className={`flex-1 flex flex-col-reverse h-full cursor-pointer ${y > to ? 'outline outline-1 outline-gray-700' : ''}`}>
                        {[...CATEGORIES, 'unsuitable'].map((c) => (
                          <span key={c} style={{ height: `${(st.byCat[c]?.[0] ?? 0) / max * 100}%`, background: c === 'unsuitable' ? '#d1d5db' : hex(c as Category) }} />
                        ))}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between tabular-nums"><span>{FIRST_YEAR}</span><span>{lang === 'EN' ? 'each bar = 100%; outlined = test period' : 'chaque barre = 100 %; encadré = période test'}</span><span>{LAST_YEAR}</span></div>
              </div>
            )}
            <div className="mt-1 pt-1 border-t border-gray-100 text-[10px] text-gray-500">
              {lang === 'EN' ? 'Evidence sets transparency only; categories never change. Medium: full inside the IUCN range, fading to faint over 100 km outside it. High: also fades with distance from the evidence records (20 km).' : "Les preuves ne règlent que la transparence; les catégories ne changent pas. Moyenne : pleine dans l'aire UICN, s'estompe sur 100 km au-delà. Élevée : s'estompe aussi avec la distance aux mentions (20 km)."}
            </div>
          </>
        ) : (<>
        <div className="mb-1 text-gray-600 font-semibold">{period === 'current'
          ? (lang === 'EN' ? 'Ensemble (clipped to the known range), 1980-2010, 1 km' : 'Ensemble (découpé selon l\'aire connue), 1980-2010, 1 km')
          : (lang === 'EN' ? `Ensemble, ${period === '2100' ? '2071-2100' : '1980-2010'}, 1 km (model only, not clipped)` : `Ensemble, ${period === '2100' ? '2071-2100' : '1980-2010'}, 1 km (modèle seul, non découpé)`)}</div>
        {slug && (
          <>
            <div className="h-2 w-40 rounded-sm" style={{ background: 'linear-gradient(to right, #440154, #3b528b, #21918c, #5ec962, #fde725)' }} />
            <div className="flex justify-between w-40 mt-0.5 text-gray-500 text-[10px]">
              <span>0</span>
              <span>{lang === 'EN' ? 'Suitability (%)' : 'Convenance (%)'}</span>
              <span>100</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 pt-1 border-t border-gray-100 text-[10px]">
              <span className="inline-block w-5 border-t-2" style={{ borderColor: '#e8590c' }} />
              <span>{lang === 'EN' ? 'IUCN range' : 'Aire de répartition UICN'}</span>
            </div>
            {showOcc && (
              <>
                {([[OCC_IN, lang === 'EN' ? 'Records inside IUCN range' : "Observations dans l'aire UICN"], [OCC_OUT, lang === 'EN' ? 'Records outside IUCN range' : "Observations hors de l'aire UICN"]] as const).map(([c, label]) => (
                  <div key={c} className="flex items-center gap-2 mt-1 text-[10px]">
                    <span className="inline-block w-5 text-center"><span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: c, border: '0.5px solid #374151' }} /></span>
                    <span>{label}</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
        </>)}
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
