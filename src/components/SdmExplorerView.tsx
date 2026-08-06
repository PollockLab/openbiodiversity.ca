import React, { useState } from 'react';
import { Compass, Info, FileDown, Layers, HelpCircle, CheckCircle, Sliders, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { sdmSpeciesList } from '../data/sdmModels';
import GlobePlaceholder from './GlobePlaceholder';
import { useLanguage } from '../lib/LanguageContext';

export default function SdmExplorerView() {
  const { lang } = useLanguage();
  const [selectedSdmId, setSelectedSdmId] = useState<string>('sdm-caribou');
  
  // Custom Toggles
  const [biasCorrected, setBiasCorrected] = useState<boolean>(true);
  const [showUncertainty, setShowUncertainty] = useState<boolean>(false);
  
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

  const selectedSpecies = sdmSpeciesList.find(s => s.id === selectedSdmId) || sdmSpeciesList[0];
  const selectedName = lang === 'FR' && selectedSpecies?.commonNameFr ? selectedSpecies.commonNameFr : selectedSpecies?.commonName;

  const handleDownloadModel = (name: string, isBias: boolean) => {
    if (lang === 'EN') {
      alert(`Downloading 1km GeoTIFF raster for: ${name}\nEnsemble Type: ${isBias ? 'Bias-Corrected Ensemble' : 'Raw Machine-Learning Ensemble'}\nClipped boundary bounds: IUCN + occupancy constraints.`);
    } else {
      alert(`Téléchargement de la trame GeoTIFF de 1 km pour : ${name}\nType d'ensemble : ${isBias ? 'Ensemble corrigé des biais' : 'Ensemble brut d\'apprentissage automatique'}\nLimites de coupure : UICN + contraintes d'occupation.`);
    }
  };

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
              ? "Explore over 500 species distribution models at 1km spatial resolution. Models are constructed using ensemble algorithms (MaxEnt, Random Forests, XGBoost) and are clipped using IUCN ranges as well as Noah's occupant-envelope method to minimize spatial over-prediction."
              : "Explorez plus de 500 modèles de distribution d'espèces à une résolution spatiale de 1 km. Les modèles sont construits à l'aide d'algorithmes d'ensemble (MaxEnt, Random Forests, XGBoost) et sont découpés selon les aires de l'UICN ainsi que la méthode de l'enveloppe d'occupation de Noah afin de minimiser la sur-prédiction spatiale."}
          </p>
        </div>
      </section>

      {/* Map visualizer fully spanning horizontally */}
      <section className="w-full">
        <GlobePlaceholder
          mode="sdm-explorer"
          selectedSdmId={selectedSdmId}
          activeTaxonGroup={selectedSpecies?.taxonGroup}
          biasCorrected={biasCorrected}
          onBiasCorrectedChange={setBiasCorrected}
          showUncertainty={showUncertainty}
          onShowUncertaintyChange={setShowUncertainty}
        />
      </section>

      {/* Selected Species attributes metadata and download triggers below the map */}
      {selectedSpecies && (
        <section className="bg-white rounded-2xl p-6 space-y-5 shadow-md shadow-gray-300 animate-fadeIn">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                <span>{lang === 'EN' ? "Taxonomic Class:" : "Classe taxonomique :"} {translateGroup(selectedSpecies.taxonGroup)}</span>
                <span>&bull;</span>
                <span>{lang === 'EN' ? "Resolution:" : "Résolution :"} {selectedSpecies.resolution === '1km Terrestrial' && lang === 'FR' ? '1km terrestre' : selectedSpecies.resolution}</span>
              </div>
              <h3 className="font-display font-semibold text-xl text-wood-900 mt-1">
                {selectedName}
              </h3>
              <p className="font-mono text-sm italic text-sage-500 font-semibold mt-0.5">
                {selectedSpecies.scientificName}
              </p>
            </div>
            
            <span className="bg-amber-50 text-amber-900 text-xs px-2.5 py-1 rounded-full font-mono font-bold border border-amber-200">
              IUCN: {selectedSpecies.iucnStatus}
            </span>
          </div>

          {/* Technical model parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
            <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 text-xs text-gray-500">
              <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-mono">
                {lang === 'EN' ? "Clipped Boundary" : "Limite de coupure"}
              </span>
              <strong className="text-wood-900 mt-0.5 block">
                {selectedSpecies.clippedBy === "Noah's Method" && lang === 'FR' ? "Méthode de Noah" : selectedSpecies.clippedBy}
              </strong>
            </div>
            <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 text-xs text-gray-500">
              <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-mono">
                {lang === 'EN' ? "Preferential Habitat" : "Habitat préférentiel"}
              </span>
              <strong className="text-wood-900 mt-0.5 block truncate" title={lang === 'FR' && selectedSpecies.habitatTypeFr ? selectedSpecies.habitatTypeFr : selectedSpecies.habitatType}>
                {lang === 'FR' && selectedSpecies.habitatTypeFr ? selectedSpecies.habitatTypeFr : selectedSpecies.habitatType}
              </strong>
            </div>
            <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 text-xs text-gray-500">
              <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-mono">
                {lang === 'EN' ? "Model Consistency (AUC)" : "Cohérence du modèle (AUC)"}
              </span>
              <strong className="text-sage-500 mt-0.5 block font-mono">
                {lang === 'EN' ? "0.89 (High Precision)" : "0,89 (Haute précision)"}
              </strong>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 flex flex-wrap justify-between items-center gap-4">
            <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sage-500 inline-block" />
              {lang === 'EN' ? "Bias Corrected Model GeoTIFF Available" : "Modèle GeoTIFF corrigé des biais disponible"}
            </div>
            <button
              onClick={() => handleDownloadModel(selectedName || '', biasCorrected)}
              className="btn-primary text-white text-xs font-semibold uppercase tracking-widest px-5 py-3 rounded-full transition-all shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-sage-600 border border-transparent"
            >
              <FileDown className="w-4 h-4" /> {lang === 'EN' ? "Download 1km Raster GIS Data (.TIF)" : "Télécharger les données SIG matricielles de 1 km (.TIF)"}
            </button>
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
                  <span className="w-1.5 h-1.5 rounded-full bg-sage-500" /> {lang === 'EN' ? "Noah's Occupancy-Envelope Method" : "Méthode de l'enveloppe d'occupation de Noah"}
                </h5>
                <p>
                  {lang === 'EN' 
                    ? "Classical species distribution models tend to project species uniformly inside a wide bounding polygon overlay. Noah's Occupancy-Envelope method combines local elevation indices, land forest canopy density, and hydrological distances to clip the models. This restricts predictions purely to accessible valleys, achieving an average 34% error rate reduction in surveys."
                    : "Les modèles classiques de distribution d'espèces ont tendance à projeter les espèces de manière uniforme à l'intérieur d'un large polygone de délimitation. La méthode de l'enveloppe d'occupation de Noah combine des indices d'altitude locaux, la densité de la canopée forestière et les distances hydrologiques pour découper les modèles. Cela limite les prédictions uniquement aux vallées accessibles, permettant d'obtenir une réduction moyenne de 34 % du taux d'erreur dans les inventaires."}
                </p>
              </div>
              
              <div className="space-y-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                <h5 className="font-semibold text-wood-900 flex items-center gap-1.5 font-display text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage-500" /> {lang === 'EN' ? "Pollock Lab Specialty" : "Spécialité du laboratoire Pollock"}
                </h5>
                <p>
                  {lang === 'EN'
                    ? "Standard citizen-science datasets are heavily biased towards highways and trail networks. The Pollock Lab's specialty correction algorithm models local observer density weight tables to discount artificial cluster zones, bringing you an ecologically balanced prediction map instead of a map representing user activity density."
                    : "Les ensembles de données de science citoyenne standard sont fortement biaisés en faveur des autoroutes et des réseaux de sentiers. L'algorithme de correction spécialisé du laboratoire Pollock modélise des tables de pondération de densité d'observateurs locaux pour ignorer les zones de regroupement artificielles, vous offrant ainsi une carte de prédiction écologiquement équilibrée au lieu d'une carte représentant la densité d'activité des utilisateurs."}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
