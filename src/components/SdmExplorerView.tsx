import React, { useEffect, useState } from 'react';
import { Compass, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { loadSdmSpecies } from '../data/sdmModels';
import { SDMModel } from '../types';
import SdmMap from './SdmMap';
import SdmSidebar from './SdmSidebar';
import { SdmPeriod } from '../data/sdmSource';
import { useLanguage } from '../lib/LanguageContext';

const DEFAULT_SPECIES = 'rangifer-tarandus';
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
  const [period, setPeriod] = useState<SdmPeriod>('current');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  // Esc leaves expanded mode (the sidebar search consumes Esc while its list is open)
  useEffect(() => {
    if (!isExpanded) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isExpanded]);

  // Collapsible accordion state
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);

  const translateGroup = (grp: string) => {
    if (lang === 'EN') return grp;
    return ({ Mammal: 'Mammifère', Bird: 'Oiseau', Reptile: 'Reptile', Amphibian: 'Amphibien' } as Record<string, string>)[grp] ?? grp;
  };

  const nameOf = (s: SDMModel) => (lang === 'FR' && s.commonNameFr ? s.commonNameFr : s.commonName);

  const selectedSpecies = species.find(s => s.id === selectedSdmId);
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

      {loadError && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-sans">
          {lang === 'EN' ? `Could not load the species list (${loadError}).` : `Impossible de charger la liste des espèces (${loadError}).`}
        </p>
      )}

      {/* Map with the species sidebar floating over it; expand mode fills the screen */}
      <section className={isExpanded
        ? 'fixed inset-0 z-50 w-screen h-screen bg-white'
        : 'relative w-full h-[640px] sm:h-[680px] rounded-2xl overflow-hidden card-shadow border border-gray-200 bg-white'}>
        {!isSidebarOpen && (
          <button type="button" onClick={() => setIsSidebarOpen(true)}
            title={lang === 'EN' ? 'Open species sidebar' : 'Ouvrir le panneau des espèces'}
            aria-label={lang === 'EN' ? 'Open species sidebar' : 'Ouvrir le panneau des espèces'}
            className="absolute top-3 left-3 z-30 w-8 h-8 bg-white/95 hover:bg-white rounded-lg shadow-md border border-gray-200 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-sage-500">
            <ChevronRight className="w-4 h-4 text-sage-700" />
          </button>
        )}
        <div className={`absolute inset-y-0 left-0 z-20 w-72 sm:w-[310px] md:w-[350px] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SdmSidebar lang={lang} species={species} loading={loading} selectedId={selectedSdmId} onSelect={setSelectedSdmId} onCollapse={() => setIsSidebarOpen(false)} />
        </div>
        <SdmMap
          slug={selectedSpecies?.ecccSlug ?? selectedSdmId}
          period={period}
          onPeriodChange={setPeriod}
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
