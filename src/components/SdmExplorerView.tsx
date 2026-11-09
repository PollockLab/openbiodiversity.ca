import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Info, Filter, Search, Layers, HelpCircle, CheckCircle, Sliders, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { loadSdmSpecies } from '../data/sdmModels';
import { SDMModel } from '../types';
import SdmMap from './SdmMap';
import { SdmPeriod } from '../data/sdmSource';
import { useLanguage } from '../lib/LanguageContext';

const GROUPS: SDMModel['taxonGroup'][] = ['Mammal', 'Bird', 'Reptile', 'Amphibian'];

const DEFAULT_SPECIES = 'rangifer-tarandus';
const MAX_MATCHES = 50;
// Lowercase and strip diacritics so "epervier" matches "Épervier"
const norm = (s?: string) => (s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
// Species live in the hash as #sdm-explorer?sp=<id>; App.tsx routes on the part before "?"
const speciesFromHash = () => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('sp') || DEFAULT_SPECIES;

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
  const [taxon, setTaxon] = useState<string>('All');
  const [typed, setTyped] = useState<string | null>(null); // null = show the selected name
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const comboRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [period, setPeriod] = useState<SdmPeriod>('current');
  
  useEffect(() => {
    loadSdmSpecies()
      .then(list => {
        setSpecies(list);
        setSelectedSdmId(id => (list.some(s => s.id === id) ? id : DEFAULT_SPECIES));
      })
      .catch(e => setLoadError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.history.replaceState(null, '', `#sdm-explorer?sp=${encodeURIComponent(selectedSdmId)}`);
  }, [selectedSdmId]);

  // Collapsible accordion state
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);

  const translateGroup = (grp: string) => {
    if (lang === 'EN') return grp;
    switch (grp) {
      case 'All': return 'Tous';
      case 'Mammal': return 'Mammifère';
      case 'Bird': return 'Oiseau';
      case 'Reptile': return 'Reptile';
      case 'Amphibian': return 'Amphibien';
      case 'Butterfly': return 'Papillon';
      case 'Tree': return 'Arbre';
      case 'Plant': return 'Plante';
      default: return grp;
    }
  };

  const nameOf = (s: SDMModel) => (lang === 'FR' && s.commonNameFr ? s.commonNameFr : s.commonName);
  const counts = useMemo(() => {
    const c: Record<string, number> = { All: species.length };
    species.forEach(s => { c[s.taxonGroup] = (c[s.taxonGroup] || 0) + 1; });
    return c;
  }, [species]);
  const index = useMemo(() => species.map(s => ({ s, names: [s.commonName, s.commonNameFr, s.scientificName].map(norm).filter(Boolean) })), [species]);
  const filtered = useMemo(() => {
    const q = norm(typed ?? '').trim();
    const rows = index.filter(r => (taxon === 'All' || r.s.taxonGroup === taxon) && (!q || r.names.some(n => n.includes(q))));
    if (!q) return rows.map(r => r.s);
    const rank = (r: typeof rows[number]) => (r.names.some(n => n.startsWith(q)) ? 0 : 1);
    return rows.map(r => ({ r, k: rank(r) })).sort((x, y) => x.k - y.k).map(x => x.r.s);
  }, [index, taxon, typed]);
  const shown = filtered.slice(0, MAX_MATCHES);

  const selectedSpecies = species.find(s => s.id === selectedSdmId);
  const choose = (s: SDMModel) => {
    setSelectedSdmId(s.id);
    setOpen(false);
    setTyped(null);
    setActive(-1);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      if (!shown.length) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive(i => (i + step + shown.length) % shown.length);
    } else if (e.key === 'Enter') {
      if (open && shown.length) { e.preventDefault(); choose(shown[Math.max(active, 0)]); }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setTyped(null);
      setActive(-1);
    }
  };
  const onBlur = (e: React.FocusEvent) => {
    if (comboRef.current?.contains(e.relatedTarget as Node)) return;
    setOpen(false);
    setTyped(null);
    setActive(-1);
  };
  const iucn = selectedSpecies?.iucnStatus ? IUCN_LABELS[selectedSpecies.iucnStatus] : undefined;
  const selectedName = selectedSpecies && nameOf(selectedSpecies);
  const rawQuery = (typed ?? '').trim();

  return (
    <div className="space-y-8 pb-16">
      
      {/* Intro descriptive card */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 card-shadow">
        <div>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl text-wood-900 tracking-tight">
            {lang === 'EN' ? "Canada Terrestrial Vertebrate & Flora SDM Explorer" : "Explorateur de MDE des vertébrés terrestres et de la flore du Canada"}
          </h1>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed font-sans">
            {lang === 'EN' 
              ? "Explore species distribution models at 1 km resolution across Canada and the United States. Each map is the mean of three models (boosted regression trees, MaxEnt and random forest). Current maps (1980-2010) are clipped to each species' known range; 2100 projections are not (see Methodology)."
              : "Explorez des modèles de distribution d'espèces à une résolution de 1 km pour le Canada et les États-Unis. Chaque carte est la moyenne de trois modèles (arbres de régression boostés, MaxEnt et forêt aléatoire). Les cartes actuelles (1980-2010) sont découpées selon l'aire connue de chaque espèce; les projections pour 2100 ne le sont pas (voir Méthodologie)."}
          </p>
        </div>
      </section>

      {/* Map visualizer fully spanning horizontally */}
      <section className="w-full">
        {loadError && (
          <p role="alert" className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-sans">
            {lang === 'EN' ? `Could not load the species list (${loadError}).` : `Impossible de charger la liste des espèces (${loadError}).`}
          </p>
        )}
        <div className="mb-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2 font-sans">
            <span className="flex items-center gap-1 text-xs text-gray-500 mr-1">
              <Filter className="w-3.5 h-3.5" /> {lang === 'EN' ? 'Taxon:' : 'Taxon :'}
            </span>
            {['All', ...GROUPS].map(g => (
              <button
                key={g}
                onClick={() => setTaxon(g)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${taxon === g ? 'bg-sage-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                {translateGroup(g)} ({counts[g] || 0})
              </button>
            ))}
          </div>
          <div ref={comboRef} onBlur={onBlur} className="relative w-full sm:max-w-xl font-sans">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls="sdm-listbox"
              aria-autocomplete="list"
              aria-activedescendant={open && active >= 0 ? `sdm-opt-${active}` : undefined}
              aria-label={lang === 'EN' ? 'Search species' : 'Rechercher une espèce'}
              autoComplete="off"
              disabled={loading}
              value={loading ? (lang === 'EN' ? 'Loading…' : 'Chargement…') : (typed ?? selectedName ?? '')}
              onChange={e => { setTyped(e.target.value); setOpen(true); setActive(-1); }}
              onFocus={e => { setOpen(true); e.currentTarget.select(); }}
              onClick={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder={lang === 'EN' ? 'Search by common or scientific name…' : 'Rechercher par nom vernaculaire ou scientifique…'}
              className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-9 py-2 text-sm font-sans text-wood-900 truncate"
            />
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {open && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <ul id="sdm-listbox" role="listbox" aria-label={lang === 'EN' ? 'Species' : 'Espèce'} className="max-h-72 overflow-y-auto">
                  {shown.map((s, i) => (
                    <li
                      key={s.id}
                      id={`sdm-opt-${i}`}
                      role="option"
                      aria-selected={i === active}
                      ref={el => { if (i === active) el?.scrollIntoView({ block: 'nearest' }); }}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { choose(s); inputRef.current?.focus(); }}
                      onMouseMove={() => active !== i && setActive(i)}
                      className={`px-3 py-2 cursor-pointer flex items-baseline justify-between gap-3 ${i === active ? 'bg-sage-50' : ''} ${s.id === selectedSdmId ? 'font-semibold' : ''}`}
                    >
                      <span className="min-w-0 truncate text-sm text-wood-900">
                        {nameOf(s)} <span className="italic font-mono text-xs text-gray-500">{s.scientificName}</span>
                      </span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-gray-400 font-mono">{translateGroup(s.taxonGroup)}</span>
                    </li>
                  ))}
                </ul>
                {!shown.length && (
                  <p role="status" className="px-3 py-3 text-sm text-gray-500">
                    {lang === 'EN' ? `No species match "${rawQuery}"` : `Aucune espèce ne correspond à « ${rawQuery} »`}
                  </p>
                )}
                {filtered.length > MAX_MATCHES && (
                  <p className="px-3 py-1.5 text-xs text-gray-400 border-t border-gray-100">
                    {lang === 'EN' ? `Showing ${MAX_MATCHES} of ${filtered.length}` : `${MAX_MATCHES} sur ${filtered.length}`}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <SdmMap slug={selectedSpecies?.ecccSlug ?? selectedSdmId} period={period} onPeriodChange={setPeriod} />
      </section>

      {/* Selected Species attributes metadata and license below the map */}
      {selectedSpecies && (
        <section className="bg-white rounded-2xl p-6 space-y-5 shadow-md shadow-gray-300 animate-fadeIn">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                <span>{lang === 'EN' ? "Taxonomic Class:" : "Classe taxonomique :"} {translateGroup(selectedSpecies.taxonGroup)}</span>
              </div>
              <h3 className="font-display font-semibold text-xl text-wood-900 mt-1">
                {selectedName}
              </h3>
              <p className="font-mono text-sm italic text-sage-500 font-semibold mt-0.5">
                {selectedSpecies.scientificName}
              </p>
            </div>
            
            {selectedSpecies.iucnStatus && (
              <span className="bg-amber-50 text-amber-900 text-xs px-2.5 py-1 rounded-full font-mono font-bold border border-amber-200">
                IUCN: {selectedSpecies.iucnStatus}{iucn && ` ${iucn[lang === 'EN' ? 0 : 1]}`}
              </span>
            )}
          </div>

          {/* Technical model parameters */}
          {selectedSpecies.habitatType && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
            <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 text-xs text-gray-500">
              <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-mono">
                {lang === 'EN' ? "Preferential Habitat" : "Habitat préférentiel"}
              </span>
              <strong className="text-wood-900 mt-0.5 block truncate" title={lang === 'FR' && selectedSpecies.habitatTypeFr ? selectedSpecies.habitatTypeFr : selectedSpecies.habitatType}>
                {lang === 'FR' && selectedSpecies.habitatTypeFr ? selectedSpecies.habitatTypeFr : selectedSpecies.habitatType}
              </strong>
            </div>
          </div>
          )}

          <p className="border-t border-gray-100 pt-5 text-xs text-gray-500 font-sans">
            {lang === 'EN' ? 'Models by the Pollock Lab, licensed under ' : 'Modèles du laboratoire Pollock, sous licence '}
            <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener noreferrer license" className="underline hover:text-sage-600">CC BY-NC 4.0</a>
            {lang === 'EN' ? '. Downloads will be available once the layers are published.' : '. Le téléchargement sera offert une fois les couches publiées.'}
          </p>
        </section>
      )}

      {/* Map Specifics & Methodology Detail inside collapsible dropdown below the map */}
      <section className="bg-white rounded-2xl overflow-hidden shadow-md shadow-gray-300">
        <button
          onClick={() => setIsMethodologyOpen(!isMethodologyOpen)}
          className="w-full flex justify-between items-center px-6 py-4.5 text-left font-display font-semibold text-wood-950 transition-colors hover:bg-gray-50 focus:outline-none"
        >
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <Compass className="w-4.5 h-4.5 text-sage-600" />
            <span>{lang === 'EN' ? "Map Specifics & Methodology" : "Spécificités de la carte et méthodologie"}</span>
          </div>
          <div>
            {isMethodologyOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-450" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-455" />
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
                  <span className="w-1.5 h-1.5 rounded-full bg-sage-500" /> {lang === 'EN' ? "2100 projections are not clipped" : "Les projections pour 2100 ne sont pas découpées"}
                </h5>
                <p>
                  {lang === 'EN'
                    ? "Expert ranges and observations describe where a species lives today, so they cannot be projected into the future. The 2071-2100 maps therefore show unclipped model output. When comparing them with the clipped current maps, suitability outside today's range in 2100 can come from the missing clip rather than a predicted range expansion."
                    : "Les aires d'experts et les observations décrivent où vit une espèce aujourd'hui; elles ne peuvent donc pas être projetées dans le futur. Les cartes 2071-2100 montrent ainsi les sorties brutes des modèles, sans découpage. Lorsqu'on les compare aux cartes actuelles découpées, la convenance hors de l'aire actuelle en 2100 peut venir de l'absence de découpage plutôt que d'une expansion prévue de l'aire."}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
