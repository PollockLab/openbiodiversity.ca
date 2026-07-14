import React, { useState } from 'react';
import { Award } from 'lucide-react';

export default function BioblitzAnalyzer() {
  const [url, setUrl] = useState<string>('');

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md shadow-gray-300 font-sans">
      <div className="space-y-4">
        
        {/* Simple compact header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sage-53 text-sage-600 border border-sage-100 rounded-xl shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base text-wood-950 leading-snug">
              BioBlitz Analyser
            </h3>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              Input your iNaturalist project link to calculate spatial complete targets and volunteer priorities.
            </p>
          </div>
        </div>

        {/* Input field and the custom URL Analyser trigger link */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <input
            type="url"
            placeholder="e.g. https://www.inaturalist.org/projects/miguasha-bioblitz"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sage-500 text-wood-700 font-sans"
          />
          <a
            href={`?view=bioblitz-analyzer&url=${encodeURIComponent(url || 'https://www.inaturalist.org/projects/miguasha-bioblitz')}`}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center justify-center font-bold text-[10px] uppercase tracking-wider px-6 py-3 rounded-full bg-sage-500 text-white hover:bg-sage-600 transition-all ${
              !url.trim() ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer shadow-3xs'
            }`}
          >
            Analyse
          </a>
        </div>

      </div>
    </div>
  );
}
