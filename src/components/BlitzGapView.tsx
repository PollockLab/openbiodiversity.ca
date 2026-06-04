import React, { useState } from 'react';
import { Award, Compass, MapPin, BarChart3, Users, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { btgCaseStudies, btgLeaderboard, staticBtg2025Milestone } from '../data/blitzTheGapData';
import GlobePlaceholder from './GlobePlaceholder';
import BioblitzAnalyzer from './BioblitzAnalyzer';

export default function BlitzGapView() {
  const [activeStudyId, setActiveStudyId] = useState<'general' | 'kbas' | 'bc-parks' | 'newfoundland'>('general');
  const [selectedIconicTaxon, setSelectedIconicTaxon] = useState<string>('All');
  
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);

  const activeStudy = btgCaseStudies.find(study => study.id === activeStudyId) || btgCaseStudies[0];

  return (
    <div className="space-y-8 pb-16">
      
      {/* Historical Accomplishments Milestones - Compact Version */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 card-shadow">
        <div className="flex items-center gap-1.5 mb-3">
          <Award className="w-4 h-4 text-sage-500" />
          <h3 className="font-semibold text-wood-950 text-xs font-display uppercase tracking-wider">
            Blitz the Gap 2025 Impact Summary
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 text-center font-sans">
            <span className="text-xl font-bold font-mono text-sage-600 block leading-tight">{staticBtg2025Milestone.totalRecordsFilled}</span>
            <span className="text-[10px] text-gray-400 font-sans block mt-0.5">iNat Records</span>
          </div>
          <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 text-center font-sans">
            <span className="text-xl font-bold font-mono text-sage-600 block leading-tight">{staticBtg2025Milestone.uniqueEmptyCellsConquered}</span>
            <span className="text-[10px] text-gray-400 font-sans block mt-0.5">Empty Cells Conquered</span>
          </div>
          <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 text-center font-sans">
            <span className="text-xl font-bold font-mono text-sage-600 block leading-tight">{staticBtg2025Milestone.newSpeciesAddedToCanadaMaps}</span>
            <span className="text-[10px] text-gray-400 font-sans block mt-0.5">Species Logged 1st Time</span>
          </div>
          <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 text-center font-sans">
            <span className="text-xl font-bold font-mono text-sage-600 block leading-tight">{staticBtg2025Milestone.activeGridClimbers}</span>
            <span className="text-[10px] text-gray-400 font-sans block mt-0.5">Naturalists Enrolled</span>
          </div>
        </div>
      </section>

      {/* Case studies Navigation & Map display block */}
      <section className="space-y-5">
        
        {/* Navigation Selector Tabs */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4.5 space-y-4 card-shadow">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-650 uppercase tracking-widest font-mono">
            <Compass className="w-4 h-4 text-sage-500" /> OUR FEATURED PROJECTS
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {btgCaseStudies.map((study) => (
              <button
                key={study.id}
                onClick={() => {
                  setActiveStudyId(study.id);
                  // Ensure description dropdown expands when switching projects
                  setIsDescriptionOpen(true);
                }}
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

        {/* Full span map visualizer */}
        <div className="w-full">
          <GlobePlaceholder
            mode="blitz-gap"
            selectedCaseStudyId={activeStudyId}
            activeTaxonGroup={selectedIconicTaxon}
            onTaxonGroupChange={setSelectedIconicTaxon}
          />
        </div>

        {/* Collapsible Dropdowns Accordion Assembly */}
        <div className="space-y-4">
          
          {/* Accordion 1: Case Study Details (Background, Goals & Field Guidance) */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden card-shadow">
            <button
              onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
              className="w-full flex justify-between items-center px-6 py-4.5 text-left font-display font-semibold text-wood-950 transition-colors hover:bg-gray-50 focus:outline-none"
            >
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <Compass className="w-4.5 h-4.5 text-sage-600" />
                <span>Project Description & Field Guidance &bull; {activeStudy.title}</span>
              </div>
              <div>
                {isDescriptionOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>
            
            {isDescriptionOpen && (
              <div className="p-6 border-t border-gray-100 bg-white space-y-6 animate-fadeIn">
                <div>
                  <h4 className="font-display font-bold text-lg text-wood-950 leading-snug">{activeStudy.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed font-sans">{activeStudy.description}</p>
                </div>

                {/* Progress target meters inside the dropdown */}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 leading-relaxed font-sans text-xs">
                    <h5 className="font-semibold text-wood-900 font-display text-xs mb-1">Historic Context Background</h5>
                    <p className="text-gray-550 leading-relaxed font-sans mt-1">{activeStudy.background}</p>
                  </div>
                  
                  <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 leading-relaxed font-sans text-xs">
                    <h5 className="font-semibold text-wood-900 flex items-center gap-1 font-display text-xs mb-1">
                      <MapPin className="w-3.5 h-3.5 text-sage-500" /> Surveyor Field Guidance
                    </h5>
                    <p className="text-gray-550 leading-relaxed font-sans mt-1">{activeStudy.guidance}</p>
                  </div>
                </div>

                {activeStudy.featuredRegions && (
                  <div className="space-y-2 pt-2 border-t border-gray-100 font-sans text-xs">
                    <span className="text-[10px] font-semibold text-gray-400 font-mono block uppercase tracking-wider">Featured Gaps Sectors to Target:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeStudy.featuredRegions.map((region, idx) => (
                        <span key={idx} className="bg-sage-50/50 text-sage-700 text-[10px] px-2.5 py-1 rounded border border-sage-100 font-semibold inline-block">
                          {region}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Accordion 2: Standings Leaderboard */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden card-shadow">
            <button
              onClick={() => setIsLeaderboardOpen(!isLeaderboardOpen)}
              className="w-full flex justify-between items-center px-6 py-4.5 text-left font-display font-semibold text-wood-950 transition-colors hover:bg-gray-50 focus:outline-none"
            >
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <Users className="w-4.5 h-4.5 text-sage-600" />
                <span>National Grid Climbers Leaderboard &bull; Standings</span>
              </div>
              <div>
                {isLeaderboardOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>
            
            {isLeaderboardOpen && (
              <div className="p-6 border-t border-gray-100 bg-white space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 font-sans mb-2">
                  <div>
                    <h3 className="font-display font-semibold text-base text-wood-900 tracking-tight">
                      National Standing Listings
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Standings compiling grid completeness indices, rare taxi triggers, and model calibration points.
                    </p>
                  </div>
                  <div className="bg-sage-50 text-sage-600 border border-sage-100 text-[10px] px-2.5 py-1 rounded-full font-mono font-medium">
                    Season Ends October 1st
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="bg-gray-50 text-gray-650 font-mono border-b border-gray-100 py-3 text-[10px] uppercase tracking-wider">
                          <th className="p-3 text-center w-12">Rank</th>
                          <th className="p-3">Naturalist Handle</th>
                          <th className="p-3 text-center">Observations</th>
                          <th className="p-3 text-center">Species Count</th>
                          <th className="p-3 text-center text-emerald-600">Explorer Rate</th>
                          <th className="p-3 text-center text-indigo-600">Taxonomic Multi</th>
                          <th className="p-3 text-center text-amber-600">VOI Value</th>
                          <th className="p-3">Taxon Specialty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {btgLeaderboard.map((r, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3 text-center font-bold">
                              {idx < 3 ? (
                                <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-mono font-bold ${idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : idx === 1 ? 'bg-slate-205 text-slate-800' : 'bg-orange-100 text-orange-800'}`}>
                                  {r.rank}
                                </span>
                              ) : (
                                <span className="font-mono text-gray-400">{r.rank}</span>
                              )}
                            </td>
                            <td className="p-3 font-semibold text-wood-950 flex items-center gap-1.5">
                              {r.username}
                              {idx === 0 && <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />}
                            </td>
                            <td className="p-3 text-center font-mono font-medium text-wood-850">{r.observations}</td>
                            <td className="p-3 text-center font-mono text-gray-400">{r.species}</td>
                            <td className="p-3 text-center font-mono text-emerald-600 font-bold">{r.explorerScore}%</td>
                            <td className="p-3 text-center font-mono text-indigo-600 font-bold">x{r.taxonomicScore / 100}</td>
                            <td className="p-3 text-center font-mono text-amber-600">{r.voiScore}</td>
                            <td className="p-3 font-sans text-wood-600">
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
              </div>
            )}
          </div>

          {/* Accordion 3: How We Score Metrics */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden card-shadow">
            <button
              onClick={() => setIsMetricsOpen(!isMetricsOpen)}
              className="w-full flex justify-between items-center px-6 py-4.5 text-left font-display font-semibold text-wood-950 transition-colors hover:bg-gray-50 focus:outline-none"
            >
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <BarChart3 className="w-4.5 h-4.5 text-sage-600" />
                <span>How We Score: The Three Evaluation Metrics</span>
              </div>
              <div>
                {isMetricsOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>
            
            {isMetricsOpen && (
              <div className="p-6 border-t border-gray-100 bg-white space-y-4 animate-fadeIn font-sans text-xs">
                <div>
                  <p className="text-xs text-gray-500 leading-relaxed font-sans mb-2">
                    We gamify submissions using three algorithms to measure spatial value and scientific importance.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                  <div className="bg-gray-50 p-4.5 rounded-xl border border-gray-100 space-y-2 text-xs">
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs font-mono border border-emerald-100">M1</span>
                    <h5 className="font-display font-semibold text-xs text-wood-900">Explorer Score (Pure Coverage)</h5>
                    <p className="text-[11px] text-gray-500 leading-normal">{activeStudy.metrics.explorer}</p>
                  </div>
                  <div className="bg-gray-50 p-4.5 rounded-xl border border-gray-100 space-y-2 text-xs">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs font-mono border border-blue-100">M2</span>
                    <h5 className="font-display font-semibold text-xs text-wood-900">Taxonomic Score (New Species)</h5>
                    <p className="text-[11px] text-gray-500 leading-normal">{activeStudy.metrics.taxonomic}</p>
                  </div>
                  <div className="bg-gray-50 p-4.5 rounded-xl border border-gray-100 space-y-2 text-xs">
                    <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs font-mono border border-amber-100">M3</span>
                    <h5 className="font-display font-semibold text-xs text-wood-900">VOI Score (Information Value)</h5>
                    <p className="text-[11px] text-gray-500 leading-normal">{activeStudy.metrics.voi}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </section>

      {/* Link the live analysis calculator */}
      <section className="pt-2">
        <BioblitzAnalyzer />
      </section>

    </div>
  );
}
