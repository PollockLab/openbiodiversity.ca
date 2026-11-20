import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Maximize2, Minimize2, Plus, Minus } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getGreyStyle } from './BaseMap';
import { sdmCogUrl, sdmTileUrl, sdmPointUrl, sdmRangeUrl, sdmOccurrenceUrl, SdmPeriod } from '../data/sdmSource';
import { useLanguage } from '../lib/LanguageContext';
import { CATEGORIES, Category, categoryAt, hex, registerCategoryProtocol, thresholdOf } from '../data/sdmCategories';
import SdmControls, { CAT_TIPS } from './SdmControls';
import { bindRecordPopups, nearestDot } from './sdmPopup';
import { fetchCells, evidenceCells, evidenceKey, classifyNew, zoneShares, spanSet, Span, LAST_YEAR } from '../data/sdmTemporal';

const SRC = 'sdm-source';
const LAYER = 'sdm-layer';
// The models are fit with a ~500 km buffer south of the US border; only Canada and the US are shown. Fill matches the basemap land; a sea-colored coastal band hides raster pixels past the Natural Earth coast.
const MASK = 'outside-ca-us-mask';
const RANGE = 'iucn-range';
const OCC = 'gbif-occurrences';
const OBS = 'gbif-by-year';
const NEW = 'new-records';
const OCC_IN = '#ffffff';
const OCC_OUT = '#991b1b';
const CAT_LABELS: Record<Category, [string, string]> = {
  confirmed: ['Stronghold', 'Bastion'], 'in-range': ['Blind spot', 'Angle mort'], 'range-gap': ['Horizon, recorded', 'Horizon, observé'], frontier: ['Horizon', 'Horizon'], 'climate-risk': ['Losing ground', 'En recul'], 'newly-suitable': ['Arrival zone', "Terre d'accueil"],
};
const UNSUITABLE = '#b9b0a0';
// Laura draws records outside the range as a branch of Frontier (Horizon), so it is listed under it, indented
const LEGEND_ORDER: Category[] = ['confirmed', 'in-range', 'frontier', 'range-gap', 'climate-risk', 'newly-suitable'];
// Dots take the colour of the zone they fall in
const ZONE_COLOR = ['match', ['get', 'category'], ...CATEGORIES.flatMap((c) => [c, hex(c)]), UNSUITABLE] as unknown as maplibregl.ExpressionSpecification;
// One thin stacked bar: how something (area, new cells) splits across the zones
type Parts = [string, string, number][];
const strip = (parts: Parts, sum: number) => sum > 0 && parts.map(([name, color, n]) => <span key={name} style={{ width: `${100 * n / sum}%`, background: color }} />);
// `whole`: the same split for the whole map, drawn as a thin strip under the bar so a zoomed-in view keeps its reference
const Bar = ({ label, parts, whole, wholeLabel }: { label: string; parts: Parts; whole?: Parts; wholeLabel?: string }) => {
  const total = (v: Parts) => v.reduce((a, p) => a + p[2], 0), sum = total(parts);
  const say = (v: Parts) => v.filter((p) => p[2]).map((p) => `${p[0]} ${Math.round(100 * p[2] / total(v))}%`).join(', ');
  const text = whole ? `${say(parts) || '–'} | ${wholeLabel}: ${say(whole)}` : say(parts);
  return (
    <div className="mt-1 text-[10px] pointer-events-auto" title={text}>
      <div className="text-gray-600">{label}</div>
      <div className="flex h-2 rounded-sm overflow-hidden bg-gray-100" role="img" aria-label={`${label}: ${text}`}>
        {strip(parts, sum)}
      </div>
      {whole && <div className="flex h-1 mt-px rounded-sm overflow-hidden bg-gray-100 opacity-70" aria-hidden>{strip(whole, total(whole))}</div>}
    </div>
  );
};
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
  // GBIF records by year: the dated GBIF cells in the timeline's span (and, in categories, the new records)
  showObs: boolean;
  onToggleObs: () => void;
  // Zones view: the GBIF evidence period in inclusive years
  view: View;
  onViewChange: (v: View) => void;
  span: Span;
  onSpanChange: (s: Span) => void;
  // Position the user chose, zoom/lat/lng; while it is set the map does not zoom to the species
  at: string | null;
  onMoved: (at: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isSidebarOpen: boolean;
}

export default function SdmMap({ slug, period, onPeriodChange, showOcc, onToggleOcc, showObs, onToggleObs, view, onViewChange, span, onSpanChange, at, onMoved, isExpanded, onToggleExpand, isSidebarOpen }: SdmMapProps) {
  const { lang } = useLanguage();
  const [from, to] = span;
  const spanKey = spanSet(span);
  // A popup describes the species, view, years and language it was opened in: close it when any of them changes
  const closePopups = useRef(() => {});
  useEffect(() => closePopups.current(), [slug, view, period, spanKey, lang]);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [occBusy, setOccBusy] = useState(false);
  const [zoneStats, setZoneStats] = useState<{ thr: number; cells: Awaited<ReturnType<typeof fetchCells>>; features: GeoJSON.Feature[] } | null>(null);
  // The legend bars describe what is on screen: the map's bounds [west, south, east, north] after each move
  const [box, setBox] = useState<number[] | null>(null);
  const [tipOf, setTipOf] = useState<Category | null>(null);
  const [inView, setInView] = useState<{ area: number[]; whole: number[]; share: number } | null>(null);
  const slugRef = useRef(slug);
  const periodRef = useRef(period);
  const langRef = useRef(lang);
  slugRef.current = slug;
  periodRef.current = period;
  const zoneRef = useRef<Span | null>(null);
  zoneRef.current = view === 'categories' ? span : null;
  langRef.current = lang;
  const atRef = useRef(at);
  const onMovedRef = useRef(onMoved);
  atRef.current = at;
  onMovedRef.current = onMoved;
  const showObsRef = useRef(showObs);
  showObsRef.current = showObs;
  const popupRef = useRef({ slug, span, lang });
  popupRef.current = { slug, span, lang };
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
      map.addSource(OBS, { type: 'geojson', data: EMPTY });
      map.addLayer({ id: NEW, type: 'circle', source: NEW, layout: { visibility: showObsRef.current ? 'visible' : 'none' }, paint: {
        // Records below the suitability threshold are hollow grey rings: kept visible as model misses, but recessive
        'circle-radius': ['case', ['==', ['get', 'category'], 'unsuitable'], 2, ['get', 'discovery'], 4.5, 3],
        'circle-color': ZONE_COLOR,
        'circle-opacity': ['case', ['==', ['get', 'category'], 'unsuitable'], 0, 1],
        'circle-stroke-color': ['case', ['==', ['get', 'category'], 'unsuitable'], '#6b7280', ['get', 'discovery'], '#111827', '#ffffff'],
        'circle-stroke-width': ['case', ['==', ['get', 'category'], 'unsuitable'], 1, ['get', 'discovery'], 1.5, 0.8] } });
      map.addLayer({ id: OCC, type: 'circle', source: OCC, paint: { 'circle-radius': ['case', ['has', 'evidence'], 2, 2.5], 'circle-color': ['case', ['==', ['get', 'inside'], false], OCC_OUT, OCC_IN], 'circle-stroke-color': '#374151', 'circle-stroke-width': 0.5, 'circle-stroke-opacity': ['case', ['has', 'evidence'], 0.35, 1] } });
      map.addLayer({ id: OBS, type: 'circle', source: OBS, paint: { 'circle-radius': 2.5, 'circle-color': ['case', ['has', 'test'], '#f59e0b', ['has', 'category'], ZONE_COLOR, OCC_IN], 'circle-stroke-color': ['case', ['has', 'category'], '#ffffff', '#374151'], 'circle-stroke-width': ['case', ['has', 'category'], 0.8, 0.5] } });
      map.moveLayer(OBS, NEW); // dated records under the new ones
    });

    // Only moves the user made go in the link, not the fit to a species, a resize or the sidebar
    const moved = () => {
      const c = map.getCenter();
      onMovedRef.current(`${map.getZoom().toFixed(1)}/${c.lat.toFixed(3)}/${c.lng.toFixed(3)}`);
    };
    map.on('moveend', (e: any) => { if (e.originalEvent || e.user) moved(); });
    map.on('moveend', () => setBox(map.getBounds().toArray().flat()));
    // A shift-drag box zoom ends with a moveend that does not carry the user's event
    map.on('boxzoomend', moved);

    // Clicking a GBIF dot opens its records instead (sdmPopup)
    const unbind = bindRecordPopups(map, { new: NEW, evidence: OBS, test: OBS, training: OCC }, () => {
      const { slug: s, span: sp, lang: l } = popupRef.current;
      return { slug: s, sci: sciName(s ?? ''), fr: l === 'FR', span: sp, label: (c) => CAT_LABELS[c as Category]?.[l === 'EN' ? 0 : 1] ?? c };
    });
    let spot: maplibregl.Popup | null = null;
    closePopups.current = () => { unbind(); spot?.remove(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') spot?.remove(); };
    window.addEventListener('keydown', esc);
    map.on('click', async (e) => {
      const s = slugRef.current;
      if (!s || nearestDot(map, e.point, [NEW, OBS, OCC])) return;
      const fr = langRef.current === 'FR';
      let text = fr ? 'Aucune prédiction' : 'No prediction', tip = '', colour = '';
      const zoneSpan = zoneRef.current;
      if (zoneSpan) {
        // The zones compare two periods, so name the zone instead of one period's suitability
        const c = await categoryAt(s, e.lngLat.lng, e.lngLat.lat, evidenceKey(s, await fetchCells(sciName(s)).catch(() => []), zoneSpan), 7).catch(() => undefined); // z7: the pixels the map draws
        text = c ? CAT_LABELS[c][fr ? 1 : 0] : c === undefined ? (fr ? 'Aucune prédiction ici' : 'No prediction here') : fr ? "Hors d'atteinte : non favorable aux deux périodes" : 'Out of reach: unsuitable in both periods';
        if (c) { tip = CAT_TIPS[c][fr ? 1 : 0]; colour = hex(c); }
      } else if (!map.queryRenderedFeatures(e.point, { layers: [MASK] }).length) try {
        const res = await fetch(sdmPointUrl(sdmCogUrl(s, periodRef.current), e.lngLat.lng, e.lngLat.lat));
        if (res.ok) {
          const v = (await res.json()).values?.[0];
          if (typeof v === 'number' && v >= 0 && v <= 99) text = `${fr ? 'Convenance' : 'Suitability'}: ${v}%`;
        } // non-ok (e.g. outside dataset bounds) falls through to "No prediction"
      } catch { /* network failure: keep "No prediction" */ }
      if (mapRef.current !== map) return;
      // One small card at a time; it closes on its button, on Escape, on a click elsewhere and when the map moves
      const card = document.createElement('div');
      const head = card.appendChild(document.createElement('strong'));
      if (colour) head.appendChild(Object.assign(document.createElement('i'), { style: `display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;background:${colour}` }));
      head.append(text);
      if (tip) card.appendChild(document.createElement('div')).textContent = tip;
      spot?.remove();
      spot = new maplibregl.Popup({ closeOnMove: true, className: 'sdm-spot', maxWidth: '240px' }).setLngLat(e.lngLat).setDOMContent(card).addTo(map);
    });

    return () => { window.removeEventListener('keydown', esc); unbind(); map.remove(); mapRef.current = null; };
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
      // Zones still draw when GBIF is down: without records nothing is Confirmed
      if (cats) evidenceKey(slug, await fetchCells(sciName(slug)).catch(() => []), span);
      if (!live || map.getSource(SRC)) return;
      // Category tiles are composed client-side from two COGs, so cap their zoom (512 px z7 ≈ 600 m pixels at 45°N) and let MapLibre overzoom
      map.addSource(SRC, { type: 'raster', tiles: [cats ? `sdmcat://${slug}/${spanKey}/{z}/{x}/{y}` : sdmTileUrl(sdmCogUrl(slug, period))], tileSize: cats ? 512 : 256, bounds: DATA_BOUNDS, ...(cats ? { maxzoom: 7 } : {}) });
      map.addLayer({ id: LAYER, type: 'raster', source: SRC, paint: { 'raster-opacity': cats ? 0.75 : 0.85, 'raster-resampling': cats ? 'nearest' : 'linear' } }, map.getLayer(RANGE) ? RANGE : undefined);
    };
    if (map.getSource(RANGE)) apply(); else map.once('load', apply); // not isStyleLoaded(): it is false while any tile loads, and 'load' fires once
    return () => { live = false; map.off('load', apply); };
  }, [slug, period, view, spanKey]);

  // Records added after the evidence period, coloured by the zone they land in, and the zone shares for the legend bars
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let live = true;
    const apply = async () => {
      const src = map.getSource(NEW) as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      src.setData(EMPTY);
      setZoneStats(null);
      if (!slug || view !== 'categories') return;
      const cells = await fetchCells(sciName(slug)).catch(() => []);
      const fresh = span[1] < LAST_YEAR ? await classifyNew(slug, cells, span, [span[1] + 1, LAST_YEAR]) : undefined;
      if (!live || mapRef.current !== map) return;
      src.setData({ type: 'FeatureCollection', features: fresh?.features ?? [] });
      const thr = await thresholdOf(slug);
      if (live) setZoneStats({ thr, cells, features: fresh?.features ?? [] });
    };
    if (map.getSource(NEW)) apply().catch((e) => console.warn('New GBIF records unavailable', e)); else map.once('load', apply);
    return () => { live = false; map.off('load', apply); };
  }, [slug, view, spanKey]);
  useEffect(() => {
    setInView(null);
    if (!zoneStats || !slug) return;
    let live = true;
    zoneShares(slug, zoneStats.cells, span, box).then((v) => { if (live) setInView(v); }).catch(() => {});
    return () => { live = false; };
  }, [zoneStats, box]);

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

  // The model's training records load only while the toggle is on
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
      if (!slug || !showOcc) return;
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
  }, [slug, showOcc]);

  // Dated GBIF cells in the timeline's span (white); in the suitability views the later test-period cells too (amber), in categories those are the coloured new records
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let live = true;
    const apply = () => {
      const src = map.getSource(OBS) as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      src.setData(EMPTY);
      if (!slug || !showObs) return;
      import('../data/sdmRange').then(async (m) => {
        const cells = await fetchCells(sciName(slug)), later: Span = [to + 1, LAST_YEAR];
        const mask: GeoJSON.FeatureCollection = await (await fetch(`${import.meta.env.BASE_URL}outside-ca-us.geojson`)).json();
        const pts = (cs: typeof cells, properties: GeoJSON.GeoJsonProperties): GeoJSON.Feature[] => cs.map((c) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [c.lon, c.lat] }, properties }));
        const test = view === 'categories' ? [] : evidenceCells(cells, later).filter((c) => !evidenceCells([c], span).length);
        const evidence = evidenceCells(cells, span), key = evidenceKey(slug, cells, span);
        // In the zones view the evidence dots take their zone's colour
        const zoned = view === 'categories' ? await Promise.all(evidence.map((c) => categoryAt(slug, c.lon, c.lat, key).catch(() => null))) : [];
        const all: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [...pts(evidence, {}).map((f, i) => (zoned.length ? { ...f, properties: { category: zoned[i] ?? 'unsuitable' } } : f)), ...pts(test, { test: true })] };
        // Points over the sea mask are dropped; markInsideRange flags them `inside`
        return { ...all, features: m.markInsideRange(all, mask).features.filter((f) => !f.properties?.inside).map((f) => ({ ...f, properties: f.properties?.test ? { test: true } : f.properties?.category ? { category: f.properties.category } : {} })) };
      }).then((fc) => { if (live && mapRef.current === map) src.setData(fc); })
        .catch((e) => console.warn('GBIF records by year unavailable', e));
    };
    if (map.getSource(OBS)) apply(); else map.once('load', apply);
    return () => { live = false; map.off('load', apply); };
  }, [slug, showObs, view, spanKey]);
  useEffect(() => {
    const map = mapRef.current;
    if (map?.getLayer(NEW)) map.setLayoutProperty(NEW, 'visibility', showObs ? 'visible' : 'none');
  }, [showObs]);

  return (
    <div className="relative w-full h-full min-h-[480px] overflow-hidden bg-[#e8eae8]">
      <div ref={containerRef} className="w-full h-full" />
      <SdmControls lang={lang} left={isSidebarOpen ? LEFT_OPEN : LEFT_CLOSED} view={view} onViewChange={onViewChange} period={period} onPeriodChange={onPeriodChange} showOcc={showOcc} onToggleOcc={onToggleOcc} occBusy={occBusy} showObs={showObs} onToggleObs={onToggleObs} span={span} onSpanChange={onSpanChange} />
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
      <div className="absolute bottom-7 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2.5 text-[11px] font-sans text-gray-700 shadow-lg border border-gray-200 pointer-events-none z-10 max-w-[210px] sm:max-w-xs">
        {view === 'categories' && slug ? (
          // Collapsed by default at phone width, where the open legend covers the controls
          <details open={window.innerWidth >= 640}>
            <summary className="mb-1 text-gray-600 font-semibold pointer-events-auto cursor-pointer">{lang === 'EN' ? 'Zones, current to future' : 'Zones, actuel à futur'}</summary>
            {/* A row is a button so touch and keyboard users can read the definition that hover gives on desktop; the number is the zone's share of suitable area in view */}
            {LEGEND_ORDER.map((c) => {
              const i = CATEGORIES.indexOf(c), sum = inView ? inView.area.reduce((a, b) => a + b, 0) : 0, share = sum ? inView!.area[i] / sum : null;
              return (
                <div key={c}>
                  <button type="button" onClick={() => setTipOf(tipOf === c ? null : c)} aria-expanded={tipOf === c} title={CAT_TIPS[c][lang === 'EN' ? 0 : 1]} className={`flex w-full items-center gap-2 mt-0.5 text-[10px] text-left pointer-events-auto cursor-help ${c === 'range-gap' ? 'pl-3' : ''}`}>
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ background: hex(c) }} />
                    <span className="flex-1">{CAT_LABELS[c][lang === 'EN' ? 0 : 1]}</span>
                    {share !== null && <span className="tabular-nums text-gray-600">{share > 0 && share < 0.01 ? '<1' : Math.round(100 * share)}%</span>}
                  </button>
                  {tipOf === c && <div className="ml-5 text-[10px] text-gray-600">{CAT_TIPS[c][lang === 'EN' ? 0 : 1]}</div>}
                </div>
              );
            })}
            <div className="flex items-center gap-2 mt-0.5 text-[10px]" title={lang === 'EN' ? 'Unsuitable now and in 2100' : "Non favorable aujourd'hui et en 2100"}>
              <span className="inline-block w-3 h-3 rounded-sm border border-gray-400" />
              <span>{lang === 'EN' ? 'Out of reach (no colour)' : "Hors d'atteinte (sans couleur)"}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[10px]">
              <span className="inline-block w-3 border-t-2" style={{ borderColor: '#e8590c' }} />
              <span>{lang === 'EN' ? 'IUCN range' : 'Aire UICN'}</span>
            </div>
            {!(zoneStats && inView) && <div className="mt-1 text-[10px] text-gray-600" role="status">{lang === 'EN' ? 'Loading zones…' : 'Chargement des zones…'}</div>}
            {zoneStats && inView && (() => {
              const en = lang === 'EN', name = (c: Category) => CAT_LABELS[c][en ? 0 : 1];
              // Nearly everything on screen counts as the whole map, so a snug fit does not read as a partial view
              const whole = !box || inView.share > 0.98;
              const all = zoneStats.features, seen = whole ? all : all.filter((f) => { const [x, y] = (f.geometry as GeoJSON.Point).coordinates; return x >= box[0] && x <= box[2] && y >= box[1] && y <= box[3]; });
              const sets = [seen, seen.filter((f) => f.properties?.discovery)], totals = [all.length, all.filter((f) => f.properties?.discovery).length];
              const split = (fs: GeoJSON.Feature[]): Parts => [...CATEGORIES, 'unsuitable' as const].map((c) => [c === 'unsuitable' ? (en ? 'Out of reach' : "Hors d'atteinte") : name(c), c === 'unsuitable' ? UNSUITABLE : hex(c), fs.filter((f) => f.properties?.category === c).length]);
              const everything = [all, all.filter((f) => f.properties?.discovery)], ref = (v: Parts) => (whole ? {} : { whole: v, wholeLabel: en ? 'whole map' : 'toute la carte' });
              const n = (i: 0 | 1) => (whole ? `${totals[i]}` : en ? `${sets[i].length} of ${totals[i]}` : `${sets[i].length} sur ${totals[i]}`);
              const pct = inView.share < 0.01 ? '<1' : `${Math.round(100 * inView.share)}`;
              return (
                <div className="mt-1 pt-1 border-t border-gray-100">
                  <div className="text-[10px] font-medium" role="status">
                    {whole
                      ? <span className="text-gray-600">{en ? 'Bars: whole map' : 'Barres : toute la carte'}</span>
                      : <><span className="rounded px-1 bg-sage-500 text-white">{en ? `This view: ${pct}% of the zoned area` : `Cette vue : ${pct} % de la superficie classée`}</span> <span className="text-gray-600 font-normal">{en ? 'Thin strips: whole map' : 'Bandes minces : toute la carte'}</span></>}
                  </div>
                  {inView.share > 0
                    ? <Bar label={en ? 'Share of suitable area' : 'Part de la superficie favorable'} parts={CATEGORIES.map((c, i) => [name(c), hex(c), inView.area[i]])} {...ref(CATEGORIES.map((c, i) => [name(c), hex(c), inView.whole[i]]))} />
                    : <div className="mt-1 text-[10px] text-gray-600">{en ? 'No zoned area in this view' : 'Aucune superficie classée dans cette vue'}</div>}
                  {!!totals[0] && <Bar label={en ? `New cells since ${to + 1} (${n(0)})` : `Nouvelles cellules depuis ${to + 1} (${n(0)})`} parts={split(sets[0])} {...ref(split(everything[0]))} />}
                  {!!totals[1] && <Bar label={en ? `Discoveries, over 10 km from records (${n(1)})` : `Découvertes, à plus de 10 km des mentions (${n(1)})`} parts={split(sets[1])} {...ref(split(everything[1]))} />}
                  <div className="mt-1 text-[10px] text-gray-600">{en ? `Suitable: at least ${zoneStats.thr}%, the level 90% of training records reach` : `Favorable : au moins ${zoneStats.thr} %, le niveau atteint par 90 % des mentions d'entraînement`}</div>
                </div>
              );
            })()}
            {showObs && (
              <div className="mt-1 pt-1 border-t border-gray-100 text-[10px] text-gray-600">
                {lang === 'EN'
                  ? `Dots: observed ${from}–${to}, white edge. New since ${to + 1}: larger, dark edge if >10 km from earlier records, hollow grey if unsuitable.`
                  : `Points : observés ${from}–${to}, bord blanc. Nouveau depuis ${to + 1} : plus gros, bord foncé si >10 km des mentions antérieures, gris vide si non favorable.`}
              </div>
            )}
            <div className="mt-1 pt-1 border-t border-gray-100 text-[10px] text-amber-900">
              {lang === 'EN'
                ? 'Prototype for discussion. Thresholds are provisional and the categories are not peer reviewed; do not use for decisions.'
                : "Prototype à des fins de discussion. Les seuils sont provisoires et les catégories n'ont pas été évaluées par des pairs; ne pas utiliser pour prendre des décisions."}
            </div>
          </details>
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
            {([
              ...(showObs ? [[OCC_IN, lang === 'EN' ? `GBIF records ${from}–${to}` : `Observations GBIF ${from}–${to}`], ['#f59e0b', lang === 'EN' ? `GBIF records since ${to + 1}` : `Observations GBIF depuis ${to + 1}`]] : []),
              ...(showOcc ? [[OCC_IN, lang === 'EN' ? 'Records inside IUCN range' : "Observations dans l'aire UICN"], [OCC_OUT, lang === 'EN' ? 'Records outside IUCN range' : "Observations hors de l'aire UICN"]] : []),
            ] as [string, string][]).map(([c, label]) => (
              <div key={label} className="flex items-center gap-2 mt-1 text-[10px]">
                <span className="inline-block w-5 text-center"><span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: c, border: '0.5px solid #374151' }} /></span>
                <span>{label}</span>
              </div>
            ))}
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
