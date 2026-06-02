import React from 'react';
import { Globe, BookOpen, Layers, Award, ShieldAlert, ArrowRight, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import GlobePlaceholder from './GlobePlaceholder';

interface HomeViewProps {
  setActiveTab: (tab: string) => void;
}

export default function HomeView({ setActiveTab }: HomeViewProps) {
  return (
    <div className="space-y-12 pb-16">
      
      {/* Prime Hero Section */}
      <section className="relative overflow-hidden bg-white rounded-3xl p-8 md:p-12 border border-gray-100 card-shadow animate-fadeIn">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sage-50/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl relative">
          
          <h1 className="font-display font-medium text-4xl sm:text-5xl text-wood-900 tracking-tight leading-[1.15]">
            Canada's Spatial Biodiversity Portal
          </h1>
          
          <p className="mt-6 text-sm sm:text-base text-gray-500 leading-relaxed max-w-2xl font-sans">
            Welcome to <strong className="text-wood-900 font-semibold font-display">openbiodiversity.ca</strong>, a highly accessible scientific resource developed to host responsive, 1km-resolution spatial biodiversity models. Supported by the research of the Quantitative Biodiversity Lab, McGill University, we synthesize millions of raw species observations into actionable plans for environmental stewards and conservation professionals.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => setActiveTab('blitz-gap')}
              className="btn-primary hover:bg-sage-600 font-medium text-xs uppercase tracking-widest px-6 py-3.5 rounded-full transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              Blitz the Gap 2026 <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('sdm-explorer')}
              className="bg-white hover:bg-gray-50 text-gray-600 font-medium text-xs uppercase tracking-widest px-6 py-3.5 rounded-full border border-gray-200 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              Explore 500+ Species Models
            </button>
          </div>
        </div>
      </section>

      {/* The Three Site Pillars Section */}
      <section className="space-y-6">
        <div className="max-w-2xl">
          <h2 className="font-display font-semibold text-2xl text-wood-900 tracking-tight">
            Three Core Components of Our Framework
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Combining rigorous geospatial modeling with gamified community science.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 card-shadow flex flex-col justify-between hover:border-sage-200 transition-all duration-200">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-sage-50 text-sage-500 rounded-xl flex items-center justify-center font-bold">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-base text-wood-900">
                10 Useful Layers for Conservation
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                Our synthesized grid composites map Human Footprint Index, continuous canopy heights, peatland depths, and protected CPC boundaries. Hand-picked criteria layers for high-efficiency zone selection.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('useful-layers')}
              className="mt-6 text-xs text-sage-500 font-semibold inline-flex items-center gap-1 hover:text-sage-700 cursor-pointer text-left"
            >
              Visualise 10 Useful Layers <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 card-shadow flex flex-col justify-between hover:border-sage-200 transition-all duration-200">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-sage-50 text-sage-500 rounded-xl flex items-center justify-center font-bold">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-base text-wood-900">
                Hundreds of Verified SDMs
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                Explore ~500 1km-resolution terrestrial vertebrate Species Distribution Models across butterflies, plants, and structural trees. Supports toggle features for bias-corrected and raw ensemble datasets.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('sdm-explorer')}
              className="mt-6 text-xs text-sage-500 font-semibold inline-flex items-center gap-1 hover:text-sage-700 cursor-pointer text-left"
            >
              Analyze Species Models <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 card-shadow flex flex-col justify-between hover:border-sage-200 transition-all duration-200">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-sage-50 text-sage-500 rounded-xl flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-base text-wood-900">
                Blitz the Gap 2026
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                Our active summer campaign gamifying volunteer submissions on iNaturalist. Help us conquer blank grid squares on the map using our explorer, taxonomic, and VOI metrics tracking metrics.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('blitz-gap')}
              className="mt-6 text-xs text-sage-500 font-semibold inline-flex items-center gap-1 hover:text-sage-700 cursor-pointer text-left"
            >
              Join 2026 Campaign <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Interactive Map Showcase segment */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-display font-semibold text-2xl text-wood-900 tracking-tight">
              Canada's Biodiversity Data
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Probe Canada's observation density grids. Use the map tools to switch base layers and examine coordinate properties.
            </p>
          </div>
        </div>
 
        {/* Globe component in default mode */}
        <GlobePlaceholder mode="useful-layers" selectedLayerId="layer-1" />
      </section>

    </div>
  );
}
