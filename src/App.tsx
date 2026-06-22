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

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');

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

