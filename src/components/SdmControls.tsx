import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Category } from '../data/sdmCategories';
import { SdmPeriod } from '../data/sdmSource';
import { Span } from '../data/sdmTemporal';
import Timeline from './SdmTimeline';
import type { View } from './SdmMap';

type L = [string, string]; // EN, FR
// The prototype Change view is unlisted: its button shows only when the page was opened from a view=categories link
// Definition, action, and the matching term in the literature for each zone
export const CAT_TIPS: Record<Category, L> = {
  confirmed: ['Suitable now and in 2100, inside the known range, observed within 40 km. Protect. Stable documented range.', "Favorable aujourd'hui et en 2100, dans l'aire connue, observé à moins de 40 km. À protéger. Aire documentée stable."],
  'in-range': ['Suitable now and in 2100, inside the known range, no observation within 40 km. Look here. Suitable, unrecorded.', "Favorable aujourd'hui et en 2100, dans l'aire connue, sans observation à moins de 40 km. À explorer. Favorable, non observé."],
  'range-gap': ['Horizon with records: suitable and observed outside the known range. The range map may need redrawing. Recorded outside range.', "Horizon avec mentions : favorable et observé hors de l'aire connue. La carte de l'aire est peut-être à revoir. Observé hors de l'aire."],
  frontier: ['Suitable now and in 2100, outside the known range, no observation within 40 km. Survey here. Suitable outside range.', "Favorable aujourd'hui et en 2100, hors de l'aire connue, sans observation à moins de 40 km. À inventorier. Favorable hors de l'aire."],
  'climate-risk': ['Suitable now, not in 2100. Watch. Projected loss of suitable climate.', "Favorable aujourd'hui, pas en 2100. À surveiller. Perte projetée de climat favorable."],
  'newly-suitable': ['Not suitable now, suitable in 2100. Prepare. Projected gain of suitable climate.', "Non favorable aujourd'hui, favorable en 2100. À préparer. Gain projeté de climat favorable."],
};

interface Props {
  lang: string; left: string; slot: HTMLElement | null; view: View; onViewChange: (v: View) => void; period: SdmPeriod; onPeriodChange: (p: SdmPeriod) => void;
  showOcc: boolean; onToggleOcc: () => void; occBusy: boolean;
  showObs: boolean; onToggleObs: () => void; span: Span; onSpanChange: (s: Span) => void;
}

export default function SdmControls({ lang, left, slot, view, onViewChange, period, onPeriodChange, showOcc, onToggleOcc, occBusy, showObs, onToggleObs, span, onSpanChange }: Props) {
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
    <div className={`absolute top-3 ${left} right-16 @[600px]:right-[18.5rem] flex flex-wrap items-start gap-2 text-xs font-sans z-10 transition-all duration-300 pointer-events-none [&>*]:pointer-events-auto`}>
      <div id="sdm-view-buttons" role="group" aria-label={t('Map view', 'Vue de la carte')} className="flex rounded-lg overflow-hidden shadow-sm border border-gray-200">
        {views.map((v) => <button key={v.k} onClick={v.go} aria-pressed={v.on} {...tip(`v${v.k}`, v.tip)} className={seg(v.on)}>{v.label}</button>)}
        {PROTO && <button onClick={() => onViewChange('categories')} aria-pressed={cats} {...tip('vcat', t('Compares today with 2100 and sorts every place into zones', "Compare aujourd'hui et 2100 et classe chaque lieu en zones"))} className={seg(cats)}>
          {t('Zones, current to future', 'Zones, actuel à futur')} <span className="ml-1 text-xs uppercase opacity-70">{t('prototype', 'prototype')}</span>
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
      {/* The layers live in the right-hand column that SdmMap owns */}
      {slot && createPortal(<fieldset className="min-w-0 text-gray-700 flex flex-col gap-1.5">
        <legend className="sr-only">{t('Dots on the map', 'Points sur la carte')}</legend>
        {checkbox(onToggleObs, showObs, t('Observations by year', 'Observations par année'), tip('obs', t('GBIF observations as dots: baseline ones small, new ones larger', 'Observations GBIF en points : celles de référence petites, les nouvelles plus grosses')))}
        {/* The zones depend on the baseline years, so the slider stays when the dots are hidden */}
        {(showObs || cats) && <Timeline from={span[0]} to={span[1]} onChange={onSpanChange} lang={lang} />}
        {/* A different set from the dated observations above: fixed, undated, and not moved by the slider */}
        {checkbox(onToggleOcc, showOcc, t('Model training records', "Mentions d'entraînement du modèle"), tip('train', t('The GBIF records the model was trained on, mapped where they fall', "Les mentions GBIF utilisées pour entraîner le modèle, là où elles se trouvent")), occBusy)}
        <details className="min-w-0 text-xs leading-snug text-gray-600">
          <summary className="cursor-pointer text-sage-700">{t('How does this work?', 'Comment ça marche?')}</summary>
          <p className="mt-1">{t('Pick the baseline years with the two handles. Observations from those years are what is taken as already known about where the species lives.', 'Choisissez les années de référence avec les deux poignées. Les observations de ces années représentent ce que l\'on sait déjà de la répartition de l\'espèce.')}</p>
            {cats && <p className="mt-1">{t('A place counts as a Stronghold when a baseline observation lies within 40 km.', 'Un lieu est un Bastion si une observation de référence se trouve à moins de 40 km.')}</p>}
            <p className="mt-1">{t('Observations made after the baseline are new. They show as larger dots and test the map: did the species turn up where the model said it could?', 'Les observations faites après la référence sont nouvelles. Elles apparaissent en plus gros points et mettent la carte à l\'épreuve : l\'espèce est-elle apparue là où le modèle le prévoyait?')}</p>
          <p className="mt-1"><span className="inline-block w-2 h-2 rounded-full bg-white border border-gray-700 align-middle" /> {t('Training records are the fixed set the model learned from; the slider does not change them.', "Les mentions d'entraînement sont l'ensemble fixe dont le modèle a appris; le curseur ne les change pas.")} <span className="inline-block w-2 h-2 rounded-full border border-gray-700 align-middle" style={{ background: '#991b1b' }} /> {t('Outside the IUCN range.', "Hors de l'aire UICN.")}</p>
        </details>
      </fieldset>, slot)}
      {tips.map(([id, text]) => <span key={id} id={`sdm-tip-${id}`} className="sr-only">{text}</span>)}
    </div>
  );
}

const checkbox = (onChange: () => void, checked: boolean, label: string, props: object, busy = false) => (
  <label className={`flex min-h-6 items-center gap-1.5 cursor-pointer ${busy ? 'animate-pulse' : ''}`} {...props}>
    <input type="checkbox" className="accent-sage-500" checked={checked} onChange={onChange} aria-busy={busy} />
    {label}
  </label>
);
