import React, { useState } from 'react';
import { Award, Compass, MapPin, BarChart3, Users, Flame, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { btgCaseStudies, btgLeaderboard, staticBtg2025Milestone } from '../data/blitzTheGapData';
import GlobePlaceholder from './GlobePlaceholder';
import BioblitzAnalyzer from './BioblitzAnalyzer';

export default function BlitzGapView() {
  const [activeStudyId, setActiveStudyId] = useState<'general' | 'kbas' | 'bc-parks' | 'newfoundland'>('general');
  const [selectedIconicTaxon, setSelectedIconicTaxon] = useState<string>('All');
  
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(true);
  const [leaderboardTab, setLeaderboardTab] = useState<'obs' | 'species' | 'grid' | 'novelty'>('obs');
  const [expandedMetric, setExpandedMetric] = useState<'obs' | 'species' | 'grid' | 'novelty' | null>(null);

  const getSortedLeaderboard = () => {
    const list = [...btgLeaderboard];
    if (leaderboardTab === 'obs') {
      return list.sort((a, b) => b.observations - a.observations);
    } else if (leaderboardTab === 'species') {
      return list.sort((a, b) => b.species - a.species);
    } else if (leaderboardTab === 'grid') {
      return list.sort((a, b) => b.explorerScore - a.explorerScore);
    } else {
      return list.sort((a, b) => b.voiScore - a.voiScore);
    }
  };

  const activeStudy = btgCaseStudies.find(study => study.id === activeStudyId) || btgCaseStudies[0];

  return (
    <div className="space-y-8 pb-16">
      
      {/* Historical Accomplishments Milestones - Compact Side-by-Side Panel */}
      <section className="bg-white border border-gray-150 rounded-2xl p-3 md:p-3.5 card-shadow">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          
          {/* Left: Summary Title Block */}
          <div className="flex items-center gap-2 flex-shrink-0 py-1.5 md:pr-1">
            <Award className="w-5 h-5 text-sage-600 flex-shrink-0" />
            <h3 className="font-bold text-wood-950 text-xs sm:text-sm font-display tracking-tight leading-tight uppercase md:max-w-[160px]">
              Blitz the Gap 2025 Impact
            </h3>
          </div>

          {/* Right: Core Stats Grid */}
          <div className="flex-grow w-full grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-gray-50/60 py-2 px-3 rounded-lg border border-gray-100 text-center flex flex-col justify-center transition-colors hover:bg-gray-50">
              <span className="text-base sm:text-lg font-bold font-mono text-sage-600 block leading-tight">{staticBtg2025Milestone.uniqueEmptyCellsConquered}</span>
              <span className="text-[10px] text-gray-550 font-sans block mt-0.5 leading-tight">Area Sampled for the 1st time on iNat</span>
            </div>
            <div className="bg-gray-50/60 py-2 px-3 rounded-lg border border-gray-100 text-center flex flex-col justify-center transition-colors hover:bg-gray-50">
              <span className="text-base sm:text-lg font-bold font-mono text-sage-600 block leading-tight">{staticBtg2025Milestone.speciesWithFirstObservation}</span>
              <span className="text-[10px] text-gray-550 font-sans block mt-0.5 leading-tight">Species Logged 1st Time on iNat</span>
            </div>
            <div className="bg-gray-50/60 py-2 px-3 rounded-lg border border-gray-100 text-center flex flex-col justify-center transition-colors hover:bg-gray-50">
              <span className="text-base sm:text-lg font-bold font-mono text-sage-600 block leading-tight">{staticBtg2025Milestone.speciesReaching100Observations}</span>
              <span className="text-[10px] text-gray-550 font-sans block mt-0.5 leading-tight">Species reaching 100 observations on iNat</span>
            </div>
          </div>

        </div>
      </section>

      {/* Case studies Navigation & Map display block */}
      <section className="space-y-5">
        
        {/* Full span map visualizer */}
        <div className="w-full">
          <GlobePlaceholder
            mode="blitz-gap"
            selectedCaseStudyId={activeStudyId}
            activeTaxonGroup={selectedIconicTaxon}
            onTaxonGroupChange={setSelectedIconicTaxon}
          />
        </div>

        {/* Unified Project Case Studies & Details Panel */}
        <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm flex flex-col card-shadow p-5 md:p-6 space-y-6">
          
          {/* Selector Buttons (Prominent Buttons for Featured Projects) */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-widest font-mono">
              <Compass className="w-4 h-4 text-sage-500" /> OUR FEATURED PROJECTS
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {btgCaseStudies.map((study) => {
                const isActive = activeStudyId === study.id;
                return (
                  <button
                    key={study.id}
                    onClick={() => {
                      setActiveStudyId(study.id);
                    }}
                    className={`p-3 text-center rounded-xl border font-semibold font-display text-[11px] sm:text-xs transition-all cursor-pointer flex items-center justify-center min-h-[48px] ${
                      isActive
                        ? 'bg-sage-500 border-sage-500 text-white shadow-sm font-bold'
                        : 'bg-gray-55 text-gray-600 border-gray-100 hover:bg-gray-100 hover:text-wood-950'
                    }`}
                  >
                    <span>
                      {study.title.replace('Case Study', '').replace('Map', '').trim()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details block */}
          <div className="pt-4 border-t border-gray-100 space-y-6 animate-fadeIn bg-white">
            <div>
              <h4 className="font-display font-bold text-lg text-wood-950 leading-snug">{activeStudy.title}</h4>
              <p className="text-xs text-gray-550 mt-1 leading-relaxed font-sans">{activeStudy.description}</p>
            </div>

            {/* Campaign targets progress slider */}
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
                <h5 className="font-semibold text-wood-900 font-display text-xs mb-1">Background</h5>
                <p className="text-gray-550 leading-relaxed font-sans mt-1">{activeStudy.background}</p>
              </div>
              
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 leading-relaxed font-sans text-xs">
                <h5 className="font-semibold text-wood-900 flex items-center gap-1 font-display text-xs mb-1">
                  <MapPin className="w-3.5 h-3.5 text-sage-500" /> Field Guidance
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
        </div>

        {/* Collapsible Dropdowns Accordion Assembly */}
        <div className="space-y-4">
          
          {/* Accordion 2: Standings Leaderboard */}
          <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden card-shadow">
            <button
              onClick={() => setIsLeaderboardOpen(!isLeaderboardOpen)}
              className="w-full flex justify-between items-center px-6 py-4.5 text-left font-display font-semibold text-wood-950 transition-colors hover:bg-gray-50 focus:outline-none"
            >
              <div className="flex items-center gap-2 text-sm sm:text-base cursor-pointer">
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
              <div className="p-4 sm:p-5 border-t border-gray-100 bg-white space-y-4 animate-fadeIn font-sans">
                
                {/* iNat-like Leaderboard metric tabs selection row */}
                <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-xl">
                  {/* Tab 1: Observations */}
                  <div
                    onClick={() => setLeaderboardTab('obs')}
                    className={`flex-1 min-w-[100px] py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${leaderboardTab === 'obs' ? 'bg-white text-sage-600 shadow-3xs border border-sage-100/30' : 'text-gray-500 hover:text-gray-900 bg-transparent border border-transparent'}`}
                  >
                    <span>Observations</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedMetric(expandedMetric === 'obs' ? null : 'obs');
                      }}
                      className={`w-4 h-4 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors ${expandedMetric === 'obs' ? 'text-sage-600 bg-sage-100' : 'text-gray-400 hover:text-sage-600 hover:bg-gray-100'}`}
                      title="Show details"
                    >
                      <Info className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Tab 2: Species */}
                  <div
                    onClick={() => setLeaderboardTab('species')}
                    className={`flex-1 min-w-[100px] py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${leaderboardTab === 'species' ? 'bg-white text-sage-600 shadow-3xs border border-sage-100/30' : 'text-gray-500 hover:text-gray-900 bg-transparent border border-transparent'}`}
                  >
                    <span>Species</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedMetric(expandedMetric === 'species' ? null : 'species');
                      }}
                      className={`w-4 h-4 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors ${expandedMetric === 'species' ? 'text-sage-600 bg-sage-100' : 'text-gray-400 hover:text-sage-600 hover:bg-gray-100'}`}
                      title="Show details"
                    >
                      <Info className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Tab 3: New Gridcells */}
                  <div
                    onClick={() => setLeaderboardTab('grid')}
                    className={`flex-1 min-w-[110px] py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${leaderboardTab === 'grid' ? 'bg-white text-sage-600 shadow-3xs border border-sage-100/30' : 'text-gray-500 hover:text-gray-900 bg-transparent border border-transparent'}`}
                  >
                    <span>New Gridcells</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedMetric(expandedMetric === 'grid' ? null : 'grid');
                      }}
                      className={`w-4 h-4 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors ${expandedMetric === 'grid' ? 'text-sage-600 bg-sage-100' : 'text-gray-400 hover:text-sage-600 hover:bg-gray-100'}`}
                      title="Show details"
                    >
                      <Info className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Tab 4: Species Novelty */}
                  <div
                    onClick={() => setLeaderboardTab('novelty')}
                    className={`flex-1 min-w-[110px] py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${leaderboardTab === 'novelty' ? 'bg-white text-sage-600 shadow-3xs border border-sage-100/30' : 'text-gray-500 hover:text-gray-900 bg-transparent border border-transparent'}`}
                  >
                    <span>Species Novelty</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedMetric(expandedMetric === 'novelty' ? null : 'novelty');
                      }}
                      className={`w-4 h-4 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors ${expandedMetric === 'novelty' ? 'text-sage-600 bg-sage-100' : 'text-gray-400 hover:text-sage-600 hover:bg-gray-100'}`}
                      title="Show details"
                    >
                      <Info className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* Inline Small Explanation explaining metrics with small Info Icons, visible ONLY if expandedMetric is active */}
                {expandedMetric && (
                  <div className="flex items-start gap-2 bg-sage-53 p-3 rounded-lg border border-sage-100/40 text-[11px] text-gray-550 leading-normal">
                    <Info className="w-4.5 h-4.5 text-sage-500 shrink-0 mt-0.5" />
                    <div>
                      {expandedMetric === 'obs' && (
                        <span><strong>Observations Count (`num_obs`):</strong> Cumulative verified observations logged on iNaturalist in priority regions.</span>
                      )}
                      {expandedMetric === 'species' && (
                        <span><strong>Species (`num_species`):</strong> Count of unique verified species recorded, encouraging taxonomic diversity.</span>
                      )}
                      {expandedMetric === 'grid' && (
                        <span><strong>New Gridcells Sampled (`num_new_1km_gridcells`):</strong> Number of 1km grid squares recorded for the first time ever on iNaturalist.</span>
                      )}
                      {expandedMetric === 'novelty' && (
                        <span><strong>Species Novelty Score (`species_novelty`):</strong> Unique score where each observation is weighted inversely proportional to historical counts, rewarding rare species.</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Smaller iNat-like scrollable list box */}
                <div className="max-h-60 overflow-y-auto pr-1 border border-gray-100 rounded-xl divide-y divide-gray-100 bg-white">
                  {getSortedLeaderboard().map((user, idx) => (
                    <div key={user.username} className="flex items-center justify-between p-2.5 hover:bg-gray-50/50 transition-colors text-xs">
                      
                      {/* Left info label structure */}
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 font-mono font-extrabold text-gray-350 text-center">{idx + 1}</span>
                        <div className="w-7 h-7 rounded-full bg-sage-50 border border-sage-200 flex items-center justify-center font-bold font-display text-gray-500 uppercase shrink-0">
                          {user.username.charAt(0)}
                        </div>
                        <span className="font-semibold text-wood-950 flex items-center gap-1 leading-none">
                          {user.username}
                          {idx === 0 && <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse shrink-0" />}
                        </span>
                      </div>

                      {/* Right values label alignments */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-wood-900 pr-1 text-right min-w-[70px]">
                          {leaderboardTab === 'obs' && `${user.observations} obs`}
                          {leaderboardTab === 'species' && `${user.species} spp`}
                          {leaderboardTab === 'grid' && `${user.explorerScore} cells`}
                          {leaderboardTab === 'novelty' && `${user.voiScore} novelty`}
                        </span>
                      </div>

                    </div>
                  ))}
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
