import React, { useState } from 'react';
import { Search, Compass, Info, FileDown, Layers, HelpCircle, ToggleLeft, ToggleRight, CheckCircle, Sliders, Shield } from 'lucide-react';
import { sdmSpeciesList } from '../data/sdmModels';
import GlobePlaceholder from './GlobePlaceholder';

export default function SdmExplorerView() {
  const [selectedSdmId, setSelectedSdmId] = useState<string>('sdm-caribou');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('All');
  
  // Custom Toggles
  const [biasCorrected, setBiasCorrected] = useState<boolean>(true);
  const [showUncertainty, setShowUncertainty] = useState<boolean>(false);

  const groups = ['All', 'Mammal', 'Bird', 'Reptile', 'Amphibian', 'Butterfly', 'Tree', 'Plant'];

  const filteredSpecies = sdmSpeciesList.filter((s) => {
    const matchesGroup = activeGroupFilter === 'All' ? true : s.taxonGroup === activeGroupFilter;
    const matchesSearch = s.commonName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const selectedSpecies = sdmSpeciesList.find(s => s.id === selectedSdmId) || sdmSpeciesList[0];

  const handleDownloadModel = (name: string, isBias: boolean) => {
    alert(`Downloading 1km GeoTIFF raster for: ${name}\nEnsemble Type: ${isBias ? 'Bias-Corrected Ensemble' : 'Raw Machine-Learning Ensemble'}\nClipped boundary bounds: IUCN + occupancy constraints.`);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Intro descriptive card */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 card-shadow">
        <div>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl text-wood-900 tracking-tight">
            Canada Terrestrial Vertebrate & Flora SDM Explorer
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-3xl leading-relaxed font-sans">
            Explore over 500 species distribution models at 1km spatial resolution. Models are constructed using ensemble algorithms (MaxEnt, Random Forests, XGBoost) and are clipped using IUCN ranges as well as <strong className="text-wood-950 font-medium">Noah's occupant-envelope method</strong> to minimize spatial over-prediction.
          </p>
        </div>
      </section>

      {/* Main Panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Species selections & lookup */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 card-shadow">
            {/* Direct text lookup */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search common or scientific name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 text-wood-700"
              />
            </div>

            {/* Taxon categories filter */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block font-mono">Taxon Group</span>
              <div className="flex flex-wrap gap-1.5">
                {groups.map((grp) => (
                  <button
                    key={grp}
                    onClick={() => setActiveGroupFilter(grp)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeGroupFilter === grp ? 'btn-primary text-white font-medium shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {grp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List of species matching searches */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden card-shadow">
            <div className="p-4 bg-gray-50 border-b border-gray-100 font-display font-semibold text-wood-900 text-xs flex justify-between items-center">
              <span>SPECIES FILTER INDEX</span>
              <span className="font-mono bg-sage-50 text-sage-650 border border-sage-100 px-2 py-0.5 rounded-full text-[10px]">
                {filteredSpecies.length} of {sdmSpeciesList.length} Models
              </span>
            </div>

            <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto font-sans">
              {filteredSpecies.map((spec) => (
                <div
                  key={spec.id}
                  onClick={() => setSelectedSdmId(spec.id)}
                  className={`p-4 text-left transition-all cursor-pointer ${selectedSdmId === spec.id ? 'bg-sage-50/40 border-l-4 border-sage-500' : 'hover:bg-gray-50/50'}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-semibold text-sage-500 uppercase font-mono">{spec.taxonGroup}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-mono font-medium">{spec.iucnStatus.split(' ')[0]}</span>
                  </div>
                  <h4 className="font-display font-semibold text-sm text-wood-950 mt-1">
                    {spec.commonName}
                  </h4>
                  <p className="font-mono text-xs text-gray-400 italic mt-0.5 leading-none">
                    {spec.scientificName}
                  </p>
                </div>
              ))}
              {filteredSpecies.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-500 font-sans">
                  No species matching query sequence.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Map representation & technical stats */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Simplified presentation toggles */}
          <div className="bg-white border border-gray-150 p-4 rounded-2xl card-shadow flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-gray-550" />
              <span className="text-xs font-semibold text-wood-900 font-display">Model Presentation</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setBiasCorrected(!biasCorrected)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${biasCorrected ? 'bg-sage-600 text-white shadow-sm' : 'bg-gray-50 text-gray-650 border border-gray-200 hover:bg-gray-100'}`}
              >
                {biasCorrected ? 'Bias-Correction: ON' : 'Raw Observations'}
              </button>

              <button
                onClick={() => setShowUncertainty(!showUncertainty)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${showUncertainty ? 'bg-fuchsia-600 text-white shadow-sm' : 'bg-gray-50 text-gray-650 border border-gray-200 hover:bg-gray-100'}`}
              >
                {showUncertainty ? 'Uncertainty Active' : 'Uncertainty Hidden'}
              </button>
            </div>
          </div>

          <GlobePlaceholder
            mode="sdm-explorer"
            selectedSdmId={selectedSdmId}
            activeTaxonGroup={selectedSpecies?.taxonGroup}
            biasCorrected={biasCorrected}
            showUncertainty={showUncertainty}
          />

          {/* Species technical metadata card */}
          {selectedSpecies && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 card-shadow animate-fadeIn">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                    <span>Taxonomic Class: {selectedSpecies.taxonGroup}</span>
                    <span>&bull;</span>
                    <span>Resolution: {selectedSpecies.resolution}</span>
                  </div>
                  <h3 className="font-display font-semibold text-xl text-wood-900 mt-1">
                    {selectedSpecies.commonName}
                  </h3>
                  <p className="font-mono text-sm italic text-sage-500 font-semibold mt-0.5">
                    {selectedSpecies.scientificName}
                  </p>
                </div>
                
                <span className="bg-amber-50 text-amber-900 text-xs px-2.5 py-1 rounded-full font-mono font-bold border border-amber-200">
                  IUCN: {selectedSpecies.iucnStatus}
                </span>
              </div>

              {/* Technical model clipping strategy details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-500">
                  <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-mono">Clipped Boundary</span>
                  <strong className="text-wood-900 mt-0.5 block">{selectedSpecies.clippedBy}</strong>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-500">
                  <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-mono">Preferential Habitat</span>
                  <strong className="text-wood-900 mt-0.5 block truncate" title={selectedSpecies.habitatType}>
                    {selectedSpecies.habitatType}
                  </strong>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-500">
                  <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-mono">Model Consistency (AUC)</span>
                  <strong className="text-sage-500 mt-0.5 block font-mono">0.89 (High Precision)</strong>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 flex flex-wrap justify-between items-center gap-4">
                <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sage-500 inline-block" />
                  Bias Corrected Model GeoTIFF Available
                </div>
                <button
                  onClick={() => handleDownloadModel(selectedSpecies.commonName, biasCorrected)}
                  className="btn-primary text-white text-xs font-semibold uppercase tracking-widest px-5 py-3 rounded-full transition-all shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-sage-600"
                >
                  <FileDown className="w-4 h-4" /> Download 1km Raster GIS Data (.TIF)
                </button>
              </div>

            </div>
          )}

          {/* Map Specifics & Methodology Detail */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 card-shadow font-sans font-sans">
            <h4 className="font-display font-semibold text-xs text-wood-950 uppercase tracking-wider border-b border-gray-100 pb-2.5 flex items-center gap-2">
              <Compass className="w-4 h-4 text-sage-600" /> Map Specifics & Methodology
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-500 leading-relaxed font-sans">
              <div className="space-y-2">
                <h5 className="font-semibold text-wood-900 flex items-center gap-1.5 font-display text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage-500" /> Noah's Occupancy-Envelope Method
                </h5>
                <p>
                  Classical species distribution models tend to project species uniformly inside a wide bounding polygon overlay. <span className="text-wood-950 font-semibold font-sans">Noah's Occupancy-Envelope method</span> combines local elevation indices, land forest canopy density, and hydrological distances to clip the models. This restricts predictions purely to accessible valleys, achieving an average <strong className="text-wood-900 font-semibold">34% error rate reduction</strong> in surveys.
                </p>
              </div>
              
              <div className="space-y-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                <h5 className="font-semibold text-wood-900 flex items-center gap-1.5 font-display text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage-500" /> Pollock Lab Specialty
                </h5>
                <p>
                  Standard citizen-science datasets are heavily biased towards highways and trail networks. The Pollock Lab's specialty correction algorithm models local observer density weight tables to discount artificial cluster zones, bringing you an ecologically balanced prediction map instead of a map representing user activity density.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
