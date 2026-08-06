import React from 'react';
import { Globe, Heart, Shield, Landmark, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export default function Footer({ setActiveTab }: FooterProps) {
  const { lang } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-wood-100/50 text-wood-900 border-t border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Brand Intro Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-wood-900 text-lg">
                openbiodiversity<span className="text-sage-500">.ca</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              {lang === 'EN' 
                ? "Canada's open-access biodiversity data platform."
                : "La plateforme de données sur la biodiversité en libre accès du Canada."}
            </p>
            <div className="text-[10px] font-mono text-gray-400">
              {lang === 'EN'
                ? "Developed by the Quantitative Biodiversity Lab, McGill University."
                : "Développée par le Laboratoire de biodiversité quantitative, Université McGill."}
            </div>
          </div>
 
          {/* Quick Tabs Columns */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-wood-900 mb-3">
              {lang === 'EN' ? "Explore" : "Explorer"} 
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-600">
              <li>
                <button onClick={() => setActiveTab('useful-layers')} className="hover:text-sage-500 transition-colors cursor-pointer">
                  {lang === 'EN' ? "10 Useful Layers for Conservation" : "10 couches utiles pour la conservation"}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('sdm-explorer')} className="hover:text-sage-500 transition-colors cursor-pointer">
                  {lang === 'EN' ? "Species Distributions" : "Distributions des espèces"}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('blitz-gap')} className="hover:text-sage-500 transition-colors cursor-pointer">
                  Blitz the Gap 2026
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('about')} className="hover:text-sage-500 transition-colors cursor-pointer">
                  {lang === 'EN' ? "About" : "À propos"}
                </button>
              </li>
            </ul>
          </div>
 
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-400 gap-4">
          <div>
            &copy; {currentYear} openbiodiversity.ca &bull; {lang === 'EN' ? "Released in Canada under CC BY 4.0." : "Publié au Canada sous licence CC BY 4.0."}
          </div>

        </div>
      </div>
    </footer>
  );
}
