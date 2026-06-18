import React from 'react';
import { BookOpen, Map, Mail, ArrowUpRight, Compass, Users } from 'lucide-react';

export default function AboutView() {
  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto animate-fadeIn">
      
      {/* Intro Header */}
      <section className="text-center space-y-4">
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-wood-950 tracking-tight">
          About openbiodiversity.ca
        </h1>
        <p className="text-base text-gray-500 max-w-2xl mx-auto leading-relaxed font-sans">
          Providing transparent, reproducible spatial indices to coordinate national responses to rapid climate and human-footprint change.
        </p>
      </section>

      {/* Main Philosophy Section */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6 card-shadow">
        <div>
          <h2 className="font-display font-semibold text-xl text-wood-900">
            Scientific Vision
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

      {/* Who We Are & Team Section */}
      <section className="space-y-6">
        <div className="text-center">
          <h3 className="font-display font-semibold text-xl text-wood-950 flex items-center gap-2 justify-center">
            <Users className="w-5 h-5 text-sage-600" /> Who We Are
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto leading-relaxed">
            Leading scientific macroecology, spatial modeling, and conservation analysis backends.
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-8 card-shadow">
          {/* Logo element for the Quantitative Biodiversity Lab */}
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-sage-50/40 p-5 rounded-2xl border border-sage-100/50">
            <div className="w-16 h-16 bg-white border border-gray-100 rounded-2xl shadow-3xs flex flex-col items-center justify-center shrink-0">
              <span className="font-mono text-[10px] font-bold text-gray-400 leading-none">QUANT</span>
              <span className="font-display text-sm font-extrabold text-sage-600 leading-none mt-1">BIODIV</span>
              <span className="font-mono text-[8px] text-gray-450 leading-none mt-1 uppercase tracking-widest">LAB</span>
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h4 className="font-display font-semibold text-sm text-wood-950">Quantitative Biodiversity Lab</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                A modern scientific unit focused on computing heavy spatial models, analyzing geographical biases, and generating actionable conservation indices.
              </p>
            </div>
          </div>

          {/* Six placeholder portrait circles with title placeholder names and roles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 pt-2">
            {[
              { name: "Dr. Laura Pollock", role: "Principal Investigator", tag: "LP" },
              { name: "Katherine Hébert", role: "Postdoctoral Researcher", tag: "R6" },
              { name: "Guillaume Larocque", role: "Lead Spatial Modeler", tag: "G" },
              { name: "Noah Wightman", role: "Clipping Developer", tag: "N" },
              { name: "Ryan Hull", role: "Research Assistant", tag: "R4" },
              { name: "Maho Horikawa", role: "Research Assistant", tag: "R5" }
            ].map((member, i) => (
              <div key={member.name} className="flex flex-col items-center text-center space-y-2">
                <div className="relative w-16 h-16 rounded-full bg-gray-50 border border-gray-150 flex items-center justify-center text-wood-700 hover:border-sage-400 transition-colors shadow-3xs">
                  <span className="font-display font-semibold text-xs text-gray-500">
                    {member.tag}
                  </span>
                  <span className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-sage-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] text-white font-bold font-mono">
                    {i + 1}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <h5 className="font-display font-semibold text-xs text-wood-950 leading-tight">{member.name}</h5>
                  <p className="text-[10px] text-gray-400 font-sans leading-tight">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Partners Section */}
      <section className="space-y-6">
        <div className="text-center">
          <h3 className="font-display font-semibold text-xl text-wood-950 flex items-center gap-2 justify-center">
            <Compass className="w-5 h-5 text-sage-600" /> Our Partners
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto leading-relaxed">
            Collaborating with leading academic bodies, government agencies, and citizen projects.
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6.5 md:p-8 card-shadow grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            { tag: "MU", name: "McGill University", type: "Academic Lead" },
            { tag: "KBA", name: "Key Biodiversity Areas", type: "National Coalition" },
            { tag: "BCP", name: "BC Protected Parks", type: "Provincial Agency" },
            { tag: "WCS", name: "Wildlife Conservation", type: "Global Society" },
            { tag: "iNAT", name: "iNaturalist Canada", type: "Scientific Network" }
          ].map((partner, i) => (
            <div key={partner.name} className="flex flex-col items-center text-center space-y-2 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-150 flex items-center justify-center text-wood-800 shadow-3xs hover:border-sage-400 transition-colors">
                <span className="font-mono text-xs font-bold text-gray-550">{partner.tag}</span>
              </div>
              <div className="space-y-0.5">
                <h5 className="font-display font-semibold text-xs text-wood-950 leading-tight">{partner.name}</h5>
                <p className="text-[10px] text-gray-400 font-sans leading-tight">{partner.type}</p>
              </div>
            </div>
          ))}
        </div>
      </section>


    </div>
  );
}
