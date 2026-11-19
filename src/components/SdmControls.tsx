import React from 'react';
import { Category } from '../data/sdmCategories';
import { SdmPeriod } from '../data/sdmSource';
import { Span } from '../data/sdmTemporal';
import Timeline from './SdmTimeline';
import type { View } from './SdmMap';

type L = [string, string]; // EN, FR
// The prototype Change view is unlisted: its button shows only when the page was opened from a view=categories link
const PROTO = window.location.hash.includes('view=categories');
// One-line plain-language explanations of Laura's categories (names unchanged)
export const CAT_TIPS: Record<Category, L> = {
  confirmed: ['Suitable now and in 2100, inside the known range and near observations', "Favorable aujourd'hui et en 2100, dans l'aire connue et près des observations"],
  'in-range': ['Suitable now and in 2100, inside the known range, but no observation within 40 km', "Favorable aujourd'hui et en 2100, dans l'aire connue, mais sans observation à moins de 40 km"],
  'range-gap': ['Suitable now and in 2100 and observed, but outside the known range: the range map may need redrawing', "Favorable aujourd'hui et en 2100 et observé, mais hors de l'aire connue : la carte de l'aire est peut-être à revoir"],
  frontier: ['Suitable now and in 2100, outside the known range and far (>40 km) from any observation: worth a survey', "Favorable aujourd'hui et en 2100, hors de l'aire connue et loin (>40 km) de toute observation : à inventorier"],
  'climate-risk': ['Suitable now, not in 2100', "Favorable aujourd'hui, pas en 2100"],
  'newly-suitable': ['Not suitable now, suitable in 2100', "Non favorable aujourd'hui, favorable en 2100"],
};

interface Props {
  lang: string; left: string; view: View; onViewChange: (v: View) => void; period: SdmPeriod; onPeriodChange: (p: SdmPeriod) => void;
  showOcc: boolean; onToggleOcc: () => void; occBusy: boolean;
  showObs: boolean; onToggleObs: () => void; span: Span; onSpanChange: (s: Span) => void;
}

export default function SdmControls({ lang, left, view, onViewChange, period, onPeriodChange, showOcc, onToggleOcc, occBusy, showObs, onToggleObs, span, onSpanChange }: Props) {
  const i = lang === 'EN' ? 0 : 1, t = (a: string, b: string) => (i ? b : a);
  // Each control gets a title tooltip and a screen-reader description
  const tips: [string, string][] = [];
  const tip = (id: string, text: string) => { tips.push([id, text]); return { title: text, 'aria-describedby': `sdm-tip-${id}` }; };
  const seg = (on: boolean) => `px-3 py-1.5 cursor-pointer ${on ? 'bg-sage-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`;
  const cats = view === 'categories';
  const views = [
    { k: 'current', on: view === 'suitability' && period !== '2100', label: t('Current (1980-2010)', 'Actuel (1980-2010)'), tip: t('Where conditions are suitable today, from 1980-2010 climate', "Où les conditions sont favorables aujourd'hui, selon le climat 1980-2010"), go: () => { onViewChange('suitability'); if (period === '2100') onPeriodChange('current-model'); } },
    { k: '2100', on: view === 'suitability' && period === '2100', label: t('Future (2071-2100)', 'Futur (2071-2100)'), tip: t('Where conditions are predicted to be suitable at the end of the century', 'Où les conditions devraient être favorables à la fin du siècle'), go: () => { onViewChange('suitability'); onPeriodChange('2100'); } },
  ];
  return (
    <div className={`absolute top-3 ${left} right-16 flex flex-wrap items-start gap-2 text-xs font-sans z-10 transition-all duration-300`}>
      <div className="flex rounded-lg overflow-hidden shadow-sm border border-gray-200">
        {views.map((v) => <button key={v.k} onClick={v.go} aria-pressed={v.on} {...tip(`v${v.k}`, v.tip)} className={seg(v.on)}>{v.label}</button>)}
        {PROTO && <button onClick={() => onViewChange('categories')} aria-pressed={cats} {...tip('vcat', t('Compares today with 2100 and sorts every place into zones', "Compare aujourd'hui et 2100 et classe chaque lieu en zones"))} className={seg(cats)}>
          {t('Zones, current to future', 'Zones, actuel à futur')} <span className="ml-1 text-[9px] uppercase opacity-70">{t('prototype', 'prototype')}</span>
        </button>}
      </div>
      {view === 'suitability' && (
        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 bg-white ${period === '2100' ? 'text-gray-400' : 'text-gray-600 cursor-pointer'}`}>
          <input type="checkbox" className="accent-sage-500" checked={period === 'current'} disabled={period === '2100'}
            onChange={e => onPeriodChange(e.target.checked ? 'current' : 'current-model')} />
          {t('Clip to known range', "Découper selon l'aire connue")}
          {period === '2100' && t(' (no clipped version for 2100)', ' (pas de version découpée pour 2100)')}
        </label>
      )}
      <fieldset className="rounded-lg shadow-sm border border-gray-200 bg-white px-3 py-1.5 text-gray-600 flex flex-col gap-1">
        <legend className="sr-only">{t('Observations', 'Observations')}</legend>
        <span className="text-gray-500 font-semibold">{t('Observations', 'Observations')}</span>
        {checkbox(onToggleOcc, showOcc, t('Used to build the model', 'Utilisées pour le modèle'), tip('train', t('The GBIF records the model was trained on, mapped where they fall', "Les mentions GBIF utilisées pour entraîner le modèle, là où elles se trouvent")), occBusy)}
        {checkbox(onToggleObs, showObs, showObs ? `${t('By year', 'Par année')}, ${span[0]}–${span[1]}` : t('By year', 'Par année'), tip('obs', t('GBIF observations by year: pick the years with the slider', 'Observations GBIF par année : choisissez les années avec le curseur')))}
        {showObs && <div className="ml-5"><Timeline from={span[0]} to={span[1]} onChange={onSpanChange} lang={lang} /></div>}
      </fieldset>
      {tips.map(([id, text]) => <span key={id} id={`sdm-tip-${id}`} className="sr-only">{text}</span>)}
    </div>
  );
}

const checkbox = (onChange: () => void, checked: boolean, label: string, props: object, busy = false) => (
  <label className={`flex items-center gap-1.5 cursor-pointer ${busy ? 'animate-pulse' : ''}`} {...props}>
    <input type="checkbox" className="accent-sage-500" checked={checked} onChange={onChange} aria-busy={busy} />
    {label}
  </label>
);
