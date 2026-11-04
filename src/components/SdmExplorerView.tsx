import React, { useEffect, useMemo, useState } from 'react';
import { Compass, Info, FileDown, Filter, Search, Layers, HelpCircle, CheckCircle, Sliders, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { loadSdmSpecies } from '../data/sdmModels';
import { SDMModel } from '../types';
import SdmMap from './SdmMap';
import { sdmCogUrl, SdmPeriod } from '../data/sdmSource';
import { useLanguage } from '../lib/LanguageContext';

const GROUPS: SDMModel['taxonGroup'][] = ['Mammal', 'Bird', 'Reptile', 'Amphibian'];

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
  const [selectedSdmId, setSelectedSdmId] = useState<string>('rangifer-tarandus');
  const [species, setSpecies] = useState<SDMModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [taxon, setTaxon] = useState<string>('All');
  const [query, setQuery] = useState<string>('');
  const [period, setPeriod] = useState<SdmPeriod>('current');
  
  useEffect(() => {
    loadSdmSpecies()
      .then(setSpecies)
      .catch(e => setLoadError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, []);

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
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return species.filter(s =>
      (taxon === 'All' || s.taxonGroup === taxon) &&
      (!q || [s.commonName, s.commonNameFr, s.scientificName].some(n => n?.toLowerCase().includes(q))));
  }, [species, taxon, query]);

  const selectedSpecies = species.find(s => s.id === selectedSdmId);
  // Keep the map's species selectable even when the filters exclude it
  const options = selectedSpecies && !filtered.includes(selectedSpecies) ? [selectedSpecies, ...filtered] : filtered;
  const iucn = selectedSpecies?.iucnStatus ? IUCN_LABELS[selectedSpecies.iucnStatus] : undefined;
  const selectedName = selectedSpecies && nameOf(selectedSpecies);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={lang === 'EN' ? 'Search by common or scientific name…' : 'Rechercher par nom vernaculaire ou scientifique…'}
                aria-label={lang === 'EN' ? 'Search species' : 'Rechercher une espèce'}
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm font-sans text-wood-900"
              />
            </div>
            <select
              value={selectedSdmId}
              onChange={e => setSelectedSdmId(e.target.value)}
              disabled={loading}
              aria-label={lang === 'EN' ? 'Species' : 'Espèce'}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans text-wood-900"
            >
              {loading && <option>{lang === 'EN' ? 'Loading…' : 'Chargement…'}</option>}
              {options.map(s => (
                <option key={s.id} value={s.id}>
                  {nameOf(s)} ({s.scientificName})
                </option>
              ))}
            </select>
          </div>
        </div>
        <SdmMap slug={selectedSpecies?.ecccSlug ?? selectedSdmId} period={period} onPeriodChange={setPeriod} />
      </section>

      {/* Selected Species attributes metadata and download triggers below the map */}
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

          <div className="border-t border-gray-100 pt-5 flex flex-wrap justify-between items-center gap-4">
            <a
              href={sdmCogUrl(selectedSpecies.ecccSlug, period)}
              download
              className={`btn-primary text-white text-xs font-semibold uppercase tracking-widest px-5 py-3 rounded-full transition-all shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-sage-600 border border-transparent`}
            >
              <FileDown className="w-4 h-4" /> {lang === 'EN' ? "Download Raster (.TIF)" : "Télécharger le raster (.TIF)"}
              {period === '2100' && (lang === 'EN' ? ', 2100, unclipped' : ', 2100, non découpé')}
            </a>
          </div>
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
