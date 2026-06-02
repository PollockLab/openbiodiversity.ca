import React, { useState } from 'react';
import { Search, Info, Award, HelpCircle, ArrowRight, CheckCircle2, ChevronRight, BarChart2, Star, Sparkles, Send, MapPin } from 'lucide-react';
import { ChallengeMetricType } from '../types';

export default function BioblitzAnalyzer() {
  const [projectUrl, setProjectUrl] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<ChallengeMetricType>('Explorer');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const mockPreloadedProjects = [
    { name: 'Miguasha Fossil Park Blitz 2026', url: 'https://www.inaturalist.org/projects/miguasha-bioblitz' },
    { name: 'Avalon Peninsular Heathlands Survey', url: 'https://www.inaturalist.org/projects/avalon-heathlands' },
    { name: 'Okanagan Sagebrush Valley Bioblitz', url: 'https://www.inaturalist.org/projects/okanagan-sagebrush-26' }
  ];

  const handleQuickLoad = (url: string) => {
    setProjectUrl(url);
    triggerAnalysis(url);
  };

  const triggerAnalysis = (url: string) => {
    if (!url.trim()) return;
    setSubmitting(true);
    setAnalysisResult(null);

    // Simulate analysis delay
    setTimeout(() => {
      // Create a deterministic set of data based on the string length or content
      const len = url.length;
      const projectName = url.replace('https://', '').replace('www.', '').replace('inaturalist.org/projects/', '').split('/')[0]
        .split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Custom Local Bioblitz';

      const prevPeakRecordCount = 180 + (len * 4) % 250; // previous peak iNat-day records
      const doubleTarget = prevPeakRecordCount * 2; // goal to double records
      const currentRecords = Math.floor(prevPeakRecordCount * 0.75 + (len * 2) % 300);
      const isFulfilled = currentRecords >= doubleTarget;
      const progressPercent = Math.min(100, Math.floor((currentRecords / doubleTarget) * 100));

      const simulatedExplorerScore = Math.floor(45 + (len * 3) % 45); // coverage percent
      const simulatedTaxonCount = Math.floor(30 + (len * 2) % 120);
      const simulatedVoiScore = Math.floor(55 + (len * 5) % 35);

      setAnalysisResult({
        projectName: projectName.replace(/[^a-zA-Z0-9 ]/g, ' '),
        previousRecordPeak: prevPeakRecordCount,
        targetRecordsGoal: doubleTarget,
        currentRecordCount: currentRecords,
        progressPercent,
        explorerScore: simulatedExplorerScore,
        taxonomicVariety: simulatedTaxonCount,
        voiScore: simulatedVoiScore,
        gapSectorsIdentified: Math.ceil((len % 6) + 3),
        targetedActionList: [
          `Survey the northwestern forested sector where 0 historical records exist within 5km of trails.`,
          `Upload photographic evidence of any non-winged invertebrates (specifically look under peeling birch bark and moss beds).`,
          `Priority Taxa target: Search riparian buffer pools for Amphibian egg masses.`
        ],
        unlockedAchievement: progressPercent > 80 ? 'Elite Gap-Climber Gold' : 'Eco-Surveyor Bronze'
      });
      setSubmitting(false);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAnalysis(projectUrl);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 card-shadow font-sans">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gray-50 rounded-xl text-sage-500 border border-gray-100">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg text-wood-900">
            Local Bioblitz Gamification Analyzer
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Are you organizing a regional bioblitz? Paste your iNaturalist project link underneath. We will analyze the project bounds against our Canada-wide SDM grid uncertainty to supply your volunteers with custom targets, live progress meters, and priority gap maps.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="url"
              placeholder="e.g. https://www.inaturalist.org/projects/my-local-valley-blitz-2026"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 text-wood-700"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-white text-xs font-semibold uppercase tracking-widest px-6 py-3.5 rounded-full transition-all shadow-xs shrink-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                Analyze iNat Project <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Quick select buttons */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Or try active examples:</span>
          {mockPreloadedProjects.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickLoad(p.url)}
              className="text-xs text-sage-600 bg-sage-50 hover:bg-sage-100 border border-sage-100 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
            >
              {p.name}
            </button>
          ))}
        </div>
      </form>

      {/* Select active metric framework for translation layout */}
      <div className="mt-6 p-4.5 bg-gray-50 rounded-xl border border-gray-100">
        <label className="text-xs font-semibold text-gray-650 block mb-2 font-display">
          Select Your Active Target Metric Framework:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(['Explorer', 'Taxonomic', 'VOI'] as ChallengeMetricType[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMetric(m)}
              className={`p-3.5 text-left rounded-lg text-xs border transition-all flex flex-col justify-between font-sans cursor-pointer ${selectedMetric === m ? 'bg-white border-sage-500 shadow-3xs ring-1 ring-sage-500' : 'bg-transparent border-gray-200 hover:bg-gray-100'}`}
            >
              <div className="font-semibold text-wood-900 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${m === 'Explorer' ? 'bg-emerald-500' : m === 'Taxonomic' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                {m === 'Explorer' ? 'Explorer (Coverage)' : m === 'Taxonomic' ? 'Taxonomic Gaps' : 'VOI (Expected Value)'}
              </div>
              <span className="text-[11px] text-gray-400 mt-1.5 block leading-normal">
                {m === 'Explorer' && 'Gain score by submitting photos in 1km grid squares with completely 0 records.'}
                {m === 'Taxonomic' && 'Points awarded for finding species families with zero previous sightings.'}
                {m === 'VOI' && 'Weighted indicator pairing SDM model uncertainty and rich biodiversity zones.'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Result Output Panel */}
      {analysisResult && (
        <div className="mt-6 border-t border-gray-100 pt-6 animate-fadeIn">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 card-shadow">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-sage-500 text-white font-mono text-[10px] px-2 py-0.5 rounded-full">ACTIVE ANALYSIS</span>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3.5 h-3.5 text-sage-500 pointer-events-none" /> Canada Grid Zone Link
                  </div>
                </div>
                <h4 className="font-display font-medium text-xl text-wood-950 mt-1">
                  {analysisResult.projectName}
                </h4>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-xs text-gray-650 font-medium font-mono">
                  Assigned Project Rank: <strong className="text-sage-500">{analysisResult.unlockedAchievement}</strong>
                </span>
              </div>
            </div>

            {/* Blitz the Gap 2025 Double Record Progress Bar Rule */}
            <div className="mt-6 bg-white border border-gray-100 rounded-xl p-4.5 shadow-3xs">
              <div className="flex justify-between items-center text-xs text-gray-400 mb-1 font-mono">
                <span>BTG Campaign Progress Target Indicator</span>
                <span className="font-semibold text-sage-500">{analysisResult.progressPercent}% Goal Met</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-sage-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${analysisResult.progressPercent}%` }}
                />
              </div>

              {/* Explicit explanation of previous most successful day rule, following Quantitative Biodiversity Lab observations assessment */}
              <div className="mt-3 flex flex-wrap justify-between items-center text-xs text-gray-500 gap-3 border-t border-gray-100 pt-3">
                <div>
                  <span className="text-[11px] block text-gray-405">Previous Peak iNat Day</span>
                  <strong className="text-wood-900">{analysisResult.previousRecordPeak} Observations</strong>
                </div>
                <div className="text-right">
                  {/* BTG target is double previous peak day as calculated */}
                  <span className="text-[11px] block text-gray-450">BTG 2026 Target Goal (2x Peak)</span>
                  <strong className="text-sage-500 text-sm font-bold font-mono">{analysisResult.targetRecordsGoal} Observations</strong>
                </div>
                <div>
                  <span className="text-[11px] block text-gray-405">Current Records Logged</span>
                  <strong className="text-wood-900 font-mono">{analysisResult.currentRecordCount} Observations</strong>
                </div>
              </div>
              <div className="mt-2.5 text-[11px] text-sage-600 bg-sage-50/20 p-2.5 rounded-lg flex items-start gap-1.5 leading-normal">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sage-500 font-bold" />
                <span>
                  <strong>Assessment Strategy:</strong> Under the BTG2025 effectiveness critique, local bioblitzes achieve the highest scientific efficacy when goals are set to <strong>exactly double the highest ever natural history day</strong> in the district. This motivates scouts to venture beyond accessible public campsites.
                </span>
              </div>
            </div>

            {/* Simulated spatial/taxon breakdown points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center font-sans">
                <span className="text-[10px] block font-mono text-gray-400 uppercase tracking-wider">Explorer Score</span>
                <strong className="text-2xl font-display font-medium text-emerald-600 block mt-1">{analysisResult.explorerScore}%</strong>
                <span className="text-xs text-gray-400 mt-0.5 block">Unsurveyed Sectors Fills</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center font-sans">
                <span className="text-[10px] block font-mono text-gray-400 uppercase tracking-wider">Taxonomic Gaps Fills</span>
                <strong className="text-xl font-display font-semibold text-indigo-600 block mt-1">+{analysisResult.taxonomicVariety}</strong>
                <span className="text-xs text-gray-400 mt-0.5 block">New species logged</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center font-sans">
                <span className="text-[10px] block font-mono text-gray-400 uppercase tracking-wider">VOI (Information value)</span>
                <strong className="text-2xl font-display font-medium text-amber-600 block mt-1">{analysisResult.voiScore} pts</strong>
                <span className="text-xs text-gray-400 mt-0.5 block">Average uncertainty decay</span>
              </div>
            </div>

            {/* Targeted guidance for citizen-scientists */}
            <div className="mt-5">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-650 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-sage-500" />
                Targeted Volunteer Expedition Guidance ({selectedMetric} Focused):
              </h5>
              <div className="mt-2 text-xs text-gray-500 flex flex-col gap-2">
                {analysisResult.targetedActionList.map((action: string, idx: number) => (
                  <div key={idx} className="flex gap-2.5 items-start bg-gray-50/50 px-3 py-2.5 rounded-lg border border-gray-100">
                    <CheckCircle2 className="w-4 h-4 text-sage-550 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
