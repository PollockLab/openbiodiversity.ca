import React, { useState, useEffect } from 'react';
import { Menu, X, Globe, MapPinned, Info, Mail, Compass } from 'lucide-react';
import LogoIcon from './LogoIcon';
import btgLogo from '../pictures/BTG logo.png';
import { useLanguage } from '../lib/LanguageContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { lang, setLang } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      // If mobile menu is open, do not hide the header
      if (mobileMenuOpen) return;
      
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        // Always visible at the top
        setVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // Scrolling down and past the header height -> hide
        setVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up -> show
        setVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY, mobileMenuOpen]);

  const navItems = [
    { id: 'home', label: lang === 'EN' ? 'Home' : 'Accueil', icon: Compass },
    { id: 'blitz-gap', label: 'Blitz the Gap 2026', icon: LogoIcon },
    { id: 'useful-layers', label: lang === 'EN' ? '10 Useful Layers' : '10 couches utiles', icon: Globe },
    { id: 'sdm-explorer', label: lang === 'EN' ? 'SDMs (500+)' : 'SDM (500+)', icon: MapPinned },
    { id: 'about', label: lang === 'EN' ? 'About' : 'À propos', icon: Info },
    { id: 'contact', label: lang === 'EN' ? 'Contact' : 'Contact', icon: Mail }
  ];

  return (
    <>
      <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-sage-100 shadow-2xs transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'}`}>

        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
                      {/* Left brand column with logo and text */}
            <div className="flex flex-col items-start py-1 justify-center">
              <div
                onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 cursor-pointer select-none group"
              >
                {/* Logo Brand Representation using imported BTG logo image with hover rotation animation */}
                <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-transparent">
                  <img 
                    src={btgLogo} 
                    alt="BTG Logo" 
                    className="w-[230%] h-full max-w-none object-cover transform transition-transform duration-300 group-hover:rotate-6"
                    style={{ objectPosition: '0% center' }}
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="flex flex-col">
                  <span className="font-display font-bold tracking-tight text-wood-900 text-lg leading-tight">
                    openbiodiversity<span className="text-sage-600">.ca</span>
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-[#74926d] uppercase font-semibold leading-normal">
                    {lang === 'EN' ? 'Biodiversity Layers' : 'Couches de biodiversité'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right column: Desktop Navigation and Language Switcher */}
            <div className="hidden lg:flex items-center space-x-6 text-sm font-medium ml-auto">
              <div className="flex items-center space-x-6">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id || (item.id === 'blitz-gap' && activeTab.startsWith('blitz-'));
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`pb-1 text-sm transition-all cursor-pointer relative ${
                        isActive 
                          ? 'text-sage-600 font-extrabold border-b-2 border-sage-500' 
                          : 'text-gray-550 hover:text-sage-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="h-4 w-[1px] bg-sage-200" />

              {/* Small, compact language switcher within the bar */}
              <div className="flex items-center border border-gray-200/80 rounded-lg p-0.5 bg-gray-50/50">
                <button
                  onClick={() => setLang('EN')}
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                    lang === 'EN'
                      ? 'bg-sage-600 text-white shadow-3xs'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang('FR')}
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                    lang === 'FR'
                      ? 'bg-sage-600 text-white shadow-3xs'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  FR
                </button>
              </div>
            </div>

            {/* Mobile menu button and language toggles */}
            <div className="flex lg:hidden items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-gray-50/50">
                <button
                  onClick={() => setLang('EN')}
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                    lang === 'EN'
                      ? 'bg-sage-600 text-white shadow-xs'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang('FR')}
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                    lang === 'FR'
                      ? 'bg-sage-600 text-white shadow-xs'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  FR
                </button>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-wood-600 hover:text-wood-900 hover:bg-sage-50 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-sage-100 px-4 py-4 space-y-1.5 shadow-inner">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all cursor-pointer ${isActive ? 'bg-sage-500 text-white shadow-xs' : 'text-wood-600 hover:text-wood-900 hover:bg-sage-50'}`}
                >
                  <IconComponent className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>
    </>
  );
}
