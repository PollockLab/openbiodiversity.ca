import maplibregl from 'maplibre-gl';
import { cellAt, cellBox, evidenceKey, fetchCells, LAST_YEAR, Span } from '../data/sdmTemporal';
import { distanceToTrainingKm } from '../data/sdmCategories';
import { fetchRecords, RecordList } from '../data/sdmRecords';

// Click a GBIF dot to see what is known about its cell at once, then the individual records behind it
export type PopupCtx = { slug?: string; sci: string; fr: boolean; span: Span; label: (category: string) => string };
type Kind = 'new' | 'evidence' | 'test' | 'training';
type Box = [number, number, number, number];

const BASIS: Record<string, [string, string]> = {
  HUMAN_OBSERVATION: ['Human observation', 'Observation humaine'], MACHINE_OBSERVATION: ['Machine observation', 'Observation automatisée'],
  OBSERVATION: ['Observation', 'Observation'], OCCURRENCE: ['Occurrence', 'Occurrence'], PRESERVED_SPECIMEN: ['Museum specimen', 'Spécimen de musée'], MATERIAL_SAMPLE: ['Material sample', 'Échantillon'],
};
// Dots are 4 to 9 px wide: a click within HIT px picks the nearest one, so a near miss does not fall through to the zone card
const HIT = 8;
export function nearestDot(map: maplibregl.Map, p: maplibregl.Point, layers: string[]) {
  const live = layers.filter((l) => map.getLayer(l));
  if (!live.length) return undefined;
  const d2 = (f: maplibregl.MapGeoJSONFeature) => { const q = map.project((f.geometry as GeoJSON.Point).coordinates as [number, number]); return (q.x - p.x) ** 2 + (q.y - p.y) ** 2; };
  return map.queryRenderedFeatures([[p.x - HIT, p.y - HIT], [p.x + HIT, p.y + HIT]], { layers: live }).sort((a, b) => d2(a) - d2(b))[0];
}
const el = (tag: string, text = '', style = '') => { const e = document.createElement(tag); e.textContent = text; if (style) e.style.cssText = style; return e; };

export function bindRecordPopups(map: maplibregl.Map, layers: Record<Kind, string>, ctx: () => PopupCtx) {
  let popup: maplibregl.Popup | null = null;
  const kindOf = (f: maplibregl.MapGeoJSONFeature): Kind => (Object.keys(layers) as Kind[]).find((k) => layers[k] === f.layer.id && (k !== 'test' || f.properties?.test) && (k !== 'evidence' || !f.properties?.test))!;
  // The cell and period behind a dot; training points are undated, so they get a small box and every year
  const resolve = async (f: maplibregl.MapGeoJSONFeature, c: PopupCtx) => {
    const [lon, lat] = (f.geometry as GeoJSON.Point).coordinates, kind = kindOf(f);
    if (kind === 'training') return { kind, lon, lat, cells: [], cell: null, box: [lon - 0.01, lat - 0.01, lon + 0.01, lat + 0.01] as Box, years: null, props: f.properties };
    const cells = await fetchCells(c.sci), cell = cellAt(cells, lon, lat);
    const years: [number, number] = kind === 'evidence' ? c.span : [c.span[1] + 1, LAST_YEAR];
    return { kind, lon, lat, cells, cell, box: cell ? cellBox(cell) : [lon - 0.04, lat - 0.03, lon + 0.04, lat + 0.03] as Box, years, props: f.properties };
  };
  const hit = (e: maplibregl.MapLayerMouseEvent) => e.features?.[0];
  const ids = [...new Set(Object.values(layers))];

  for (const id of ids) {
    map.on('mouseenter', id, (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const f = hit(e), c = ctx();
      if (f && c.slug) resolve(f, c).then((r) => fetchRecords(c.sci, r.box, r.years)).catch(() => {}); // prefetch: the click reuses it
    });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
  }
  map.on('click', async (e) => {
      const f = nearestDot(map, e.point, ids), c = ctx();
      if (!f || !c.slug) return;
      const r = await resolve(f, c), fr = c.fr, t = (a: string, b: string) => (fr ? b : a);
      const box = el('div', '', 'font:12px/1.4 sans-serif;max-width:300px;max-height:260px;overflow:auto');
      const line = (text: string, style = '') => box.appendChild(el('div', text, style));
      if (r.kind === 'new' && r.props?.category) line(`${r.props.category === 'unsuitable' ? t('Below the suitability threshold', 'Sous le seuil de convenance') : c.label(r.props.category)}${r.props.discovery ? t(', discovery (over 10 km from evidence)', ', découverte (à plus de 10 km des preuves)') : ''}`, 'font-weight:600');
      else line(r.kind === 'evidence' ? t('Evidence record cell', 'Cellule de preuve') : r.kind === 'test' ? t('Newer record cell', 'Cellule de mention récente') : t('Model training record', "Mention d'entraînement du modèle"), 'font-weight:600');
      if (r.kind === 'new' || r.kind === 'test') {
        const km = distanceToTrainingKm(evidenceKey(c.slug, r.cells, c.span), r.lon, r.lat);
        if (Number.isFinite(km)) line(km >= 100 ? t('Nearest evidence: over 100 km', 'Preuve la plus proche : plus de 100 km') : t(`Nearest evidence: ${km.toFixed(km < 10 ? 1 : 0)} km`, `Preuve la plus proche : ${km.toFixed(km < 10 ? 1 : 0)} km`));
      }
      const [a, b] = r.years ?? [0, 0];
      const counts = r.cell ? Object.entries(r.cell.years).filter(([y]) => +y >= a && +y <= (r.years ? b : 9999)).map(([y, n]) => `${y}: ${n}`).join(' · ') : '';
      if (counts) line(`${t('Records per year', 'Mentions par année')}: ${counts}`, 'color:#4b5563');
      const list = box.appendChild(el('div', t('Loading records…', 'Chargement des mentions…'), 'margin-top:6px;color:#6b7280'));
      popup?.remove();
      const p = popup = new maplibregl.Popup({ maxWidth: '320px' }).setLngLat([r.lon, r.lat]).setDOMContent(box).addTo(map);
      // The records and photos arrive after the popup opens and make it taller: place it again so it stays inside the map
      const refit = () => p.setLngLat([r.lon, r.lat]);
      fetchRecords(c.sci, r.box, r.years).then(({ total, records }: RecordList) => {
        list.replaceChildren();
        list.style.color = '';
        if (!records.length) return void (list.textContent = t('No records found', 'Aucune mention trouvée'));
        list.appendChild(el('div', t(`${records.length} of ${total} record${total === 1 ? '' : 's'}`, `${records.length} de ${total} mention${total === 1 ? '' : 's'}`), 'color:#6b7280'));
        const ul = list.appendChild(el('ul', '', 'margin:4px 0 0;padding:0;list-style:none'));
        ul.className = 'sdm-records';
        for (const rec of records) {
          const li = ul.appendChild(el('li', '', 'padding:3px 0;border-top:1px solid #e5e7eb'));
          li.appendChild(el('span', `${rec.date?.slice(0, 10) ?? t('no date', 'sans date')} `, 'font-weight:600'));
          li.appendChild(el('span', `${rec.basis ? BASIS[rec.basis]?.[fr ? 1 : 0] ?? rec.basis : ''}${rec.who ? `, ${rec.who}` : ''} `));
          if (rec.photo) {
            // iNaturalist's small size (sdmRecords) keeps this light; a photo that fails to load is dropped
            const img = li.appendChild(el('img', '', 'display:block;max-width:100%;max-height:140px;border-radius:4px;margin:3px 0')) as HTMLImageElement;
            img.src = rec.photo; img.loading = 'lazy'; img.alt = t('Photo of this observation', 'Photo de cette observation'); img.onload = refit; img.onerror = () => img.remove();
          }
          if (rec.src) {
            // The publisher's own page (e.g. iNaturalist) opens directly; gbif.org shows a bot check first
            const a = li.appendChild(el('a', new URL(rec.src).hostname.replace(/^www\./, ''), 'color:#15803d;text-decoration:underline;margin-right:4px')) as HTMLAnchorElement;
            a.href = rec.src; a.target = '_blank'; a.rel = 'noopener noreferrer';
          }
          if (Number.isInteger(rec.key)) {
            const a = li.appendChild(el('a', 'GBIF', 'color:#15803d;text-decoration:underline')) as HTMLAnchorElement;
            a.href = `https://www.gbif.org/occurrence/${rec.key}`; a.target = '_blank'; a.rel = 'noopener noreferrer';
          }
        }
        refit();
      }).catch(() => { list.textContent = t('Records unavailable', 'Mentions indisponibles'); });
  });
  return () => popup?.remove();
}
