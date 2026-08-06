import React from 'react';
import { Globe, BookOpen, Layers, Award, ShieldAlert, ArrowRight, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import BaseMap from './BaseMap';
import LogoIcon from './LogoIcon';
import { useLanguage } from '../lib/LanguageContext';


interface HomeViewProps {
  setActiveTab: (tab: string) => void;
}

export default function HomeView({ setActiveTab }: HomeViewProps) {
  const { lang } = useLanguage();

  return (
    <div className="space-y-12 pb-16">
      
      {/* Prime Hero Section */}
      <section className="relative overflow-hidden bg-white rounded-3xl p-8 md:p-12 shadow-md shadow-gray-300 animate-fadeIn">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sage-50/40 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full relative">
          
          <h1 className="font-display font-medium text-4xl sm:text-5xl text-wood-900 tracking-tight leading-[1.15] w-full">
            {lang === 'EN' ? "Canada's Spatial Biodiversity Portal" : "Portail de biodiversité spatiale du Canada"}
          </h1>
          
          <p className="mt-6 text-sm sm:text-base text-gray-500 leading-relaxed w-full font-sans">
            {lang === 'EN' ? (
              <>
                Welcome to <strong className="text-wood-900 font-semibold font-display">openbiodiversity.ca</strong>, an open platform for spatial biodiversity data supported by the research of the <a href="https://qbiodiversity.org/" className="text-sage-600 hover:underline">Quantitative Biodiversity Lab</a> at McGill University.
              </>
            ) : (
              <>
                Bienvenue sur <strong className="text-wood-900 font-semibold font-display">openbiodiversity.ca</strong>, une plateforme ouverte pour les données de biodiversité spatiale soutenue par les recherches du <a href="https://qbiodiversity.org/" className="text-sage-600 hover:underline">Laboratoire de biodiversité quantitative</a> de l'Université McGill.
              </>
            )}
          </p>
        </div>
      </section>

      {/* The Three Site Pillars Section */}
      <section className="space-y-6">
        <div className="max-w-2xl">
          <h2 className="font-display font-semibold text-2xl text-wood-900 tracking-tight">
             {lang === 'EN' ? "Tools We Offer" : "Outils disponibles"} 
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Blitz the Gap 2026 (Now First) */}
          <div className="bg-white rounded-2xl p-6 shadow-md shadow-gray-300 flex flex-col justify-between hover:scale-[1.01] transition-all duration-200">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-sage-50 text-sage-500 rounded-xl flex items-center justify-center font-bold overflow-hidden">
                <LogoIcon className="w-10 h-10" />
              </div>
              <h3 className="font-display font-semibold text-base text-wood-900">
                Blitz the Gap 2026
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                {lang === 'EN' 
                  ? "Help us improve our models by participating in a Canada-wide citizen science initiative aiming to fill gaps in our knowledge of biodiversity!"
                  : "Aidez-nous à améliorer nos modèles en participant à une initiative pancanadienne de science citoyenne visant à combler les lacunes de nos connaissances sur la biodiversité!"}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('blitz-gap')}
              className="mt-6 text-xs bg-sage-500 hover:bg-sage-600 text-white font-semibold py-3 px-4 rounded-xl inline-flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-250 cursor-pointer text-center w-full"
            >
              {lang === 'EN' ? "How to Contribute" : "Comment contribuer"} <ArrowRight className="w-4 h-4 animate-pulse" />
            </button>
          </div>

          {/* Pillar 2: 10 Useful Layers for Conservation (Now Second) */}
          <div className="bg-white rounded-2xl p-6 shadow-md shadow-gray-300 flex flex-col justify-between hover:scale-[1.01] transition-all duration-200">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-sage-50 text-sage-500 rounded-xl flex items-center justify-center font-bold">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-base text-wood-900">
                {lang === 'EN' ? "10 Useful Layers for Conservation" : "10 couches utiles pour la conservation"}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                {lang === 'EN' ? (
                  <>
                    The ten most important spatial layers for modern conservation planning in Canada, developed in collaboration with <a href="https://wcscanada.org/" className="text-sage-600 hover:underline">WCS Canada</a>.
                  </>
                ) : (
                  <>
                    Les dix couches spatiales les plus importantes pour la planification de la conservation moderne au Canada, développées en collaboration avec <a href="https://wcscanada.org/" className="text-sage-600 hover:underline">WCS Canada</a>.
                  </>
                )} 
              </p>
            </div>
            <button
              onClick={() => setActiveTab('useful-layers')}
              className="mt-6 text-xs text-sage-500 font-semibold inline-flex items-center gap-1 hover:text-sage-700 cursor-pointer text-left"
            >
              {lang === 'EN' ? "See 10 Useful Layers" : "Voir les 10 couches utiles"} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pillar 3: Species Distributions (Now Third) */}
          <div className="bg-white rounded-2xl p-6 shadow-md shadow-gray-300 flex flex-col justify-between hover:scale-[1.01] transition-all duration-200">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-sage-50 text-sage-500 rounded-xl flex items-center justify-center font-bold">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-base text-wood-900">
                {lang === 'EN' ? "Species Distributions" : "Distributions des espèces"}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                {lang === 'EN'
                  ? "Explore hundreds of Species Distribution Models for the terrestrial vertebrates, butterflies, plants, and trees of Canada."
                  : "Explorez des centaines de modèles de distribution d'espèces (SDM) pour les vertébrés terrestres, les papillons, les plantes et les arbres du Canada."}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('sdm-explorer')}
              className="mt-6 text-xs text-sage-500 font-semibold inline-flex items-center gap-1 hover:text-sage-700 cursor-pointer text-left"
            >
              {lang === 'EN' ? "View Distributions" : "Voir les distributions"} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Interactive Map Showcase segment */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-display font-semibold text-2xl text-wood-900 tracking-tight">
              {lang === 'EN' ? "Canada's Biodiversity Data" : "Données de biodiversité du Canada"}
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
             {lang === 'EN' 
               ? "Explore our current observations of the country's wildlife."
               : "Explorez nos observations actuelles de la faune du pays."}
            </p>
          </div>
        </div>
 
        {/* Embedded clean Base Map using MapLibre with full satellite & terrain raster capability */}
        <BaseMap />
      </section>

    </div>
  );
}
