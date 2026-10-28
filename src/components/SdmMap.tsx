import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getGreyStyle } from './BaseMap';
import { sdmCogUrl, sdmTileUrl, sdmPointUrl, SdmPeriod } from '../data/sdmSource';
import { useLanguage } from '../lib/LanguageContext';

const SRC = 'sdm-source';
const LAYER = 'sdm-layer';

export default function SdmMap({ slug }: { slug?: string }) {
  const { lang } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [period, setPeriod] = useState<SdmPeriod>('current');
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
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('click', async (e) => {
      const s = slugRef.current;
      if (!s) return;
      const fr = langRef.current === 'FR';
      let text = fr ? 'Aucune prédiction' : 'No prediction';
      try {
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
      map.addSource(SRC, { type: 'raster', tiles: [sdmTileUrl(sdmCogUrl(slug, period))], tileSize: 256, bounds: [-141.0, 41.67, -52.61, 83.11] });
      map.addLayer({ id: LAYER, type: 'raster', source: SRC, paint: { 'raster-opacity': 0.85 } });
    };
    if (map.isStyleLoaded()) apply(); else map.once('load', apply);
    return () => { map.off('load', apply); };
  }, [slug, period]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden card-shadow border border-gray-100">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 flex rounded-lg overflow-hidden shadow-sm text-xs font-sans border border-gray-200">
        {([['current', lang === 'EN' ? 'Current (1980-2010)' : 'Actuel (1980-2010)'], ['2100', lang === 'EN' ? '2100 projection (2071-2100)' : 'Projection 2100 (2071-2100)']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setPeriod(k)} aria-pressed={period === k}
            className={`px-3 py-1.5 cursor-pointer ${period === k ? 'bg-sage-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>
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
