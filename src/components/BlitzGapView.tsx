import React, { useState } from 'react';
import { Award, Compass, MapPin, BarChart3, Users, Flame, ChevronDown, ChevronUp, Info, BookOpen } from 'lucide-react';
import { btgCaseStudies, btgLeaderboard, staticBtg2025Milestone } from '../data/blitzTheGapData';
import BioblitzAnalyzer from './BioblitzAnalyzer';

export default function BlitzGapView() {
  const [activeStudyId, setActiveStudyId] = useState<'general' | 'kbas' | 'bc-parks' | 'newfoundland'>('general');
  
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
      <section className="bg-white rounded-2xl p-2.5 md:py-2 md:px-3.5 shadow-md shadow-gray-300 -mt-5 mb-2">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          
          {/* Left: Summary Title Block */}
          <div className="flex items-center gap-2 flex-shrink-0 py-1 md:pr-1">
            <Award className="w-5 h-5 text-sage-600 flex-shrink-0" />
            <h3 className="font-bold text-wood-950 text-xs sm:text-sm font-display tracking-tight leading-tight uppercase md:max-w-[160px]">
              Blitz the Gap <br /> 2025 Impact
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
        <div className="w-full bg-white rounded-2xl overflow-hidden shadow-md shadow-gray-300">
          <iframe
            src="https://pollocklab.github.io/where-to-blitz/"
            title="Where to Blitz Map"
            className="w-full h-[650px] md:h-[750px] border-0"
            allow="geolocation"
          />
        </div>

        {/* Unified Project Case Studies & Details Panel */}
        <div className="bg-white rounded-2xl overflow-hidden flex flex-col shadow-md shadow-gray-300 p-5 md:p-6 space-y-6">
          
          {/* Selector Buttons (Prominent Buttons for Featured Projects) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-x-5 gap-y-2 items-stretch border-b border-gray-100 pb-5">
            
            {/* Row 1 Left: Spacer for Desktop, hidden on Mobile */}
            <div className="order-1 md:order-1 md:col-span-5 hidden md:block">
              <div className="h-4" />
            </div>

            {/* Row 1 Right: Featured Projects Header */}
            <div className="order-2 md:order-2 md:col-span-7">
              <div className="h-4 flex items-center">
                <span className="text-[10px] font-extrabold text-sage-600 uppercase tracking-wider font-mono">Featured Projects</span>
              </div>
            </div>

            {/* Row 2 Left: General Gap Map (No icon, matched sizing) */}
            <div className="order-1 md:order-3 md:col-span-5 flex items-stretch">
              <button
                onClick={() => setActiveStudyId('general')}
                className={`w-full p-3 text-center rounded-xl border transition-all cursor-pointer flex flex-col justify-center min-h-[48px] h-full shadow-sm ${
                  activeStudyId === 'general'
                    ? 'bg-sage-600 border-sage-600 text-white shadow-sm shadow-sage-100/50 font-bold'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-sage-400 hover:bg-sage-50/20'
                }`}
              >
                <span className="font-semibold font-display text-[11px] sm:text-xs">General Gap Map</span>
              </button>
            </div>

            {/* Row 2 Right: Featured Projects Subgrid */}
            <div className="order-3 md:order-4 md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-2 items-stretch">
              {btgCaseStudies.filter(study => study.id !== 'general').map((study) => {
                const isActive = activeStudyId === study.id;
                return (
                  <button
                    key={study.id}
                    onClick={() => setActiveStudyId(study.id)}
                    className={`p-3 text-center rounded-xl border font-semibold font-display text-[11px] sm:text-xs transition-all cursor-pointer flex flex-col justify-center min-h-[48px] h-full shadow-sm ${
                      isActive
                        ? 'bg-sage-500 border-sage-500 text-white shadow-sm font-bold'
                        : 'bg-white text-gray-655 border-gray-200 hover:border-sage-400 hover:bg-sage-50/10 hover:text-wood-950'
                    }`}
                  >
                    <span className="line-clamp-2 leading-snug">
                      {study.title.replace('Case Study', '').replace('Map', '').trim()}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Details block */}
          <div className="pt-2 space-y-5 animate-fadeIn bg-white">
            <div>
              <h4 className="font-display font-bold text-lg text-wood-950 leading-snug">{activeStudy.title}</h4>
              <p className="text-xs text-gray-550 mt-1 leading-relaxed font-sans">{activeStudy.description}</p>
              <p className="text-xs text-gray-600 mt-2.5 leading-relaxed font-sans border-l-2 border-sage-200 pl-3">{activeStudy.background}</p>
            </div>

            {/* Campaign targets progress slider */}
            <div className="bg-sage-50/40 border border-sage-100/60 rounded-xl p-4.5 font-sans">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-gray-650 font-semibold flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-sage-600 animate-pulse" />
                  Progress Goal:
                </span>
                <span className="text-gray-550 font-medium">
                  <span className="text-sage-700 font-bold">{activeStudy.metricsGoal.current}</span>
                  <span className="text-gray-400"> / </span>
                  <span className="text-wood-950 font-bold">{activeStudy.metricsGoal.target}</span>
                </span>
              </div>

              <div className="relative pt-6 pb-2">
                <div className="relative h-2 bg-gray-100 rounded-full border border-gray-200/50">
                  <div
                    className="relative bg-sage-600 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${activeStudy.metricsGoal.progress}%` }}
                  >
                    {/* Tick + Floating % Complete label at the right edge of filled progress */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center translate-x-1/2">
                      {/* % Complete above the tick */}
                      <span className="absolute bottom-3.5 bg-sage-700 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap">
                        {activeStudy.metricsGoal.progress}%
                      </span>
                      {/* Visual Tick */}
                      <div className="w-1.5 h-4.5 bg-sage-800 rounded-full border border-white shadow-3xs" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Collapsible Dropdowns Accordion Assembly */}
        <div className="space-y-4">
          
          {/* Accordion 2: Standings Leaderboard */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-md shadow-gray-300">
            <button
              onClick={() => setIsLeaderboardOpen(!isLeaderboardOpen)}
              className="w-full flex justify-between items-center px-6 py-4.5 text-left font-display font-semibold text-wood-950 transition-colors hover:bg-gray-50 focus:outline-none"
            >
              <div className="flex items-center gap-2 text-sm sm:text-base cursor-pointer">
                <Users className="w-4.5 h-4.5 text-sage-600" />
                <span className="font-bold text-wood-950">National Leaderboard Standings</span>
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
                
                {/* Visual Hint for Multiple Leaderboards */}
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">
                  Select a category to view standings:
                </div>

                {/* Prominent Leaderboard Tabs Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pb-2">
                  {/* Tab 1: Observations */}
                  <button
                    onClick={() => setLeaderboardTab('obs')}
                    className={`p-3 text-center rounded-xl border font-bold font-display text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      leaderboardTab === 'obs'
                        ? 'bg-sage-600 border-sage-600 text-white shadow-md shadow-sage-200/50'
                        : 'bg-gray-50 text-gray-650 border-gray-200 hover:border-sage-400 hover:bg-sage-50/10 hover:text-wood-950'
                    }`}
                  >
                    <span>Observations</span>
                    <Info 
                      className={`w-3.5 h-3.5 cursor-pointer shrink-0 ${leaderboardTab === 'obs' ? 'text-sage-100' : 'text-gray-400 hover:text-sage-600'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedMetric(expandedMetric === 'obs' ? null : 'obs');
                      }}
                    />
                  </button>

                  {/* Tab 2: Species */}
                  <button
                    onClick={() => setLeaderboardTab('species')}
                    className={`p-3 text-center rounded-xl border font-bold font-display text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      leaderboardTab === 'species'
                        ? 'bg-sage-600 border-sage-600 text-white shadow-md shadow-sage-200/50'
                        : 'bg-gray-50 text-gray-655 border-gray-200 hover:border-sage-400 hover:bg-sage-50/10 hover:text-wood-950'
                    }`}
                  >
                    <span>Species</span>
                    <Info 
                      className={`w-3.5 h-3.5 cursor-pointer shrink-0 ${leaderboardTab === 'species' ? 'text-sage-100' : 'text-gray-400 hover:text-sage-600'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedMetric(expandedMetric === 'species' ? null : 'species');
                      }}
                    />
                  </button>

                  {/* Tab 3: New Gridcells */}
                  <button
                    onClick={() => setLeaderboardTab('grid')}
                    className={`p-3 text-center rounded-xl border font-bold font-display text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      leaderboardTab === 'grid'
                        ? 'bg-sage-600 border-sage-600 text-white shadow-md shadow-sage-200/50'
                        : 'bg-gray-50 text-gray-655 border-gray-200 hover:border-sage-400 hover:bg-sage-50/10 hover:text-wood-950'
                    }`}
                  >
                    <span>New Gridcells</span>
                    <Info 
                      className={`w-3.5 h-3.5 cursor-pointer shrink-0 ${leaderboardTab === 'grid' ? 'text-sage-100' : 'text-gray-400 hover:text-sage-600'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedMetric(expandedMetric === 'grid' ? null : 'grid');
                      }}
                    />
                  </button>

                  {/* Tab 4: Species Novelty */}
                  <button
                    onClick={() => setLeaderboardTab('novelty')}
                    className={`p-3 text-center rounded-xl border font-bold font-display text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      leaderboardTab === 'novelty'
                        ? 'bg-sage-600 border-sage-600 text-white shadow-md shadow-sage-200/50'
                        : 'bg-gray-50 text-gray-655 border-gray-200 hover:border-sage-400 hover:bg-sage-50/10 hover:text-wood-950'
                    }`}
                  >
                    <span>Species Novelty</span>
                    <Info 
                      className={`w-3.5 h-3.5 cursor-pointer shrink-0 ${leaderboardTab === 'novelty' ? 'text-sage-100' : 'text-gray-400 hover:text-sage-600'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedMetric(expandedMetric === 'novelty' ? null : 'novelty');
                      }}
                    />
                  </button>
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
