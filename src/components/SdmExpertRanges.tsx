import React, { useEffect, useState } from 'react';
import type maplibregl from 'maplibre-gl';
import { sdmGapUrl, sdmEbarUrl } from '../data/sdmSource';
import { checkbox } from './SdmControls';

// Display only: the zones and the records-inside-range test keep using the IUCN range
type Entry = { gap?: { name?: string; shared?: true; agree?: [number, number] }; ebar?: { scope: 'N' | 'G'; name?: string; agree?: [number, number] } };
const GAP = 'gap-range';
const EBAR = 'ebar-range';
export const GAP_LINE = '#a0703c';
export const EBAR_LINE = '#2f5d8a';
const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
// EBAR presence class to line pattern; blank rows are ecoshapes removed by expert review, so they are not drawn
const PRESENCE: [string, string, number[] | undefined, [string, string]][] = [['P', 'solid', undefined, ['Present', 'Présente']], ['X', 'dashed', [4, 3], ['Presence expected', 'Présence attendue']], ['H', 'dotted', [1, 2], ['Historical', 'Historique']]];

let index: Promise<Record<string, Entry>> | undefined;
const loadIndex = () => (index ??= fetch(`${import.meta.env.BASE_URL}sdm-expert-ranges.json`).then((r) => r.json()).catch((e) => { index = undefined; console.warn('Expert range index unavailable', e); return {}; }));

// Called once from the map's load handler, before the CA/US mask goes in, so the outlines sit under it like the IUCN one
export function addExpertLayers(map: maplibregl.Map) {
  map.addSource(GAP, { type: 'geojson', data: EMPTY });
  map.addLayer({ id: GAP, type: 'line', source: GAP, paint: { 'line-color': GAP_LINE, 'line-width': 1.5, 'line-dasharray': [4, 2] } });
  map.addSource(EBAR, { type: 'geojson', data: EMPTY });
  for (const [p, , dash] of PRESENCE) map.addLayer({ id: `${EBAR}-${p}`, type: 'line', source: EBAR, filter: ['==', ['get', 'p'], p], paint: { 'line-color': EBAR_LINE, 'line-width': 1, 'line-opacity': 0.45, ...(dash ? { 'line-dasharray': dash } : {}) } });
}

export function useExpertRanges(mapRef: React.RefObject<maplibregl.Map | null>, slug: string, showGap: boolean, showEbar: boolean) {
  const [entry, setEntry] = useState<Entry>({});
  const [presences, setPresences] = useState<string[]>([]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let live = true;
    const apply = async () => {
      setEntry({}); setPresences([]);
      (map.getSource(GAP) as maplibregl.GeoJSONSource).setData(EMPTY);
      (map.getSource(EBAR) as maplibregl.GeoJSONSource).setData(EMPTY);
      const e = slug ? (await loadIndex())[slug] : undefined;
      if (!live || !e) return;
      setEntry(e);
      const { fetchLaeaFgb } = await import('../data/sdmRange');
      if (e.gap) fetchLaeaFgb(sdmGapUrl(slug)).then((fc) => { if (live) (map.getSource(GAP) as maplibregl.GeoJSONSource).setData(fc); }).catch((x) => console.warn('GAP range unavailable', x));
      if (e.ebar) fetchLaeaFgb(sdmEbarUrl(slug)).then((fc) => {
        if (!live) return;
        const features = fc.features.filter((f) => ['P', 'X', 'H'].includes(f.properties?.presence)).map((f) => ({ ...f, properties: { ...f.properties, p: f.properties!.presence } }));
        (map.getSource(EBAR) as maplibregl.GeoJSONSource).setData({ ...fc, features });
        setPresences([...new Set(features.map((f) => f.properties.p))]);
      }).catch((x) => console.warn('EBAR range unavailable', x));
    };
    if (map.getSource(GAP)) apply(); else map.once('load', apply);
    return () => { live = false; map.off('load', apply); };
  }, [slug]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer(GAP)) return;
    map.setLayoutProperty(GAP, 'visibility', showGap ? 'visible' : 'none');
    for (const [p] of PRESENCE) map.setLayoutProperty(`${EBAR}-${p}`, 'visibility', showEbar ? 'visible' : 'none');
  }, [showGap, showEbar]);
  return { entry, presences };
}

type Props = { lang: string; entry: Entry; showGap: boolean; onToggleGap: () => void; showEbar: boolean; onToggleEbar: () => void };

export function ExpertToggles({ lang, entry, showGap, onToggleGap, showEbar, onToggleEbar }: Props) {
  const t = (a: string, b: string) => (lang === 'EN' ? a : b);
  return <>
    {entry.gap && checkbox(onToggleGap, showGap, t('USGS GAP range outline', 'Contour de l\'aire USGS GAP'), { title: t('Expert range outline from USGS GAP 2018', 'Contour de l\'aire d\'expert USGS GAP 2018') })}
    {entry.ebar && checkbox(onToggleEbar, showEbar, t('EBAR range outline', 'Contour de l\'aire EBAR'), { title: t('Expert range outline from NatureServe Canada EBAR', 'Contour de l\'aire d\'expert EBAR de NatureServe Canada') })}
  </>;
}

const swatch = (color: string, style: string, opacity = 1) => <span className="inline-block w-5 border-t-2" style={{ borderColor: color, borderTopStyle: style as any, opacity }} />;

export function ExpertLegend({ lang, entry, showGap, showEbar, presences }: Omit<Props, 'onToggleGap' | 'onToggleEbar'> & { presences: string[] }) {
  const t = (a: string, b: string) => (lang === 'EN' ? a : b);
  const gap = entry.gap && showGap, ebar = entry.ebar && showEbar;
  if (!gap && !ebar) return null;
  return (
    <div className="mt-1.5 pt-1 border-t border-gray-100 text-xs">
      <div className="text-gray-500 italic">{t('Expert range comparison, prototype', 'Comparaison des aires d\'experts, prototype')}</div>
      {entry.gap?.agree && <div className="mt-1 text-gray-600" title={t('Share of the combined area that both maps cover (1 minus Jaccard distance), contiguous US, USGS GAP matched to the season', 'Part de la surface combinée couverte par les deux cartes (1 moins la distance de Jaccard), États-Unis contigus, USGS GAP selon la saison')}>{t(`Expert maps overlap: IUCN–GAP ${entry.gap.agree[0]}%, model–IUCN ${entry.gap.agree[1]}% (US)`, `Chevauchement des cartes d'experts : UICN–GAP ${entry.gap.agree[0]} %, modèle–UICN ${entry.gap.agree[1]} % (É.-U.)`)}</div>}
      {entry.ebar?.agree && <div className="mt-1 text-gray-600" title={t('Share of the combined area that both maps cover (1 minus Jaccard distance), Canada, EBAR presence', 'Part de la surface combinée couverte par les deux cartes (1 moins la distance de Jaccard), Canada, présence EBAR')}>{entry.gap?.agree ? '' : t('Expert maps overlap: ', 'Chevauchement des cartes d\'experts : ')}{t(`IUCN–EBAR ${entry.ebar.agree[0]}%, model–IUCN ${entry.ebar.agree[1]}% (Canada)`, `UICN–EBAR ${entry.ebar.agree[0]} %, modèle–UICN ${entry.ebar.agree[1]} % (Canada)`)}</div>}
      {gap && <div className="flex items-start gap-2 mt-1" title={t('Outside the contiguous US this means not mapped, never absent', 'Hors des États-Unis contigus, cela veut dire non cartographié, jamais absent')}>
        <span className="mt-1.5">{swatch(GAP_LINE, 'dashed')}</span>
        <span>{t('USGS GAP range (2018), contiguous US only', 'Aire USGS GAP (2018), États-Unis contigus seulement')}
          {entry.gap!.name && t(`, mapped as ${entry.gap!.name}`, `, cartographié sous ${entry.gap!.name}`)}
          {entry.gap!.shared && t('. This range also covers species since split from it', '. Cette aire couvre aussi les espèces qui en ont été séparées depuis')}
          <span className="block text-gray-500">{t('Elsewhere: not mapped, not absent', 'Ailleurs : non cartographié, pas absent')}</span></span>
      </div>}
      {ebar && <div className="mt-1">
        <div>{t('EBAR range (NatureServe Canada)', 'Aire EBAR (NatureServe Canada)')}{entry.ebar!.scope === 'N' && t(', Canada only, not mapped elsewhere', ', Canada seulement, non cartographié ailleurs')}</div>
        {PRESENCE.filter(([p]) => presences.includes(p)).map(([p, style, , label]) => <div key={p} className="flex items-center gap-2 text-gray-600">{swatch(EBAR_LINE, style, 0.7)}<span>{label[lang === 'EN' ? 0 : 1]}</span></div>)}
      </div>}
    </div>
  );
}
