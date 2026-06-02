import React from 'react';
import { BookOpen, Map, Mail, ArrowUpRight, Compass, Users } from 'lucide-react';

export default function AboutView() {
  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto animate-fadeIn">
      
      {/* Intro Header */}
      <section className="text-center space-y-4">
        <span className="bg-sage-50 text-sage-600 border border-sage-100 text-xs px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider font-mono">
          Research Mandate Booklet
        </span>
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-wood-950 tracking-tight">
          About openbiodiversity.ca & the Quantitative Biodiversity Lab, McGill University
        </h1>
        <p className="text-base text-gray-500 max-w-2xl mx-auto leading-relaxed font-sans">
          Providing transparent, reproducible spatial indices to coordinate national responses to rapid climate and human-footprint change.
        </p>
      </section>

      {/* Main Philosophy Section */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6 card-shadow">
        <div>
          <h2 className="font-display font-semibold text-xl text-wood-900">
            Our Scientific Vision
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-2 font-sans">
            We are in the era of big data, big models and big threats. Every day we understand more about the biodiversity on the planet, and every day this biodiversity becomes more threatened. How do we best use this accumulating biodiversity knowledge to understand and predict biodiversity change?
          </p>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-3 font-sans">
            We approach this question from quantitative, biogeographic, and macro-ecological perspectives. Our core focus is biodiversity modelling, and we use traits, phylogenies, and species interactions to help ground these models in ecological reality.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-3 font-sans">
            But, we don’t stop there. We also need to translate important findings from biodiversity research into a form useable for conservation applications. Which taxa serve important (and possibly overlooked) roles, where are they, and how could we protect them?
          </p>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h2 className="font-display font-semibold text-xl text-wood-900">
            Addressing Taxonomic & Spatial Sampling Biases
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-2 font-sans">
            Standard species distribution modeling (SDM) relies heavily on citizen-science platforms like iNaturalist. However, these datasets suffer from extreme spatial bias, as participants naturally congregate near paved roads, regional parks margins, and comfortable campsites.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-3 font-sans">
            The Quantitative Biodiversity Lab specializes in <strong>Bias-Corrected Ensemble Modeling</strong>. By factoring in a live baseline of "observation effort density", our algorithms balance spatial probabilities. Our models discount observation clusters near metropolitan hubs and project robust habitat niches into remote boreal basins. Our seasonal <strong>"Blitz the Gap"</strong> campaigns act as a feedback loop, directing volunteers to precise coordinates with the highest information priority to validate and refine our models.
          </p>
        </div>
      </section>

      {/* Team Expertise Columns */}
      <section className="space-y-4">
        <h3 className="font-display font-semibold text-xl text-wood-900 flex items-center gap-1.5 justify-center">
          <Users className="w-5 h-5 text-sage-500" /> Research Team Contributors
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 p-5 rounded-2xl card-shadow text-center space-y-2">
            <h4 className="font-semibold text-wood-950 font-display">Principal Investigator</h4>
            <span className="text-[10px] font-mono text-sage-600 bg-sage-50/50 px-2 py-0.5 rounded font-bold uppercase border border-sage-100">Principal Investigator</span>
            <p className="text-[11px] text-gray-500 font-sans">Expertise in macroecology, systematic conservation planning, and global biodiversity synthesis.</p>
          </div>
          <div className="bg-white border border-gray-100 p-5 rounded-2xl card-shadow text-center space-y-2">
            <h4 className="font-semibold text-wood-950 font-display">Guillaume</h4>
            <span className="text-[10px] font-mono text-sage-600 bg-sage-50/50 px-2 py-0.5 rounded font-bold uppercase border border-sage-100">Lead spatial modeler</span>
            <p className="text-[11px] text-gray-500 font-sans">Specialist in national-scale GBIF density analysis, bias-weight grids, and cloud raster systems.</p>
          </div>
          <div className="bg-white border border-gray-100 p-5 rounded-2xl card-shadow text-center space-y-2">
            <h4 className="font-semibold text-wood-950 font-display">Noah</h4>
            <span className="text-[10px] font-mono text-sage-600 bg-sage-50/50 px-2 py-0.5 rounded font-bold uppercase border border-sage-100">Clipping algorithms developer</span>
            <p className="text-[11px] text-gray-500 font-sans">Architect of the occupancy-envelope bounds algorithm restricting classic overfilled range polygons.</p>
          </div>
        </div>
      </section>

      {/* Academic Support References */}
      <section className="bg-gray-50 rounded-2xl p-6 border border-gray-150 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="space-y-1.5 text-center sm:text-left">
          <h4 className="font-semibold text-wood-950 text-sm">Want to inspect the raw research publications?</h4>
          <p className="text-xs text-gray-500 font-sans">All data compilation criteria and correction scripts are published across peer-reviewed journals.</p>
        </div>
        <a 
          href="https://kbacanada.org/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white hover:bg-gray-50 border border-gray-200 text-wood-700 font-semibold text-xs px-4.5 py-2.5 rounded-xl transition-all card-shadow inline-flex items-center gap-1.5"
        >
          View Scientific Repos <ArrowUpRight className="w-4 h-4 text-wood-500" />
        </a>
      </section>

    </div>
  );
}
