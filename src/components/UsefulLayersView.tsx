import React, { useState } from 'react';
import { Layers, Download, CheckCircle2, FileText, ChevronDown, X } from 'lucide-react';
import { usefulLayersCanada } from '../data/biodiversityLayers';
import GlobePlaceholder from './GlobePlaceholder';
import { useLanguage } from '../lib/LanguageContext';

export default function UsefulLayersView() {
  const { lang } = useLanguage();
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [layerOpacities, setLayerOpacities] = useState<Record<string, number>>({});
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Toggle selection
  const handleToggleLayer = (id: string) => {
    let next: string[];
    if (selectedLayerIds.includes(id)) {
      next = selectedLayerIds.filter(l => l !== id);
    } else {
      next = [...selectedLayerIds, id];
    }
    
    // Auto-fill opacity support if not defined yet
    if (layerOpacities[id] === undefined) {
      setLayerOpacities(prev => ({ ...prev, [id]: 80 }));
    }
    
    setSelectedLayerIds(next);
    
    if (next.length === 0) {
      setActiveTabId('');
    } else if (!next.includes(activeTabId) || activeTabId === '') {
      setActiveTabId(next[next.length - 1]); // focus on the newly selected layer
    }
  };

  const handleOpacityChange = (id: string, value: number) => {
    setLayerOpacities(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleDownloadStub = (format: string, name: string) => {
    if (lang === 'EN') {
      alert(`Generating download bundle for ${name} (${format}).\nIn a production environment, this initiates a secure download block directly from our cloud storage bucket.`);
    } else {
      alert(`Génération du lot de téléchargement pour ${name} (${format}).\nDans un environnement de production, cela lance un bloc de téléchargement sécurisé directement depuis notre conteneur de stockage cloud.`);
    }
  };

  // Get active layer details object for the currently focused tab
  const activeTabLayer = usefulLayersCanada.find(layer => layer.id === activeTabId);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Intro Header */}
      <section className="bg-white rounded-2xl p-6 md:p-8 shadow-md shadow-gray-300">
        <h1 className="font-display font-semibold text-2xl sm:text-3xl text-wood-900 tracking-tight">
          {lang === 'EN' ? "10 Useful Layers for Conservation in Canada" : "10 couches utiles pour la conservation au Canada"}
        </h1>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed font-sans">
          {lang === 'EN' 
            ? "Key layers to inform conservation planning and guide land use decisions. These layers were identified with the aim of providing useful and transparent data, accessible and applicable Canada-wide. They do not stand to replace local knowledge or detailed regional datasets, but rather to provide a groundwork from which more specific assessments can take shape."
            : "Couches clés pour éclairer la planification de la conservation et guider les décisions d'utilisation du territoire. Ces couches ont été identifiées dans le but de fournir des données utiles et transparentes, accessibles et applicables à l'échelle du Canada. Elles ne visent pas à remplacer les connaissances locales ou les ensembles de données régionaux détaillés, mais plutôt à fournir une base à partir de laquelle des évaluations plus spécifiques peuvent prendre forme."}
        </p>
      </section>

      {/* Map + Chrome Tabs Unified Box */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-md shadow-gray-300 flex flex-col">
        
        {/* Map Container */}
        <div className="relative w-full border-b border-gray-250">
          <GlobePlaceholder
            mode="useful-layers"
            selectedLayerIds={selectedLayerIds}
            layerOpacities={layerOpacities}
          />

          {/* Sleek Floaty Dropdown Checkbox list that lies ON top of the Map */}
          <div className="absolute top-4 left-4 z-20 font-sans pointer-events-auto">
            {!isDropdownOpen ? (
              <div className="bg-white/95 backdrop-blur-md rounded-xl border border-sage-200 shadow-md">
                <button
                  onClick={() => setIsDropdownOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 hover:bg-gray-50/80 rounded-xl transition-all text-xs font-semibold text-wood-900 cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-sage-600" />
                  <span>{lang === 'EN' ? "Layers" : "Couches"}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-455" />
                </button>
              </div>
            ) : (
              <div className="bg-white/95 backdrop-blur-md rounded-xl border border-sage-200 shadow-md w-64 sm:w-72 max-h-[460px] overflow-y-auto flex flex-col">
                {/* Header / Title block of the SAME box */}
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center justify-between w-full px-4 py-3 border-b border-gray-150 text-xs font-bold text-wood-950 hover:bg-gray-50/50 transition-all text-left"
                >
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sage-600" />
                    <span>{lang === 'EN' ? "Visible Layers" : "Couches visibles"}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-455 rotate-180" />
                </button>

                {/* List of layers - smaller, no outline boxes unless selected */}
                <div className="p-3 space-y-2">
                  {usefulLayersCanada.map((layer) => {
                    const isChecked = selectedLayerIds.includes(layer.id);
                    const layerName = lang === 'FR' && layer.nameFr ? layer.nameFr : layer.name;
                    return (
                      <div
                        key={layer.id}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isChecked
                            ? 'bg-sage-50/30 border-sage-200/50'
                            : 'border-transparent'
                        }`}
                      >
                        {/* Select row */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleLayer(layer.id)}
                            className="rounded border-gray-300 text-sage-600 focus:ring-sage-500 cursor-pointer w-3.5 h-3.5"
                          />
                          <span className="text-[11px] font-medium text-wood-900 flex-1 leading-tight">{layerName}</span>
                        </label>

                        {/* Smooth opacity range */}
                        {isChecked && (
                          <div className="mt-1 pl-5.5 flex flex-col gap-0.5">
                            <span className="text-[9px] text-gray-455 font-medium">{lang === 'EN' ? "Opacity" : "Opacité"}</span>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={layerOpacities[layer.id] ?? 80}
                              onChange={(e) => handleOpacityChange(layer.id, Number(e.target.value))}
                              className="w-full h-1 bg-sage-100 rounded-lg appearance-none cursor-pointer accent-sage-600"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Browser Tabs Header Bar */}
        {selectedLayerIds.length > 0 && (
          <div className="flex bg-gray-50/80 border-b border-gray-200 px-4 pt-2 gap-1 flex-wrap">
            {selectedLayerIds.map((layerId) => {
              const layer = usefulLayersCanada.find(l => l.id === layerId);
              if (!layer) return null;
              const isActive = activeTabId === layerId;
              const layerName = lang === 'FR' && layer.nameFr ? layer.nameFr : layer.name;
              return (
                <div
                  key={layerId}
                  className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-2 transition-all select-none -mb-[1px] font-sans border-t border-x rounded-t-lg ${
                    isActive
                      ? 'bg-white text-wood-950 border-t-2 border-t-sage-500 border-x-gray-200 font-bold z-10 shadow-xs'
                      : 'bg-transparent text-gray-500 border-transparent hover:text-wood-900 hover:bg-gray-150/40'
                  }`}
                >
                  <button
                    onClick={() => setActiveTabId(layerId)}
                    className="flex items-center gap-1.5 text-left cursor-pointer focus:outline-none"
                  >
                    <span className={`w-1.5 h-1.5 shrink-0 rounded-full ${isActive ? 'bg-sage-500' : 'bg-gray-350'}`} />
                    <span>{layerName}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLayer(layerId);
                    }}
                    className="hover:bg-gray-200 rounded-full p-0.5 text-gray-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer focus:outline-none"
                    title={lang === 'EN' ? "Deselect Spatial Layer" : "Désélectionner la couche"}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Descriptive detail card block style below tabs */}
        {activeTabLayer ? (
          <div className="p-6 space-y-6 animate-fadeIn bg-white">
            <div className="space-y-2">
              <h3 className="font-display font-semibold text-lg sm:text-xl text-wood-950">
                {lang === 'FR' && activeTabLayer.nameFr ? activeTabLayer.nameFr : activeTabLayer.name}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                {lang === 'FR' && activeTabLayer.descriptionFr ? activeTabLayer.descriptionFr : activeTabLayer.description}
              </p>
            </div>

            {/* Metadata metrics grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs font-mono text-gray-650">
              <div>
                <span className="block text-[10px] text-gray-400 font-sans">{lang === 'EN' ? "Spatial Coverage" : "Couverture spatiale"}</span>
                <strong className="text-wood-900">{lang === 'FR' && activeTabLayer.coverageFr ? activeTabLayer.coverageFr : activeTabLayer.coverage}</strong>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 font-sans">{lang === 'EN' ? "Data Format" : "Format des données"}</span>
                <strong className="text-wood-900">{lang === 'FR' && activeTabLayer.formatFr ? activeTabLayer.formatFr : activeTabLayer.format}</strong>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 font-sans">{lang === 'EN' ? "Status" : "Statut"}</span>
                <strong className="text-sage-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage-500 inline" /> {lang === 'EN' ? "Active / Open Access" : "Actif / Libre accès"}
                </strong>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed font-sans">
              <h4 className="font-semibold text-wood-950 flex items-center gap-1.5 font-display">
                <CheckCircle2 className="w-3.5 h-3.5 text-sage-500" /> {lang === 'EN' ? "Significance to Biodiversity Science" : "Importance pour la science de la biodiversité"}
              </h4>
              <p className="leading-relaxed text-gray-500 pl-5">
                {lang === 'FR' && activeTabLayer.significanceFr ? activeTabLayer.significanceFr : activeTabLayer.significance}
              </p>
              
              {activeTabLayer.source && (
                <div className="mt-4 pt-3 border-t border-gray-100/60 pl-5">
                  <h5 className="font-semibold text-wood-900 text-[11px] mb-1">{lang === 'EN' ? "Scientific Source Reference:" : "Référence scientifique de la source :"}</h5>
                  <p className="text-gray-400 italic text-[11px] font-sans leading-normal">
                    {activeTabLayer.source}
                  </p>
                </div>
              )}
            </div>

            {/* Action download panel */}
            <div className="border-t border-gray-150 pt-5 flex flex-wrap gap-3 justify-between items-center bg-transparent">
              <span className="text-[10px] text-gray-455 font-mono flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> {lang === 'EN' ? "Licence: Creative Commons BY 4.0" : "Licence : Creative Commons BY 4.0"}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadStub('Cloud-Optimized GeoTIFF', lang === 'FR' && activeTabLayer.nameFr ? activeTabLayer.nameFr : activeTabLayer.name)}
                  className="px-4 py-2 bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-sage-600" /> COG GeoTIFF
                </button>
                <button
                  onClick={() => handleDownloadStub('Shapefile Line Vector', lang === 'FR' && activeTabLayer.nameFr ? activeTabLayer.nameFr : activeTabLayer.name)}
                  className="px-4 py-2 bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-sage-600" /> Esri Shapefile
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="p-16 text-center text-xs text-gray-400 font-sans bg-gray-50/50">
            {lang === 'EN' 
              ? "Please make sure at least one layer is turned on via the layers dropdown overlay on the map."
              : "Veuillez vous assurer qu'au moins une couche est activée via le menu déroulant des couches sur la carte."}
          </div>
        )}

      </div>

    </div>
  );
}
