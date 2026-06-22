import React, { useState, useEffect } from 'react';
import { Menu, X, Globe, MapPinned, Info, Mail, Compass, HelpCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
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
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'blitz-gap', label: 'Blitz the Gap 2026', icon: HelpCircle },
    { id: 'useful-layers', label: '10 Useful Layers', icon: Globe },
    { id: 'sdm-explorer', label: 'SDMs (500+)', icon: MapPinned },
    { id: 'about', label: 'About', icon: Info },
    { id: 'contact', label: 'Contact', icon: Mail }
  ];

  return (
    <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-sage-100 shadow-2xs transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'}`}>

      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Brand Representation - Redrawn as high contrast vector SVG replicating the hand-sketched user logo */}
          <div
            onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            {/* Custom SVG logo mimicking the maple leaf inside magnifying glass */}
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform transition-transform group-hover:rotate-6">
                {/* Magnifying Glass Handle - rustic sand-brown hex */}
                <path d="M 68 68 L 90 90" stroke="#b4aba4" strokeWidth="10" strokeLinecap="round" />
                <circle cx="85" cy="85" r="3" fill="#8ba884" />
                {/* Magnifying Glass Frame - warm gray wood */}
                <circle cx="45" cy="45" r="30" fill="none" stroke="#5d514a" strokeWidth="6" />
                {/* Inside Reflection */}
                <circle cx="45" cy="45" r="27" fill="#f4f6f3" />
                {/* Maple Leaf - pastel olive green */}
                <path d="M 45 22 
                         L 49 32 L 58 30 L 53 38 L 63 43 L 52 47 L 54 57 L 45 51 
                         L 36 57 L 38 47 L 27 43 L 37 38 L 32 30 L 41 32 Z" 
                      fill="#8ba884" />
                <path d="M 45 51 L 45 61" stroke="#5d514a" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            
            <div className="flex flex-col">
              <span className="font-display font-bold tracking-tight text-wood-900 text-lg leading-tight">
                openbiodiversity<span className="text-sage-600">.ca</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#74926d] uppercase font-semibold leading-normal">
                Biodiversity Layers &bull; Blitz the Gap
              </span>
            </div>
          </div>

          {/* Desktop Navigation Grouped on the Right */}
          <div className="hidden lg:flex items-center space-x-7 text-sm font-medium ml-auto">
            {navItems.map((item) => {
              const isActive = activeTab === item.id || (item.id === 'blitz-gap' && activeTab.startsWith('blitz-'));
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`py-5 text-sm transition-all cursor-pointer relative ${
                    isActive 
                      ? 'text-sage-500 font-semibold border-b-2 border-sage-500' 
                      : 'text-gray-500 hover:text-sage-500'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
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
  );
}
