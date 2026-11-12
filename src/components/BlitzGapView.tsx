import React from 'react';
import { ExternalLink } from 'lucide-react';
import { staticBtg2025Milestone } from '../data/blitzTheGapData';
import { useLanguage } from '../lib/LanguageContext';

export default function BlitzGapView() {
  const { lang } = useLanguage();

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
              <span className="text-lg sm:text-xl font-bold font-sans text-sage-700 block leading-tight">{staticBtg2025Milestone.uniqueEmptyCellsConquered}</span>
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
              <span className="text-lg sm:text-xl font-bold font-sans text-sage-700 block leading-tight">{staticBtg2025Milestone.speciesWithFirstObservation}</span>
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
              <span className="text-lg sm:text-xl font-bold font-sans text-sage-700 block leading-tight">{staticBtg2025Milestone.speciesReaching100Observations}</span>
              <span className="text-[10px] text-sage-600 font-sans font-medium block mt-1 leading-tight">
                {lang === 'EN' ? "Species reaching 100 observations on iNat" : "Espèces atteignant 100 observations sur iNat"}
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Full span map visualizer */}
      <section className="w-full bg-white rounded-2xl overflow-hidden shadow-md shadow-gray-300">
        <iframe
          src="https://pollocklab.github.io/where-to-blitz/"
          title="Where to Blitz Map"
          className="w-full h-[650px] md:h-[750px] border-0"
          allow="geolocation"
        />
      </section>

    </div>
  );
}
