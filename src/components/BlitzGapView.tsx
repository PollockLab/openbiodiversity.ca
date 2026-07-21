import React, { useState } from 'react';
import { Award, Compass, MapPin, BarChart3, Users, Flame, ChevronDown, ChevronUp, Info, BookOpen, ExternalLink } from 'lucide-react';
import { btgCaseStudies, btgLeaderboard, staticBtg2025Milestone } from '../data/blitzTheGapData';
import BioblitzAnalyzer from './BioblitzAnalyzer';
import { useLanguage } from '../lib/LanguageContext';

export default function BlitzGapView() {
  const { lang } = useLanguage();
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

  const formatGoal = (text: string) => {
    if (lang === 'EN') return text;
    return text.replace('Records', 'observations').replace(',', ' ');
  };

  return (
    <div className="space-y-4 pb-16">
      
      {/* Intro descriptive card & Impact section combined */}
      <section className="bg-white rounded-2xl p-6 md:p-8 shadow-md shadow-gray-300 animate-fadeIn space-y-6">
        <div>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl text-wood-900 tracking-tight">
            {lang === 'EN' ? "Blitz the Gap 2026" : "Blitz the Gap 2026"}
          </h1>
          <div className="text-sm text-gray-500 mt-3 leading-relaxed font-sans">
            {lang === 'EN' ? (
              <p>
                Blitz the Gap 2026 is a Canada-wide bioblitz to help us fill gaps in our knowledge of biodiversity. A bioblitz is a brief, intensive community effort to record as many species as possible in a specific area. Plan your next adventure using this interactive map viewer featuring spatial gaps, species discovery, conservation priorities, and more. Join the <a href="https://www.inaturalist.org/projects/blitz-the-gap-2026-general" target="_blank" rel="noopener noreferrer" className="text-sage-600 hover:text-sage-700 font-semibold underline decoration-2 decoration-sage-100 hover:decoration-sage-300 transition-colors">2026 iNaturalist project</a> to contribute your observations!
              </p>
            ) : (
              <p>
                Blitz the Gap 2026 est un bioblitz pancanadien conçu pour nous aider à combler les lacunes dans nos connaissances sur la biodiversité. Un bioblitz est un effort collectif bref et intensif visant à répertorier autant d'espèces que possible dans une zone donnée. Planifiez votre prochaine aventure à l'aide de ce visualisateur de carte interactif présentant les lacunes spatiales, les découvertes d'espèces, les priorités de conservation et plus encore. Rejoignez le <a href="https://www.inaturalist.org/projects/blitz-the-gap-2026-general" target="_blank" rel="noopener noreferrer" className="text-sage-600 hover:text-sage-700 font-semibold underline decoration-2 decoration-sage-100 hover:decoration-sage-300 transition-colors">projet iNaturalist 2026</a> pour contribuer à vos observations !
              </p>
            )}
          </div>
        </div>

        {/* Historical Accomplishments Milestones */}
        <div className="space-y-4 pt-2 border-l-2 border-gray-200 pl-4 md:pl-6 ml-1">
          {/* Subtitle */}
          <div>
            <h2 className="font-display font-semibold text-lg text-wood-900 tracking-tight">
              {lang === 'EN' ? "2025 Impact" : "Impact 2025"}
            </h2>
          </div>

          {/* Paper Link / Description & Highlights Link */}
          <p className="text-xs sm:text-sm font-sans text-gray-500 leading-relaxed">
            {lang === 'EN' ? (
              <>
                See{' '}
                <a 
                  href="https://ecoevorxiv.org/repository/view/13473/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sage-600 hover:text-sage-700 font-semibold underline decoration-2 decoration-sage-100 hover:decoration-sage-300 inline-flex items-center gap-0.5 transition-all"
                >
                  this paper
                </a>
                , currently in review for publishing, on the impacts of Blitz the Gap 2025 on biodiversity science in Canada. To explore more BTG 2025 highlights, see{' '}
                <a 
                  href="https://blitzthegap.shinyapps.io/blitz_the_gap_highlights/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sage-600 hover:text-sage-700 font-semibold underline decoration-2 decoration-sage-100 hover:decoration-sage-300 inline-flex items-center gap-0.5 transition-all"
                >
                  this interactive impact summary <ExternalLink className="w-3.5 h-3.5 text-sage-600" />
                </a>
                .
              </>
            ) : (
              <>
                Consultez{' '}
                <a 
                  href="https://ecoevorxiv.org/repository/view/13473/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sage-600 hover:text-sage-700 font-semibold underline decoration-2 decoration-sage-100 hover:decoration-sage-300 inline-flex items-center gap-0.5 transition-all"
                >
                  cet article
                </a>
                , actuellement en cours d'évaluation pour publication, sur les impacts de Blitz the Gap 2025 sur la science de la biodiversité au Canada. Pour explorer plus de faits saillants de BTG 2025, consultez{' '}
                <a 
                  href="https://blitzthegap.shinyapps.io/blitz_the_gap_highlights/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sage-600 hover:text-sage-700 font-semibold underline decoration-2 decoration-sage-100 hover:decoration-sage-300 inline-flex items-center gap-0.5 transition-all"
                >
                  ce résumé d'impact interactif <ExternalLink className="w-3.5 h-3.5 text-sage-600" />
                </a>
                .
              </>
            )}
          </p>

          {/* Stats Grid below links */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <a 
              href="https://www.inaturalist.org/projects/blitz-the-gap-2025"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sage-50/50 py-3 px-3.5 rounded-xl border border-sage-200/50 text-center flex flex-col justify-center transition-all hover:bg-sage-100/40 hover:scale-[1.02] shadow-3xs cursor-pointer text-sage-850"
            >
              <span className="text-lg sm:text-xl font-bold font-mono text-sage-700 block leading-tight">{staticBtg2025Milestone.uniqueEmptyCellsConquered}</span>
              <span className="text-[10px] text-sage-600 font-sans font-medium block mt-1 leading-tight">
                {lang === 'EN' ? "Area Sampled for the 1st time on iNat" : "Zone échantillonnée pour la 1ère fois sur iNat"}
              </span>
            </a>
            <a 
              href="https://www.inaturalist.org/projects/blitz-the-gap-2025"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sage-50/50 py-3 px-3.5 rounded-xl border border-sage-200/50 text-center flex flex-col justify-center transition-all hover:bg-sage-100/40 hover:scale-[1.02] shadow-3xs cursor-pointer text-sage-850"
            >
              <span className="text-lg sm:text-xl font-bold font-mono text-sage-700 block leading-tight">{staticBtg2025Milestone.speciesWithFirstObservation}</span>
              <span className="text-[10px] text-sage-600 font-sans font-medium block mt-1 leading-tight">
                {lang === 'EN' ? "Species Logged 1st Time on iNat" : "Espèces signalées pour la 1ère fois sur iNat"}
              </span>
            </a>
            <a 
              href="https://www.inaturalist.org/projects/blitz-the-gap-2025"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sage-50/50 py-3 px-3.5 rounded-xl border border-sage-200/50 text-center flex flex-col justify-center transition-all hover:bg-sage-100/40 hover:scale-[1.02] shadow-3xs cursor-pointer text-sage-850"
            >
              <span className="text-lg sm:text-xl font-bold font-mono text-sage-700 block leading-tight">{staticBtg2025Milestone.speciesReaching100Observations}</span>
              <span className="text-[10px] text-sage-600 font-sans font-medium block mt-1 leading-tight">
                {lang === 'EN' ? "Species reaching 100 observations on iNat" : "Espèces atteignant 100 observations sur iNat"}
              </span>
            </a>
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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch border-b border-gray-100 pb-5">
            
            {/* Left Column: Main Tool Header & Button */}
            <div className="md:col-span-5 flex flex-col justify-between gap-2.5">
              {/* Centered Main Tool Header with horizontal grey bracket lines */}
              <div className="flex items-center gap-3">
                <div className="flex-grow h-[1px] bg-gray-200" />
                <span className="text-[10px] font-extrabold text-sage-600 uppercase tracking-wider font-mono whitespace-nowrap">
                  {lang === 'EN' ? "Main Tool" : "Outil principal"}
                </span>
                <div className="flex-grow h-[1px] bg-gray-200" />
              </div>

              <div className="flex-grow flex items-stretch">
                <button
                  onClick={() => setActiveStudyId('general')}
                  className={`w-full p-3 text-center rounded-xl border transition-all cursor-pointer flex flex-col justify-center h-full min-h-[48px] shadow-sm ${
                    activeStudyId === 'general'
                      ? 'bg-sage-600 border-sage-600 text-white shadow-sm shadow-sage-100/50 font-bold'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-sage-400 hover:bg-sage-50/20'
                  }`}
                >
                  <span className="font-semibold font-display text-[11px] sm:text-xs">
                    {lang === 'EN' ? "General Gap Map" : "Carte générale des lacunes"}
                  </span>
                </button>
              </div>
            </div>

            {/* Right Column: Featured Projects Label & Buttons */}
            <div className="md:col-span-7 flex flex-col justify-between gap-2.5">
              {/* Centered Featured Projects Header with horizontal grey bracket lines */}
              <div className="flex items-center gap-3">
                <div className="flex-grow h-[1px] bg-gray-200" />
                <span className="text-[10px] font-extrabold text-sage-600 uppercase tracking-wider font-mono whitespace-nowrap">
                  {lang === 'EN' ? "Featured Projects" : "Projets vedettes"}
                </span>
                <div className="flex-grow h-[1px] bg-gray-200" />
              </div>

              {/* Subgrid of 3 buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-stretch flex-grow">
                {btgCaseStudies.filter(study => study.id !== 'general').map((study) => {
                  const isActive = activeStudyId === study.id;
                  const studyTitle = lang === 'FR' && study.titleFr ? study.titleFr : study.title;
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
                        {(() => {
                          const cleaned = studyTitle.replace('Case Study', '').replace('Map', '').replace("Étude de cas sur les", '').replace("Étude de cas sur", '').trim();
                          return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
                        })()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Details block */}
          <div className="pt-2 space-y-5 animate-fadeIn bg-white">
            <div>
              <h4 className="font-display font-bold text-lg text-wood-950 leading-snug">
                {lang === 'FR' && activeStudy.titleFr ? activeStudy.titleFr : activeStudy.title}
              </h4>
              <p className="text-xs text-gray-550 mt-1 leading-relaxed font-sans">
                {lang === 'FR' && activeStudy.descriptionFr ? activeStudy.descriptionFr : activeStudy.description}
              </p>
              <p className="text-xs text-gray-600 mt-2.5 leading-relaxed font-sans border-l-2 border-sage-200 pl-3">
                {lang === 'FR' && activeStudy.backgroundFr ? activeStudy.backgroundFr : activeStudy.background}
              </p>
            </div>

            {/* Campaign targets progress slider */}
            <div className="bg-sage-50/40 border border-sage-100/60 rounded-xl p-4.5 font-sans">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-gray-650 font-semibold flex items-center gap-1.5">
                  {lang === 'EN' ? "Progress Goal:" : "Objectif de progression :"}
                </span>
                <span className="text-gray-550 font-medium">
                  <span className="text-sage-700 font-bold">{formatGoal(activeStudy.metricsGoal.current)}</span>
                  <span className="text-gray-400"> / </span>
                  <span className="text-wood-950 font-bold">{formatGoal(activeStudy.metricsGoal.target)}</span>
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
                <span className="font-bold text-wood-950">
                  {lang === 'EN' ? "National Leaderboard Standings" : "Leaderboard national"}
                </span>
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
                  {lang === 'EN' ? "Select a category to view standings:" : "Sélectionnez une catégorie pour voir le classement :"}
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
                    <span>{lang === 'EN' ? "Observations" : "Observations"}</span>
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
                    <span>{lang === 'EN' ? "Species" : "Espèces"}</span>
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
                    <span>{lang === 'EN' ? "New Gridcells" : "Nouvelles mailles"}</span>
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
                    <span>{lang === 'EN' ? "Species Novelty" : "Nouveauté des espèces"}</span>
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
                        <span>
                          {lang === 'EN' 
                            ? <><strong>Observations Count (<code>num_obs</code>):</strong> Cumulative verified observations logged on iNaturalist in priority regions.</>
                            : <><strong>Nombre d'observations (<code>num_obs</code>) :</strong> Observations vérifiées cumulées enregistrées sur iNaturalist dans les régions prioritaires.</>}
                        </span>
                      )}
                      {expandedMetric === 'species' && (
                        <span>
                          {lang === 'EN'
                            ? <><strong>Species (<code>num_species</code>):</strong> Count of unique verified species recorded, encouraging taxonomic diversity.</>
                            : <><strong>Espèces (<code>num_species</code>) :</strong> Nombre d'espèces vérifiées uniques enregistrées, encourageant la diversité taxonomique.</>}
                        </span>
                      )}
                      {expandedMetric === 'grid' && (
                        <span>
                          {lang === 'EN'
                            ? <><strong>New Gridcells Sampled (<code>num_new_1km_gridcells</code>):</strong> Number of 1km grid squares recorded for the first time ever on iNaturalist.</>
                            : <><strong>Nouvelles mailles échantillonnées (<code>num_new_1km_gridcells</code>) :</strong> Nombre de carrés de grille de 1 km enregistrés pour la toute première fois sur iNaturalist.</>}
                        </span>
                      )}
                      {expandedMetric === 'novelty' && (
                        <span>
                          {lang === 'EN'
                            ? <><strong>Species Novelty Score (<code>species_novelty</code>):</strong> Unique score where each observation is weighted inversely proportional to historical counts, rewarding rare species.</>
                            : <><strong>Score de nouveauté des espèces (<code>species_novelty</code>) :</strong> Score unique où chaque observation est pondérée de manière inversement proportionnelle à son abondance historique, récompensant les espèces rares.</>}
                        </span>
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
                          {leaderboardTab === 'species' && `${user.species} ${lang === 'EN' ? 'spp' : 'esp'}`}
                          {leaderboardTab === 'grid' && `${user.explorerScore} ${lang === 'EN' ? 'cells' : 'mailles'}`}
                          {leaderboardTab === 'novelty' && `${user.voiScore} ${lang === 'EN' ? 'novelty' : 'nouveauté'}`}
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
