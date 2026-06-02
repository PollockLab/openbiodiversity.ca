import React, { useState } from 'react';
import { Award, Compass, HelpCircle, MapPin, BarChart3, Users, Star, ArrowRight, Shield, CheckCircle, Flame, Calendar } from 'lucide-react';
import { btgCaseStudies, btgLeaderboard, staticBtg2025Milestone } from '../data/blitzTheGapData';
import GlobePlaceholder from './GlobePlaceholder';
import BioblitzAnalyzer from './BioblitzAnalyzer';

export default function BlitzGapView() {
  const [activeStudyId, setActiveStudyId] = useState<'general' | 'kbas' | 'bc-parks' | 'newfoundland'>('general');
  const [selectedIconicTaxon, setSelectedIconicTaxon] = useState<string>('All');

  const activeStudy = btgCaseStudies.find(study => study.id === activeStudyId) || btgCaseStudies[0];

  const iconicTaxa = ['All', 'Fungi', 'Plants', 'Insects', 'Birds', 'Mammals', 'Amphibians', 'Reptiles'];

  return (
    <div className="space-y-10 pb-16">
      
      {/* Historical Accomplishments Milestones */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 card-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-sage-500" />
          <h3 className="font-semibold text-wood-950 text-sm font-display uppercase tracking-wider">
            Blitz the Gap 2025 Impact Summary
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center font-sans">
            <span className="text-2xl font-bold font-mono text-sage-600 block">{staticBtg2025Milestone.totalRecordsFilled}</span>
            <span className="text-[11px] text-gray-400 font-sans block mt-1">iNat Records Submitted</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center font-sans">
            <span className="text-2xl font-bold font-mono text-sage-600 block">{staticBtg2025Milestone.uniqueEmptyCellsConquered}</span>
            <span className="text-[11px] text-gray-400 font-sans block mt-1">Empty Cells Conquered</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center font-sans">
            <span className="text-2xl font-bold font-mono text-sage-600 block">{staticBtg2025Milestone.newSpeciesAddedToCanadaMaps}</span>
            <span className="text-[11px] text-gray-400 font-sans block mt-1">Species Logged first time</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center font-sans">
            <span className="text-2xl font-bold font-mono text-sage-600 block">{staticBtg2025Milestone.activeGridClimbers}</span>
            <span className="text-[11px] text-gray-400 font-sans block mt-1">Naturalists Enrolled</span>
          </div>
        </div>

      </section>

      {/* Case studies Navigation & Map display block */}
      <section className="space-y-6">
        
        {/* Navigation Selector Tabs */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4.5 space-y-4 card-shadow">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-650 uppercase tracking-widest font-mono">
            <Compass className="w-4 h-4 text-sage-500" /> OUR FEATURED PROJECTS
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {btgCaseStudies.map((study) => (
              <button
                key={study.id}
                onClick={() => setActiveStudyId(study.id)}
                className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${activeStudyId === study.id ? 'bg-sage-500 border-sage-500 text-white shadow-sm font-medium' : 'bg-gray-55 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
              >
                <span className={`text-[9px] uppercase font-mono font-bold tracking-widest ${activeStudyId === study.id ? 'text-sage-100' : 'text-sage-500'}`}>
                  {study.id === 'general' ? '01 // GLOBAL CAN' : study.id === 'kbas' ? '02 // KBA STRATEGY' : study.id === 'bc-parks' ? '03 // BC PROTECTED' : '04 // NL LOCAL'}
                </span>
                <span className="text-xs font-display font-bold block mt-1 leading-tight">{study.title.replace('Case Study', '').replace('Map', '')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Case Study map layout split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Map Side */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Taxonomic Filter for General Map */}
            {activeStudyId === 'general' && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4.5 shadow-3xs space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-650 font-sans">Filter observation density by taxonomic group:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {iconicTaxa.map((tax) => (
                    <button
                      key={tax}
                      onClick={() => setSelectedIconicTaxon(tax)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${selectedIconicTaxon === tax ? 'btn-primary text-white font-medium shadow-sm' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                    >
                      {tax}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <GlobePlaceholder
              mode="blitz-gap"
              selectedCaseStudyId={activeStudyId}
              activeTaxonGroup={selectedIconicTaxon}
            />
          </div>

          {/* Context Guidance Side */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Study Target Progress segment */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 card-shadow">
              <div>
                <span className="text-[10px] font-mono bg-sage-50 border border-sage-100 text-sage-600 px-2.5 py-1 rounded-full font-bold">CASE STUDY TARGET METERS</span>
                <h3 className="font-display font-semibold text-xl text-wood-950 mt-3">{activeStudy.title}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed font-sans">{activeStudy.description}</p>
              </div>

              {/* Progress target display */}
              <div className="space-y-2 border-t border-gray-100 pt-4 font-sans">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-400">Campaign Target Records:</span>
                  <strong className="text-wood-900">{activeStudy.metricsGoal.target}</strong>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-400">Current observations submitted:</span>
                  <strong className="text-sage-500 font-bold">{activeStudy.metricsGoal.current}</strong>
                </div>

                <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden mt-1.5 border border-gray-200">
                  <div
                    className="bg-sage-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${activeStudy.metricsGoal.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-gray-400 font-bold">
                  <span>0% START</span>
                  <span>{activeStudy.metricsGoal.progress}% COMPLETED</span>
                  <span>100% MET</span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 leading-normal font-sans">
                <div>
                  <h4 className="text-xs font-semibold text-wood-900 font-display">Historic Context Background</h4>
                  <p className="text-[11px] text-gray-550 mt-1 leading-relaxed">{activeStudy.background}</p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <h4 className="text-xs font-semibold text-wood-900 flex items-center gap-1 font-display">
                    <MapPin className="w-3.5 h-3.5 text-sage-500" /> Surveyor Field Guidance
                  </h4>
                  <p className="text-[11px] text-gray-550 mt-1 leading-relaxed">{activeStudy.guidance}</p>
                </div>
              </div>

              {activeStudy.featuredRegions && (
                <div className="space-y-1.5 pt-2 font-sans">
                  <span className="text-[10px] font-semibold text-gray-400 font-mono block uppercase">Featured Gaps Sectors to Target:</span>
                  <div className="flex flex-wrap gap-1.55">
                    {activeStudy.featuredRegions.map((region, idx) => (
                      <span key={idx} className="bg-sage-50/50 text-sage-700 text-[10px] px-2 py-1 rounded border border-sage-100 font-semibold">
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </section>

      {/* Evaluation Gamification metrics segment */}
      <section className="space-y-6">
        <div className="max-w-2xl font-sans">
          <h2 className="font-display font-semibold text-2xl text-wood-850 tracking-tight">
            How We Score: The Three Evaluation Metrics
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            We gamify submissions using three algorithms to measure spatial value and scientific importance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 card-shadow space-y-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs font-mono border border-emerald-100">M1</span>
            <h3 className="font-display font-semibold text-[15px] text-wood-900">Explorer Score (Pure Coverage)</h3>
            <p className="text-xs text-gray-500 leading-normal">{activeStudy.metrics.explorer}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 card-shadow space-y-3">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs font-mono border border-blue-100">M2</span>
            <h3 className="font-display font-semibold text-[15px] text-wood-900">Taxonomic Score (New Species)</h3>
            <p className="text-xs text-gray-500 leading-normal">{activeStudy.metrics.taxonomic}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 card-shadow space-y-3">
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs font-mono border border-amber-100">M3</span>
            <h3 className="font-display font-semibold text-[15px] text-wood-900">VOI Score (Information Value)</h3>
            <p className="text-xs text-gray-500 leading-normal">{activeStudy.metrics.voi}</p>
          </div>
        </div>
      </section>

      {/* Link the live analysis calculator */}
      <section>
        <BioblitzAnalyzer />
      </section>

      {/* Community Leaderboard */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 font-sans">
          <div>
            <h3 className="font-display font-semibold text-xl text-wood-900 tracking-tight flex items-center gap-1.5">
              <Users className="w-5 h-5 text-sage-500" />
              National Grid Climbers Leaderboard &bull; 2026 Season
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live standings compiling grid completeness indices, rare taxi triggers, and model calibration points.
            </p>
          </div>
          <div className="bg-sage-50 text-sage-600 border border-sage-100 text-xs px-2.5 py-1 rounded-full font-mono font-medium">
            Season Ends October 1st
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden card-shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-mono border-b border-gray-100 py-3 text-[10px] uppercase tracking-wider">
                  <th className="p-4 text-center w-12">Rank</th>
                  <th className="p-4">Naturalist Handle</th>
                  <th className="p-4 text-center">Observations</th>
                  <th className="p-4 text-center">Species Count</th>
                  <th className="p-4 text-center text-emerald-600">Explorer Rate</th>
                  <th className="p-4 text-center text-indigo-600">Taxonomic Multi</th>
                  <th className="p-4 text-center text-amber-600">VOI Value</th>
                  <th className="p-4">Taxon Specialty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {btgLeaderboard.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-center font-bold">
                      {idx < 3 ? (
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-mono font-bold ${idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : idx === 1 ? 'bg-slate-200 text-slate-850' : 'bg-orange-100 text-orange-850'}`}>
                          {r.rank}
                        </span>
                      ) : (
                        <span className="font-mono text-gray-400">{r.rank}</span>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-wood-950 flex items-center gap-1.5">
                      {r.username}
                      {idx === 0 && <Flame className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />}
                    </td>
                    <td className="p-4 text-center font-mono font-medium text-wood-850">{r.observations}</td>
                    <td className="p-4 text-center font-mono text-gray-400">{r.species}</td>
                    <td className="p-4 text-center font-mono text-emerald-600 font-bold">{r.explorerScore}%</td>
                    <td className="p-4 text-center font-mono text-indigo-600 font-bold">x{r.taxonomicScore / 100}</td>
                    <td className="p-4 text-center font-mono text-amber-600">{r.voiScore}</td>
                    <td className="p-4 font-sans text-wood-600">
                      <span className="bg-sage-50 text-sage-600 px-2.5 py-0.5 rounded font-semibold border border-sage-100 text-[10px]">
                        {r.primaryTaxon}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}
