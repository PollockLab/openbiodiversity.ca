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

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');

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
      <main id="main-content-frame" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveView()}
      </main>

      {/* Dynamic Footer Component */}
      <Footer setActiveTab={setActiveTab} />
      
    </div>
  );
}

