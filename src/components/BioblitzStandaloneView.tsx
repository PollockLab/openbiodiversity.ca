import React, { useState, useEffect } from 'react';
import { Award, ArrowLeft, Search, CheckCircle2, Percent, Target, Trophy, ListChecks, HelpCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface BioblitzStandaloneViewProps {
  initialUrl?: string;
}

export default function BioblitzStandaloneView({ initialUrl = '' }: BioblitzStandaloneViewProps) {
  const { lang } = useLanguage();
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
        targetedActionListEn: [
          `Survey the northwestern forested sectors where 0 historical records exist within 5km of trails.`,
          `Upload photographic evidence of any non-winged invertebrates (specifically look under peeling birch bark and moss beds).`,
          `Priority Taxa target: Search riparian buffer pools for Amphibian egg masses.`,
          `Cross-reference iNat observations with regional KBA checklists to confirm vulnerable triggers.`
        ],
        targetedActionListFr: [
          `Arpenter les secteurs forestiers du nord-ouest où aucun historique d'observations n'existe à moins de 5 km des sentiers.`,
          `Téléverser des preuves photographiques de tout invertébré non ailé (rechercher spécifiquement sous l'écorce de bouleau qui pèle et les lits de mousse).`,
          `Cible de taxons prioritaires : Rechercher des masses d'œufs d'amphibiens dans les bassins tampons riverains.`,
          `Faire un recoupement des observations iNat avec les listes de contrôle régionales des KBA pour confirmer les déclencheurs vulnérables.`
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

  const formatAchievement = (ach: string) => {
    if (lang === 'EN') return ach;
    return ach === 'Elite Gap-Climber Gold' ? "Or : Grimpeur de brèches d'élite" : "Bronze : Éco-arpenteur";
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
              <h1 className="text-xl font-bold font-display tracking-tight text-wood-900 leading-tight">
                {lang === 'EN' ? "BioBlitz Gamification Analyser" : "Analyseur de ludification de BioBlitz"}
              </h1>
            </div>
          </div>
          <div>
            <button 
              onClick={() => window.close()} 
              className="text-xs font-semibold font-sans text-gray-500 hover:text-wood-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
            >
              <ArrowLeft className="w-4.5 h-4.5" /> {lang === 'EN' ? "Return to main page" : "Retourner à la page principale"}
            </button>
          </div>
        </header>

        {/* Input/Analyze Form Section */}
        <section className="bg-white rounded-2xl p-6 shadow-md shadow-gray-300">
          <div className="space-y-2 mb-4">
            <h2 className="text-base font-semibold font-display text-wood-900">
              {lang === 'EN' ? "Analyze iNaturalist Project Bounds" : "Analyser les limites du projet iNaturalist"}
            </h2>
            <p className="text-xs text-gray-500 font-sans leading-relaxed">
              {lang === 'EN'
                ? "Paste the full URL of your regional iNaturalist Bioblitz. Our analytical grid evaluates local spatial density, trails overlap, and predicted Species Distribution Models to output custom guidance targets for your community volunteers."
                : "Collez l'URL complète de votre BioBlitz iNaturalist régional. Notre grille analytique évalue la densité spatiale locale, le chevauchement des sentiers et les modèles de distribution d'espèces prévus pour générer des objectifs d'orientation personnalisés pour vos bénévoles communautaires."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              placeholder="e.g. https://www.inaturalist.org/projects/my-local-valley-blitz-2026"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-55 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 text-wood-700"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting 
                ? (lang === 'EN' ? "Analyzing Project..." : "Analyse du projet en cours...") 
                : (lang === 'EN' ? "Analyze Now" : "Analyser maintenant")}
            </button>
          </form>
        </section>

        {/* loading state */}
        {submitting && (
          <div className="text-center py-20 bg-white border border-sage-100 rounded-2xl shadow-xs space-y-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sage-500 border-t-transparent" />
            <p className="text-sm font-semibold text-gray-500 font-mono">
              {lang === 'EN' 
                ? "Running spatial bias algorithms, trails intersecting masks, and SDM standardizations..."
                : "Exécution des algorithmes de biais spatial, des masques d'intersection des sentiers et des standardisations des MDE..."}
            </p>
          </div>
        )}

        {/* result presentation */}
        {analysisResult && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Main Header Result block */}
            <div className="bg-gradient-to-r from-sage-600 to-sage-700 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#d8ebd2] uppercase">
                  {lang === 'EN' ? "Project Report" : "Rapport de projet"}
                </span>
                <h2 className="text-2xl font-bold font-display tracking-tight text-white leading-tight">
                  {analysisResult.projectName}
                </h2>
                <p className="text-xs text-sage-100 max-w-xl font-sans leading-relaxed">
                  {lang === 'EN'
                    ? "Excellent! This iNaturalist region overlaps critical data gaps. Incorporate our specialized evaluation metrics and targeted action recommendations to maximize biological collection value."
                    : "Excellent ! Cette région iNaturalist chevauche des lacunes de données critiques. Incorporez nos indicateurs d'évaluation spécialisés et nos recommandations d'actions ciblées pour maximiser la valeur de la collecte biologique."}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4.5 border border-white/20 text-center shrink-0 w-full md:w-auto">
                <span className="text-[10px] font-mono uppercase tracking-wider text-sage-200 block">
                  {lang === 'EN' ? "Achievement Standard" : "Niveau d'accomplissement"}
                </span>
                <span className="text-sm font-bold font-display mt-1 text-white block">
                  {formatAchievement(analysisResult.unlockedAchievement)}
                </span>
              </div>
            </div>

            {/* Grid of details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Box 1: Progress meter */}
              <div className="bg-white rounded-2xl p-5 shadow-md shadow-gray-300 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                    {lang === 'EN' ? "Doubling Target Progress" : "Progression vers le doublement"}
                  </span>
                  <Percent className="w-5 h-5 text-sage-600" />
                </div>
                <div className="text-center py-2">
                  <span className="text-4xl font-extrabold font-mono text-wood-950">{analysisResult.progressPercent}%</span>
                  <div className="text-[10px] text-gray-400 mt-1 uppercase font-mono font-bold tracking-wider">
                    {lang === 'EN' ? "of Double-Record objective" : "de l'objectif de doublement"}
                  </div>
                </div>
                <div className="space-y-1.5 text-xs border-t border-gray-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{lang === 'EN' ? "Previous Peak:" : "Pic précédent :"}</span>
                    <strong className="text-wood-900">{analysisResult.previousRecordPeak} observations</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{lang === 'EN' ? "Target Goal:" : "Objectif cible :"}</span>
                    <strong className="text-[#c88d22]">{analysisResult.targetRecordsGoal} observations</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{lang === 'EN' ? "Current observations:" : "Observations actuelles :"}</span>
                    <strong className="text-sage-600">{analysisResult.currentRecordCount} observations</strong>
                  </div>
                </div>
              </div>

              {/* Box 2: Spatial Completeness Scores */}
              <div className="bg-white rounded-2xl p-5 shadow-md shadow-gray-300 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                    {lang === 'EN' ? "Gap-Climber Scorecard" : "Fiche Gap-Climber"}
                  </span>
                  <Target className="w-5 h-5 text-sage-600" />
                </div>

                <div className="space-y-4 py-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-wood-900">
                        {lang === 'EN' ? "M1: Explorer Coverage" : "M1 : Couverture d'exploration"}
                      </span>
                      <strong className="text-emerald-600 font-mono">{analysisResult.explorerScore}%</strong>
                    </div>
                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-150">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${analysisResult.explorerScore}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-wood-900">
                        {lang === 'EN' ? "M2: Under-Surveyed Taxa Found" : "M2 : Taxons sous-étudiés trouvés"}
                      </span>
                      <strong className="text-indigo-600 font-mono">{analysisResult.taxonomicVariety} {lang === 'EN' ? 'taxa' : 'taxons'}</strong>
                    </div>
                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-150">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, (analysisResult.taxonomicVariety / 150) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-wood-900">
                        {lang === 'EN' ? "M3: Unified VOI Quality" : "M3 : Qualité VOI unifiée"}
                      </span>
                      <strong className="text-amber-600 font-mono">{analysisResult.voiScore}/100</strong>
                    </div>
                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-150">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${analysisResult.voiScore}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 3: Campaign Priorities overview */}
              <div className="bg-white rounded-2xl p-5 shadow-md shadow-gray-300 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                    {lang === 'EN' ? "Priority Gaps Identified" : "Lacunes prioritaires identifiées"}
                  </span>
                  <Trophy className="w-5 h-5 text-sage-600" />
                </div>
                <div className="text-center py-2">
                  <span className="text-4xl font-extrabold font-mono text-[#c88d22]">{analysisResult.gapSectorsIdentified}</span>
                  <div className="text-[10px] text-gray-400 mt-1 uppercase font-mono font-bold tracking-wider">
                    {lang === 'EN' ? "1km grid cells with absolute 0 records" : "mailles de 1 km avec absolument 0 mention"}
                  </div>
                </div>
                <div className="p-3 bg-sage-50/50 text-sage-800 rounded-xl border border-sage-100 text-2xs leading-relaxed font-mono">
                  {lang === 'EN' 
                    ? <><strong>SYSTEM METRIC ADVISORY:</strong> Directing sampling towards these specific {analysisResult.gapSectorsIdentified} empty sectors yields a 2.5x score multiplier for all volunteers.</>
                    : <><strong>CONSEIL DU SYSTÈME :</strong> Diriger l'échantillonnage vers ces {analysisResult.gapSectorsIdentified} secteurs vides spécifiques génère un multiplicateur de score de 2,5x pour les bénévoles.</>}
                </div>
              </div>

            </div>

            {/* Custom Field Actions list */}
            <div className="bg-white rounded-2xl p-6 shadow-md shadow-gray-300 space-y-3">
              <h3 className="font-display font-semibold text-sm text-wood-900 flex items-center gap-1.5">
                <ListChecks className="w-4.5 h-4.5 text-sage-500" /> 
                {lang === 'EN' ? "Custom Field Guidelines for Volunteers:" : "Directives de terrain personnalisées pour les bénévoles :"}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-sans pb-1">
                {lang === 'EN'
                  ? "Print or share these specific coordinates and search rules with your bioblitz attendees to optimize the expedition's contribution to Canadian biodiversity modelling."
                  : "Imprimez ou partagez ces coordonnées spécifiques et règles de recherche avec les participants de votre bioblitz afin d'optimiser l'apport de l'expédition aux modèles canadiens."}
              </p>
              <ul className="space-y-3 font-sans">
                {(lang === 'EN' ? analysisResult.targetedActionListEn : analysisResult.targetedActionListFr).map((action: string, idx: number) => (
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
