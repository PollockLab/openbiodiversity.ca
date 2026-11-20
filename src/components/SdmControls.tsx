import React, { useState } from 'react';
import { Category } from '../data/sdmCategories';
import { SdmPeriod } from '../data/sdmSource';
import { Span } from '../data/sdmTemporal';
import Timeline from './SdmTimeline';
import type { View } from './SdmMap';

type L = [string, string]; // EN, FR
// The prototype Change view is unlisted: its button shows only when the page was opened from a view=categories link
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
  // Read once per mount: the explorer remounts when a new link is opened, and switching views must not hide the button
  const [PROTO] = useState(() => window.location.hash.includes('view=categories'));
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
    <div className={`absolute top-3 ${left} right-16 flex flex-wrap items-start gap-2 text-xs font-sans z-10 transition-all duration-300 pointer-events-none [&>*]:pointer-events-auto`}>
      <div id="sdm-view-buttons" role="group" aria-label={t('Map view', 'Vue de la carte')} className="flex rounded-lg overflow-hidden shadow-sm border border-gray-200">
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
      <fieldset className="min-w-0 max-w-full rounded-lg shadow-sm border border-gray-200 bg-white px-3 py-1.5 text-gray-600 flex flex-col gap-1">
        <legend className="sr-only">{t('Observations', 'Observations')}</legend>
        <span className="text-gray-700 font-semibold">{t('Observations by year', 'Observations par année')}</span>
        {checkbox(onToggleObs, showObs, t('Show on the map', 'Afficher sur la carte'), tip('obs', t('GBIF observations as dots: baseline ones small, new ones larger', 'Observations GBIF en points : celles de référence petites, les nouvelles plus grosses')))}
        {/* The zones depend on the baseline years, so the slider stays when the dots are hidden */}
        {(showObs || cats) && <>
          <Timeline from={span[0]} to={span[1]} onChange={onSpanChange} lang={lang} />
          <details className="max-w-72 text-[10px] leading-snug text-gray-600">
            <summary className="cursor-pointer text-sage-700 underline">{t('How does this work?', 'Comment ça marche?')}</summary>
            <p className="mt-1">{t('Pick the baseline years with the two handles. Observations from those years are what is taken as already known about where the species lives.', 'Choisissez les années de référence avec les deux poignées. Les observations de ces années représentent ce que l\'on sait déjà de la répartition de l\'espèce.')}</p>
            {cats && <p className="mt-1">{t('A place counts as Confirmed when a baseline observation lies within 40 km.', 'Un lieu est Confirmé si une observation de référence se trouve à moins de 40 km.')}</p>}
            <p className="mt-1">{t('Observations made after the baseline are new. They show as larger dots and test the map: did the species turn up where the model said it could?', 'Les observations faites après la référence sont nouvelles. Elles apparaissent en plus gros points et mettent la carte à l\'épreuve : l\'espèce est-elle apparue là où le modèle le prévoyait?')}</p>
          </details>
        </>}
        {/* A different set from the dated observations above: fixed, undated, and not moved by the slider */}
        <span className="mt-1 pt-1 border-t border-gray-200 text-gray-700 font-semibold">{t('Model training records', "Mentions d'entraînement du modèle")}</span>
        {checkbox(onToggleOcc, showOcc, t('Show on the map', 'Afficher sur la carte'), tip('train', t('The GBIF records the model was trained on, mapped where they fall', "Les mentions GBIF utilisées pour entraîner le modèle, là où elles se trouvent")), occBusy)}
        <p className="max-w-72 text-[10px] leading-snug text-gray-600">
          <span className="inline-block w-2 h-2 rounded-full bg-white border border-gray-700 align-middle" /> {t('The fixed set of records the model learned from. The slider does not change it.', 'Les mentions fixes à partir desquelles le modèle a appris. Le curseur ne les modifie pas.')}{' '}
          <span className="inline-block w-2 h-2 rounded-full border border-gray-700 align-middle" style={{ background: '#991b1b' }} /> {t('Outside the IUCN range.', "Hors de l'aire UICN.")}
        </p>
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
