import React, { useState } from 'react';
import { Layers, Download, CheckCircle2, FileText, Info, Search, Filter, ShieldAlert, ChevronRight } from 'lucide-react';
import { usefulLayersCanada } from '../data/biodiversityLayers';
import GlobePlaceholder from './GlobePlaceholder';

export default function UsefulLayersView() {
  const [selectedLayerId, setSelectedLayerId] = useState<string>('layer-1');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');

  const categories = ['All', 'Conservation', 'Climate', 'Habitat', 'Human Footprint'];

  const filteredLayers = usefulLayersCanada.filter(layer => 
    activeCategoryFilter === 'All' ? true : layer.category === activeCategoryFilter
  );

  const selectedLayer = usefulLayersCanada.find(layer => layer.id === selectedLayerId) || usefulLayersCanada[0];

  const handleDownloadStub = (format: string, name: string) => {
    alert(`Generating download bundle for ${name} (${format}).\nIn a production environment, this initiates a secure download block directly from our cloud storage bucket.`);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Intro Header */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 card-shadow">
        <h1 className="font-display font-semibold text-2xl sm:text-3xl text-wood-900 tracking-tight">
          10 Useful Layers for Conservation in Canada
        </h1>
        <p className="text-sm text-gray-500 mt-1 max-w-3xl leading-relaxed font-sans">
          Key layers to inform conservation planning and guide land use decisions. These layers were identified with the aim of providing useful and transparent data, accessible and applicable Canada-wide. They do not stand to replace local knowledge or detailed regional datasets, but rather to provide a groundwork from which more specific assessments can take shape. 
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Spatial List Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 card-shadow">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
              <Filter className="w-3.5 h-3.5 text-sage-500" /> Filter Categories
            </div>
            
            {/* Horizontal scroll select tabs for categories */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeCategoryFilter === cat ? 'btn-primary text-white font-medium shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List of layers */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden card-shadow">
            <div className="p-4 bg-gray-50 border-b border-gray-100 font-display font-semibold text-xs text-wood-900">
              <span>CURATED LAYER DIRECTORY</span>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[460px] overflow-y-auto">
              {filteredLayers.map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`p-4 text-left transition-all flex justify-between items-start gap-3 cursor-pointer ${selectedLayerId === layer.id ? 'bg-sage-50/40 border-l-4 border-sage-500' : 'hover:bg-gray-50/50'}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded ${layer.category === 'Human Footprint' ? 'bg-purple-50 text-purple-700' : layer.category === 'Conservation' ? 'bg-emerald-50 text-emerald-700' : layer.category === 'Climate' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                        {layer.category}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{layer.resolution}</span>
                    </div>
                    <h3 className="font-display font-semibold text-sm text-wood-950 mt-1">
                      {layer.name}
                    </h3>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                </div>
              ))}
              {filteredLayers.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-500 font-sans">
                  No layers match the criteria filter.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Map & Metadata Panel */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Linked Globe Showcase */}
          <GlobePlaceholder mode="useful-layers" selectedLayerId={selectedLayerId} />

          {/* Active Layer Metadata Details Segment */}
          {selectedLayer && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 card-shadow animate-fadeIn">
              <div>
                <h2 className="font-display font-semibold text-xl text-wood-900">
                  {selectedLayer.name}
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs font-mono text-gray-650">
                <div>
                  <span className="block text-[10px] text-gray-400">Resolution</span>
                  <strong>{selectedLayer.resolution}</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">Coverage</span>
                  <strong>{selectedLayer.coverage}</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">Layer Format</span>
                  <strong>{selectedLayer.format}</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400">Status</span>
                  <strong className="text-sage-500">Active / Open Access</strong>
                </div>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-gray-550 font-sans">
                <div>
                  <h4 className="font-semibold text-wood-950 flex items-center gap-1 font-display">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sage-500" /> Significance to Biodiversity Science
                  </h4>
                  <p className="mt-1 leading-relaxed text-gray-500">{selectedLayer.significance}</p>
                </div>
              </div>

              {/* Action bundle panel for GIS specialists */}
              <div className="border-t border-gray-100 pt-5 flex flex-wrap gap-2 justify-between items-center">
                <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Licence: Creative Commons BY 4.0
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadStub('Cloud-Optimized GeoTIFF', selectedLayer.name)}
                    className="p-2.5 bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> COG GeoTIFF
                  </button>
                  <button
                    onClick={() => handleDownloadStub('Shapefile Line Vector', selectedLayer.name)}
                    className="p-2.5 bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Esri Shapefile
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
