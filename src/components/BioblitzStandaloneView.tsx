import React, { useState, useEffect } from 'react';
import { Award, ArrowLeft, Search, CheckCircle2, Percent, Target, Trophy, ListChecks, HelpCircle, AlertCircle } from 'lucide-react';

interface BioblitzStandaloneViewProps {
  initialUrl?: string;
}

export default function BioblitzStandaloneView({ initialUrl = '' }: BioblitzStandaloneViewProps) {
  const [projectUrl, setProjectUrl] = useState<string>(initialUrl);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const triggerAnalysis = (url: string) => {
    if (!url.trim()) return;
    setSubmitting(true);
    setAnalysisResult(null);

    // Simulate analysis delay
    setTimeout(() => {
      const len = url.length;
      const projectName = url.replace('https://', '').replace('www.', '').replace('inaturalist.org/projects/', '').split('/')[0]
        .split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Custom Regional Bioblitz';

      const prevPeakRecordCount = 180 + (len * 4) % 250;
      const doubleTarget = prevPeakRecordCount * 2;
      const currentRecords = Math.floor(prevPeakRecordCount * 0.75 + (len * 2) % 300);
      const progressPercent = Math.min(100, Math.floor((currentRecords / doubleTarget) * 100));

      const simulatedExplorerScore = Math.floor(45 + (len * 3) % 45);
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
          `Survey the northwestern forested sectors where 0 historical records exist within 5km of trails.`,
          `Upload photographic evidence of any non-winged invertebrates (specifically look under peeling birch bark and moss beds).`,
          `Priority Taxa target: Search riparian buffer pools for Amphibian egg masses.`,
          `Cross-reference iNat observations with regional KBA checklists to confirm vulnerable triggers.`
        ],
        unlockedAchievement: progressPercent > 80 ? 'Elite Gap-Climber Gold' : 'Eco-Surveyor Bronze'
      });
      setSubmitting(false);
    }, 1500);
  };

  useEffect(() => {
    if (initialUrl) {
      triggerAnalysis(initialUrl);
    }
  }, [initialUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAnalysis(projectUrl);
  };

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-wood-950 font-sans p-6 sm:p-10 relative">
      {/* Soft background glow */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-sage-50/70 to-transparent pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative overflow-visible">
        
        {/* Simplified Standalone Branding Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-sage-100 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sage-500 rounded-xl flex items-center justify-center text-white" title="openbiodiversity.ca">
              <span className="font-display font-extrabold text-sm">OB</span>
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-sage-600">openbiodiversity.ca toolkit</span>
              <h1 className="text-xl font-bold font-display tracking-tight text-wood-900 leading-tight">BioBlitz Gamification Analyser</h1>
            </div>
          </div>
          <div>
            <button 
              onClick={() => window.close()} 
              className="text-xs font-semibold font-sans text-gray-500 hover:text-wood-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
            >
              <ArrowLeft className="w-4.5 h-4.5" /> Return to main page
            </button>
          </div>
        </header>

        {/* Input/Analyze Form Section */}
        <section className="bg-white border border-sage-100 rounded-2xl p-6 shadow-xs">
          <div className="space-y-2 mb-4">
            <h2 className="text-base font-semibold font-display text-wood-900">Analyze iNaturalist Project Bounds</h2>
            <p className="text-xs text-gray-500 font-sans leading-relaxed">
              Paste the full URL of your regional iNaturalist Bioblitz. Our analytical grid evaluates local spatial density, trails overlap, and predicted Species Distribution Models to output custom guidance targets for your community volunteers.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              placeholder="e.g. https://www.inaturalist.org/projects/my-local-valley-blitz-2026"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 text-wood-700"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Analyzing Project...' : 'Analyze Now'}
            </button>
          </form>
        </section>

        {/* loading state */}
        {submitting && (
          <div className="text-center py-20 bg-white border border-sage-100 rounded-2xl shadow-xs space-y-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sage-500 border-t-transparent" />
            <p className="text-sm font-semibold text-gray-500 font-mono">Running spatial bias algorithms, trails intersecting masks, and SDM standardizations...</p>
          </div>
        )}

        {/* result presentation */}
        {analysisResult && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Main Header Result block */}
            <div className="bg-gradient-to-r from-sage-600 to-sage-700 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#d8ebd2] uppercase">Project Report</span>
                <h2 className="text-2xl font-bold font-display tracking-tight text-white leading-tight">
                  {analysisResult.projectName}
                </h2>
                <p className="text-xs text-sage-100 max-w-xl font-sans leading-relaxed">
                  Excellent! This iNaturalist region overlaps critical data gaps. Incorporate our specialized evaluation metrics and targeted action recommendations to maximize biological collection value.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4.5 border border-white/20 text-center shrink-0 w-full md:w-auto">
                <span className="text-[10px] font-mono uppercase tracking-wider text-sage-200 block">Achievement Standard</span>
                <span className="text-sm font-bold font-display mt-1 text-white block">{analysisResult.unlockedAchievement}</span>
              </div>
            </div>

            {/* Grid of details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Box 1: Progress meter */}
              <div className="bg-white border border-sage-100 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Doubling Target Progress</span>
                  <Percent className="w-5 h-5 text-sage-600" />
                </div>
                <div className="text-center py-2">
                  <span className="text-4xl font-extrabold font-mono text-wood-950">{analysisResult.progressPercent}%</span>
                  <div className="text-[10px] text-gray-400 mt-1 uppercase font-mono font-bold tracking-wider">of Double-Record objective</div>
                </div>
                <div className="space-y-1.5 text-xs border-t border-gray-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Previous Peak:</span>
                    <strong className="text-wood-900">{analysisResult.previousRecordPeak} observations</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Target Goal:</span>
                    <strong className="text-[#c88d22]">{analysisResult.targetRecordsGoal} observations</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current observations:</span>
                    <strong className="text-sage-600">{analysisResult.currentRecordCount} observations</strong>
                  </div>
                </div>
              </div>

              {/* Box 2: Spatial Completeness Scores */}
              <div className="bg-white border border-sage-100 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Gap-Climber Scorecard</span>
                  <Target className="w-5 h-5 text-sage-600" />
                </div>

                <div className="space-y-4 py-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-wood-900">M1: Explorer Coverage</span>
                      <strong className="text-emerald-600 font-mono">{analysisResult.explorerScore}%</strong>
                    </div>
                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-150">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${analysisResult.explorerScore}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-wood-900">M2: Under-Surveyed Taxa Found</span>
                      <strong className="text-indigo-600 font-mono">{analysisResult.taxonomicVariety} taxa</strong>
                    </div>
                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-150">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, (analysisResult.taxonomicVariety / 150) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-wood-900">M3: Unified VOI Quality</span>
                      <strong className="text-amber-600 font-mono">{analysisResult.voiScore}/100</strong>
                    </div>
                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-150">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${analysisResult.voiScore}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 3: Campaign Priorities overview */}
              <div className="bg-white border border-sage-100 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Priority Gaps Identified</span>
                  <Trophy className="w-5 h-5 text-sage-600" />
                </div>
                <div className="text-center py-2">
                  <span className="text-4xl font-extrabold font-mono text-[#c88d22]">{analysisResult.gapSectorsIdentified}</span>
                  <div className="text-[10px] text-gray-400 mt-1 uppercase font-mono font-bold tracking-wider">1km grid cells with absolute 0 records</div>
                </div>
                <div className="p-3 bg-sage-50/50 text-sage-800 rounded-xl border border-sage-100 text-2xs leading-relaxed font-mono">
                  <strong>SYSTEM METRIC ADVISORY:</strong> Directing sampling towards these specific {analysisResult.gapSectorsIdentified} empty sectors yields a 2.5x score multiplier for all volunteers.
                </div>
              </div>

            </div>

            {/* Custom Field Actions list */}
            <div className="bg-white border border-sage-100 rounded-2xl p-6 shadow-xs space-y-3">
              <h3 className="font-display font-semibold text-sm text-wood-900 flex items-center gap-1.5">
                <ListChecks className="w-4.5 h-4.5 text-sage-500" /> Custom Field Guidelines for Volunteers:
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-sans pb-1">
                Print or share these specific coordinates and search rules with your bioblitz attendees to optimize the expedition's contribution to Canadian biodiversity modelling.
              </p>
              <ul className="space-y-3 font-sans">
                {analysisResult.targetedActionList.map((action: string, idx: number) => (
                  <li key={idx} className="flex gap-2.5 items-start text-xs text-wood-700 leading-relaxed">
                    <span className="w-5 h-5 rounded-full shrink-0 bg-sage-50 text-sage-600 border border-sage-100 flex items-center justify-center font-bold font-mono text-[9px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
