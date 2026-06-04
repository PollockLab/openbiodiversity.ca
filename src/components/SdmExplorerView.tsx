import React, { useState } from 'react';
import { Search, Compass, Info, FileDown, Layers, HelpCircle, CheckCircle, Sliders, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { sdmSpeciesList } from '../data/sdmModels';
import GlobePlaceholder from './GlobePlaceholder';

export default function SdmExplorerView() {
  const [selectedSdmId, setSelectedSdmId] = useState<string>('sdm-caribou');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('All');
  
  // Custom Toggles
  const [biasCorrected, setBiasCorrected] = useState<boolean>(true);
  const [showUncertainty, setShowUncertainty] = useState<boolean>(false);
  
  // Collapsible accordion state
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);

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

      {/* Taxon filter, text search, and species dropdown selector strip directly above the map */}
      <section className="bg-white border border-gray-100 rounded-2xl p-5 card-shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 font-sans text-xs">
          
          {/* Taxon categories filter buttons */}
          <div className="space-y-1.5 md:flex-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block font-mono mb-1.5">1. Filter Taxon Group</span>
            <div className="flex flex-wrap gap-1.5">
              {groups.map((grp) => (
                <button
                  key={grp}
                  onClick={() => {
                    setActiveGroupFilter(grp);
                    // Update dropdown selection if existing species doesn't belong to the new group
                    const matching = sdmSpeciesList.filter(s => grp === 'All' ? true : s.taxonGroup === grp);
                    if (matching.length > 0 && !matching.some(m => m.id === selectedSdmId)) {
                      setSelectedSdmId(matching[0].id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none transition-all cursor-pointer ${activeGroupFilter === grp ? 'bg-sage-500 text-white font-medium shadow-3xs' : 'bg-gray-55 hover:bg-gray-100 text-gray-600 border border-transparent'}`}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>

          {/* Search Query Name bar */}
          <div className="space-y-1.5 w-full md:w-64">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block font-mono mb-1.5">2. Search Name</span>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Type name query..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  const val = e.target.value;
                  const matches = sdmSpeciesList.filter((s) => {
                    const matchesGroup = activeGroupFilter === 'All' ? true : s.taxonGroup === activeGroupFilter;
                    const matchesSearch = s.commonName.toLowerCase().includes(val.toLowerCase()) || 
                                          s.scientificName.toLowerCase().includes(val.toLowerCase());
                    return matchesGroup && matchesSearch;
                  });
                  if (matches.length > 0 && !matches.some(m => m.id === selectedSdmId)) {
                    setSelectedSdmId(matches[0].id);
                  }
                }}
                className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sage-500 text-wood-700"
              />
            </div>
          </div>

          {/* Matches dropselector list */}
          <div className="space-y-1.5 w-full md:w-72">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block font-mono">3. Select Species Model</span>
              <span className="font-mono bg-sage-50 text-sage-650 border border-sage-100 px-2 py-0.5 rounded-full text-[9px] font-bold">
                {filteredSpecies.length} Matches
              </span>
            </div>
            <select
              value={selectedSdmId}
              onChange={(e) => setSelectedSdmId(e.target.value)}
              className="w-full bg-white border border-gray-255 text-wood-950 text-xs px-3 py-2.5 rounded-xl font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-sage-500"
            >
              {filteredSpecies.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.commonName} ({spec.scientificName})
                </option>
              ))}
              {filteredSpecies.length === 0 && (
                <option value="">No matching species found</option>
              )}
            </select>
          </div>

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
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 card-shadow animate-fadeIn">
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

          {/* Technical model parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
            <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 text-xs text-gray-500">
              <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-mono">Clipped Boundary</span>
              <strong className="text-wood-900 mt-0.5 block">{selectedSpecies.clippedBy}</strong>
            </div>
            <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 text-xs text-gray-500">
              <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-mono">Preferential Habitat</span>
              <strong className="text-wood-900 mt-0.5 block truncate" title={selectedSpecies.habitatType}>
                {selectedSpecies.habitatType}
              </strong>
            </div>
            <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 text-xs text-gray-500">
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
              className="btn-primary text-white text-xs font-semibold uppercase tracking-widest px-5 py-3 rounded-full transition-all shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-sage-600 border border-transparent"
            >
              <FileDown className="w-4 h-4" /> Download 1km Raster GIS Data (.TIF)
            </button>
          </div>
        </section>
      )}

      {/* Map Specifics & Methodology Detail inside collapsible dropdown below the map */}
      <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden card-shadow">
        <button
          onClick={() => setIsMethodologyOpen(!isMethodologyOpen)}
          className="w-full flex justify-between items-center px-6 py-4.5 text-left font-display font-semibold text-wood-950 transition-colors hover:bg-gray-50 focus:outline-none"
        >
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <Compass className="w-4.5 h-4.5 text-sage-600" />
            <span>Map Specifics & Methodology</span>
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
        )}
      </section>

    </div>
  );
}
