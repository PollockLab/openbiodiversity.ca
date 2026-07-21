/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import UsefulLayersView from './components/UsefulLayersView';
import SdmExplorerView from './components/SdmExplorerView';
import BlitzGapView from './components/BlitzGapView';
import AboutView from './components/AboutView';
import ContactView from './components/ContactView';
import BioblitzStandaloneView from './components/BioblitzStandaloneView';
import { LanguageProvider, useLanguage } from './lib/LanguageContext';

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

function AppContent() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['home', 'useful-layers', 'sdm-explorer', 'blitz-gap', 'about', 'contact'];
      if (validTabs.includes(hash)) {
        return hash;
      }
    }
    return 'home';
  });

  // Check for standalone view mode parameter
  const [params] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return {
        view: p.get('view'),
        url: p.get('url') || ''
      };
    }
    return { view: null, url: '' };
  });

  // Sync activeTab to URL Hash
  React.useEffect(() => {
    if (typeof window !== 'undefined' && params.view !== 'bioblitz-analyzer') {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash !== activeTab) {
        window.location.hash = activeTab;
      }
    }
  }, [activeTab, params.view]);

  // Listen for hash changes (e.g., browser back/forward buttons)
  React.useEffect(() => {
    if (params.view === 'bioblitz-analyzer') return;

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['home', 'useful-layers', 'sdm-explorer', 'blitz-gap', 'about', 'contact'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [params.view]);

  React.useEffect(() => {
    if (params.view === 'bioblitz-analyzer') return;
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, [activeTab, params.view]);

  if (params.view === 'bioblitz-analyzer') {
    return <BioblitzStandaloneView initialUrl={params.url} />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView setActiveTab={setActiveTab} />;
      case 'useful-layers':
        return <UsefulLayersView />;
      case 'sdm-explorer':
        return <SdmExplorerView />;
      case 'blitz-gap':
        return <BlitzGapView />;
      case 'about':
        return <AboutView />;
      case 'contact':
        return <ContactView />;
      default:
        return <HomeView setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]/45 font-sans selection:bg-sage-200 selection:text-sage-900">
      
      {/* Dynamic Header Component */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Structural Layout Content Frame */}
      <main id="main-content-frame" className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveView()}
      </main>

      {/* Dynamic Footer Component */}
      <Footer setActiveTab={setActiveTab} />
      
    </div>
  );
}


