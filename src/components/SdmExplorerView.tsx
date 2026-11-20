import React, { useEffect, useState } from 'react';
import { Compass, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { loadSdmSpecies } from '../data/sdmModels';
import { SDMModel } from '../types';
import SdmMap, { parseAt, View } from './SdmMap';
import SdmSidebar from './SdmSidebar';
import { SdmPeriod, hasClipped2100 } from '../data/sdmSource';
import { Span, DEFAULT_SPAN, LAST_YEAR, TIMELINE_START } from '../data/sdmTemporal';
import { useLanguage } from '../lib/LanguageContext';

const DEFAULT_SPECIES = 'rangifer-tarandus';
// Species, view, GBIF records, map position and language live in the hash as #sdm-explorer?sp=<id>&view=<2100|2100c|model|categories>&ev=<none|high>&span=<2016-2020>&train=1&obs=1&at=<zoom/lat/lng>&lang=fr; App.tsx routes on the part before "?"
const hashParam = (key: string) => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get(key);
const speciesFromHash = () => hashParam('sp') || DEFAULT_SPECIES;
// No view, or an unknown one, is the default clipped current map, so links from before the view existed still work
const viewFromHash = (): View => (hashParam('view') === 'categories' ? 'categories' : 'suitability');
// Years are clamped to the timeline; a reversed or unreadable span (including the retired span=model) is the default
const spanFromHash = (): Span => {
  const sp = hashParam('span');
  const m = /^(\d{4})-(\d{4})$/.exec(sp ?? '');
  if (!m || +m[1] > +m[2]) return DEFAULT_SPAN;
  const clamp = (y: number) => Math.min(Math.max(y, TIMELINE_START), LAST_YEAR - 1);
  return [clamp(+m[1]), clamp(+m[2])];
};
const periodFromHash = (): SdmPeriod => {
  const view = hashParam('view');
  return view === '2100' ? '2100' : view === '2100c' ? '2100-clipped' : view === 'model' ? 'current-model' : 'current';
};

const IUCN_LABELS: Record<string, [string, string]> = {
  LC: ['Least Concern', 'Préoccupation mineure'],
  NT: ['Near Threatened', 'Quasi menacée'],
  VU: ['Vulnerable', 'Vulnérable'],
  EN: ['Endangered', 'En danger'],
  CR: ['Critically Endangered', 'En danger critique'],
  DD: ['Data Deficient', 'Données insuffisantes'],
};

export default function SdmExplorerView() {
  const { lang } = useLanguage();
  const [selectedSdmId, setSelectedSdmId] = useState<string>(speciesFromHash);
  const [species, setSpecies] = useState<SDMModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [period, setPeriod] = useState<SdmPeriod>(periodFromHash);
  const [view, setView] = useState<View>(viewFromHash);
  // The clipped 2100 file is uploaded per species: without it the Future map and the checkbox behave as before; null while the check runs, so a 2100c link does not flash the unclipped map
  const [clip2100, setClip2100] = useState<boolean | null>(null);
  const [span, setSpan] = useState<Span>(spanFromHash);
  const [showOcc, setShowOcc] = useState(() => hashParam('train') === '1');
  // By year is on in the categories view unless the link says obs=0, and off elsewhere unless it says obs=1
  const [obsChoice, setObsChoice] = useState<boolean | null>(() => { const o = hashParam('obs'); return o === '1' ? true : o === '0' ? false : null; });
  const showObs = obsChoice ?? view === 'categories';
  const [at, setAt] = useState(() => (parseAt(hashParam('at')) ? hashParam('at') : null));
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 640); // the open list covers a phone-width map

  useEffect(() => {
    loadSdmSpecies()
      .then(list => {
        setSpecies(list);
        // An unknown species in the link falls back to the default, and a linked map position goes with it
        if (!list.some(s => s.id === speciesFromHash())) setAt(null);
        setSelectedSdmId(id => (list.some(s => s.id === id) ? id : DEFAULT_SPECIES));
      })
      .catch(e => setLoadError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const cats = view === 'categories';
    const v = cats ? '&view=categories' : period === '2100' ? '&view=2100' : period === '2100-clipped' ? '&view=2100c' : period === 'current-model' ? '&view=model' : '';
    const sp = (cats || showObs) && span.join() !== DEFAULT_SPAN.join() ? `&span=${span.join('-')}` : '';
    window.history.replaceState(null, '', `#sdm-explorer?sp=${encodeURIComponent(selectedSdmId)}${v}${sp}${showOcc ? '&train=1' : ''}${showObs === (view === 'categories') ? '' : `&obs=${+showObs}`}${at ? `&at=${at}` : ''}${lang === 'FR' ? '&lang=fr' : ''}`);
  }, [selectedSdmId, period, view, span, showOcc, showObs, at, lang]);

  // Esc leaves expanded mode (the sidebar search consumes Esc while its list is open)
  useEffect(() => {
    if (!isExpanded) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isExpanded]);

  // Collapsible accordion state
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);

  const nameOf = (s: SDMModel) => (lang === 'FR' && s.commonNameFr ? s.commonNameFr : s.commonName);

  const selectedSpecies = species.find(s => s.id === selectedSdmId);
  const iucn = selectedSpecies?.iucnStatus ? IUCN_LABELS[selectedSpecies.iucnStatus] : undefined;
  const selectedName = selectedSpecies && nameOf(selectedSpecies);
  const slug = selectedSpecies?.ecccSlug ?? selectedSdmId;
  useEffect(() => {
    let live = true;
    setClip2100(null);
    hasClipped2100(slug).then(ok => live && setClip2100(ok));
    return () => { live = false; };
  }, [slug]);

  const intro = (
    <p className="text-sm text-gray-500 mt-1 leading-relaxed font-sans">
            {lang === 'EN' 
              ? `Explore species distribution models at 1 km resolution across Canada and the United States. Each map is the mean of three models (boosted regression trees, MaxEnt and random forest). Current maps (1980-2010) are clipped to each species' known range; ${clip2100 ? 'so are the 2100 projections, with the clip held at 1980-2010 evidence' : '2100 projections are not'} (see Methodology).`
              : `Explorez des modèles de distribution d'espèces à une résolution de 1 km pour le Canada et les États-Unis. Chaque carte est la moyenne de trois modèles (arbres de régression boostés, MaxEnt et forêt aléatoire). Les cartes actuelles (1980-2010) sont découpées selon l'aire connue de chaque espèce; ${clip2100 ? 'les projections pour 2100 aussi, avec un découpage figé sur les données 1980-2010' : 'les projections pour 2100 ne le sont pas'} (voir Méthodologie).`}
          </p>
  );

  return (
    <div className="space-y-8 pb-16">
      
      {/* Intro descriptive card */}
      <section className={`bg-white border border-gray-100 rounded-2xl card-shadow ${selectedSpecies ? 'px-4 py-2' : 'p-6 md:p-8'}`}>
        <div>
          <h1 className={`font-display font-semibold text-wood-900 tracking-tight ${selectedSpecies ? 'text-lg' : 'text-2xl sm:text-3xl'}`}>
            {lang === 'EN' ? "Species Distribution Models" : "Modèles de distribution d'espèces"}
          </h1>
          {selectedSpecies ? (<details className="text-sm font-sans"><summary className="cursor-pointer text-sage-700">{lang === 'EN' ? 'About these maps' : 'À propos de ces cartes'}</summary>{intro}</details>) : intro}
        </div>
      </section>

      {loadError && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-sans">
          {lang === 'EN' ? `Could not load the species list (${loadError}).` : `Impossible de charger la liste des espèces (${loadError}).`}
        </p>
      )}

      {/* Map with the species sidebar floating over it; expand mode fills the screen */}
      <section className={isExpanded
        ? 'fixed inset-0 z-50 w-screen h-screen bg-white'
        : 'relative w-full h-[clamp(420px,calc(100dvh-2rem),640px)] sm:h-[clamp(480px,calc(100dvh-2rem),680px)] rounded-2xl overflow-hidden card-shadow border border-gray-200 bg-white'}>
        {!isSidebarOpen && (
          <button type="button" onClick={() => setIsSidebarOpen(true)}
            title={lang === 'EN' ? 'Open species sidebar' : 'Ouvrir le panneau des espèces'}
            aria-label={lang === 'EN' ? 'Open species sidebar' : 'Ouvrir le panneau des espèces'}
            className="absolute top-3 left-3 z-30 w-8 h-8 bg-white/95 hover:bg-white rounded-lg shadow-md border border-gray-200 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-sage-500">
            <ChevronRight className="w-4 h-4 text-sage-700" />
          </button>
        )}
        {/* The species list holds hundreds of entries: let keyboard users jump past it. A button, not a #link, which would rewrite the page hash */}
        <button type="button" onClick={() => document.querySelector<HTMLElement>('#sdm-view-buttons button')?.focus()} className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-14 focus:z-40 focus:px-3 focus:py-1 focus:rounded-lg focus:bg-white focus:shadow-md focus:text-xs">
          {lang === 'EN' ? 'Skip to map controls' : 'Aller aux commandes de la carte'}
        </button>
        <div className={`absolute inset-y-0 left-0 z-20 w-72 sm:w-[310px] md:w-[350px] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SdmSidebar lang={lang} species={species} loading={loading} selectedId={selectedSdmId} onSelect={(id) => { setSelectedSdmId(id); setAt(null); }} onCollapse={() => setIsSidebarOpen(false)} />
        </div>
        <SdmMap
          slug={slug}
          period={period === '2100-clipped' && clip2100 === false ? '2100' : period}
          onPeriodChange={setPeriod}
          clip2100={!!clip2100}
          showOcc={showOcc}
          onToggleOcc={() => setShowOcc(v => !v)}
          showObs={showObs}
          onToggleObs={() => setObsChoice(!showObs)}
          view={view}
          onViewChange={setView}
          span={span}
          onSpanChange={setSpan}
          at={at}
          onMoved={setAt}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(v => !v)}
          isSidebarOpen={isSidebarOpen}
        />
      </section>

      {/* Selected Species attributes metadata and license below the map */}
      {selectedSpecies && (
        <section className="bg-white rounded-2xl p-6 space-y-5 shadow-md shadow-gray-300 animate-fadeIn">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <h3 className="font-display font-semibold text-xl text-wood-900">
                {selectedName}
              </h3>
              <p className="font-sans text-sm italic text-sage-600 font-semibold mt-0.5">
                {selectedSpecies.scientificName}
              </p>
            </div>
            
            {selectedSpecies.iucnStatus && (
              <span className="bg-amber-50 text-amber-900 text-xs px-2.5 py-1 rounded-full font-sans font-bold border border-amber-200">
                IUCN: {selectedSpecies.iucnStatus}{iucn && ` ${iucn[lang === 'EN' ? 0 : 1]}`}
              </span>
            )}
          </div>

          {/* Technical model parameters */}
          {selectedSpecies.habitatType && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
            <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 text-xs text-gray-500">
              <span className="block text-xs text-gray-500 uppercase tracking-wider font-sans">
                {lang === 'EN' ? "Preferential Habitat" : "Habitat préférentiel"}
              </span>
              <strong className="text-wood-900 mt-0.5 block truncate font-sans" title={lang === 'FR' && selectedSpecies.habitatTypeFr ? selectedSpecies.habitatTypeFr : selectedSpecies.habitatType}>
                {lang === 'FR' && selectedSpecies.habitatTypeFr ? selectedSpecies.habitatTypeFr : selectedSpecies.habitatType}
              </strong>
            </div>
          </div>
          )}
        </section>
      )}

      {/* Map Specifics & Methodology Detail inside collapsible dropdown below the map */}
      <section className="bg-white rounded-2xl overflow-hidden shadow-md shadow-gray-300">
        <button
          onClick={() => setIsMethodologyOpen(!isMethodologyOpen)}
          className="w-full flex justify-between items-center px-6 py-4.5 text-left font-display font-semibold text-wood-950 transition-colors hover:bg-gray-50 focus:outline-none cursor-pointer"
        >
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <Compass className="w-4.5 h-4.5 text-sage-600" />
            <span>{lang === 'EN' ? "Map Specifics & Methodology" : "Spécificités de la carte et méthodologie"}</span>
          </div>
          <div>
            {isMethodologyOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </button>

        {isMethodologyOpen && (
          <div className="p-6 border-t border-gray-100 bg-white space-y-5 animate-fadeIn font-sans text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-500 leading-relaxed font-sans">
              <div className="space-y-2">
                <h5 className="font-semibold text-wood-900 flex items-center gap-1.5 font-display text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage-500" /> {lang === 'EN' ? "Clipping to the known range" : "Découpage selon l'aire connue"}
                </h5>
                <p>
                  {lang === 'EN' 
                    ? "Models predict suitable habitat wherever the climate and landscape fit, including places the species has never been recorded. For the current period, predictions are turned down with distance from the species' known range, built from expert range maps (IUCN) and occurrence records. How fast predictions fade is fitted for each species from how far its records fall outside the expert range, and predictions far beyond that are set to zero."
                    : "Les modèles prédisent un habitat favorable partout où le climat et le paysage conviennent, y compris là où l'espèce n'a jamais été observée. Pour la période actuelle, les prédictions sont atténuées en fonction de la distance à l'aire connue de l'espèce, établie à partir des cartes d'aires d'experts (UICN) et des mentions d'occurrence. La vitesse de cette atténuation est ajustée pour chaque espèce selon la distance de ses mentions à l'aire d'experts, et les prédictions bien au-delà sont mises à zéro."}
                </p>
              </div>
              
              <div className="space-y-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                <h5 className="font-semibold text-wood-900 flex items-center gap-1.5 font-display text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage-500" /> {clip2100 ? (lang === 'EN' ? "2100 projections use the same clip" : "Les projections pour 2100 utilisent le même découpage") : (lang === 'EN' ? "2100 projections are not clipped" : "Les projections pour 2100 ne sont pas découpées")}
                </h5>
                <p>
                  {clip2100 ? (lang === 'EN'
                    ? "Both periods use the same clip, held at the 1980-2010 evidence: the expert range and records describe where the species lives today, so the 2071-2100 map assumes no spread beyond the published decay. Suitability outside today's range is turned down the same way in both, so Current (clipped) and Future (clipped) compare like for like. Turn off \"Clip to known range\" to see the model output alone for both."
                    : "Les deux périodes utilisent le même découpage, figé sur les données 1980-2010 : l'aire d'experts et les mentions décrivent où vit l'espèce aujourd'hui, la carte 2071-2100 suppose donc aucune expansion au-delà de l'atténuation publiée. La convenance hors de l'aire actuelle est atténuée de la même façon dans les deux, ce qui permet de comparer Actuel (découpé) et Futur (découpé) à périmètre égal. Désactivez « Découper selon l'aire connue » pour voir seulement la sortie du modèle pour les deux.") : lang === 'EN'
                    ? "Expert ranges and observations describe where a species lives today, so they cannot be projected into the future. The 2071-2100 maps therefore show unclipped model output. When comparing them with the clipped current maps, suitability outside today's range in 2100 can come from the missing clip rather than a predicted range expansion. Turn off \"Clip to known range\" to see the unclipped current map for a like-for-like comparison."
                    : "Les aires d'experts et les observations décrivent où vit une espèce aujourd'hui; elles ne peuvent donc pas être projetées dans le futur. Les cartes 2071-2100 montrent ainsi les sorties brutes des modèles, sans découpage. Lorsqu'on les compare aux cartes actuelles découpées, la convenance hors de l'aire actuelle en 2100 peut venir de l'absence de découpage plutôt que d'une expansion prévue de l'aire. Désactivez « Découper selon l'aire connue » pour voir la carte actuelle non découpée et comparer à périmètre égal."}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
