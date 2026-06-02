import React, { useState, useEffect, useRef } from 'react';
import { Globe, Map as MapIcon, Layers, Eye, Shield, Compass, Navigation, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

interface GlobePlaceholderProps {
  mode: 'useful-layers' | 'sdm-explorer' | 'blitz-gap';
  selectedLayerId?: string; // for useful layers
  selectedSdmId?: string; // for SDMs
  activeTaxonGroup?: string; // e.g. Mammal, Bird, etc.
  biasCorrected?: boolean;
  showUncertainty?: boolean;
  selectedCaseStudyId?: 'general' | 'kbas' | 'bc-parks' | 'newfoundland';
}

export default function GlobePlaceholder({
  mode,
  selectedLayerId = 'layer-1',
  selectedSdmId,
  activeTaxonGroup = 'All',
  biasCorrected = true,
  showUncertainty = false,
  selectedCaseStudyId = 'general',
}: GlobePlaceholderProps) {
  const [zoom, setZoom] = useState<number>(3);
  const [rotation, setRotation] = useState<number>(-95); // centered on Canada longitude
  const [latitude, setLatitude] = useState<number>(56); // centered on Canada latitude
  const [mapType, setMapType] = useState<'topo' | 'satellite' | 'terrain'>('topo');
  const [hoveredCoords, setHoveredCoords] = useState<{ lat: string; lng: string; value?: string } | null>({ lat: '56.1304° N', lng: '106.3468° W', value: 'Baseline data' });
  const [simulationActive, setSimulationActive] = useState<boolean>(true);
  const [opacity, setOpacity] = useState<number>(85);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Generate random data points overlay representing observations or grid density
  const [gridCells, setGridCells] = useState<Array<{ x: number; y: number; val: number; kba?: boolean; park?: boolean; gap?: boolean }>>([]);

  useEffect(() => {
    // Generate static-ish semi-random cells representing Canada geography layout
    const cells = [];
    const seedRandom = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(Math.sin(hash));
    };

    // Determine density intensity based on active parameters
    const seed = `${mode}-${selectedLayerId}-${selectedSdmId}-${activeTaxonGroup}-${selectedCaseStudyId}`;
    const strengthMultiplier = seedRandom(seed);

    for (let i = 0; i < 45; i++) {
      const rVal = seedRandom(`${seed}-${i}`);
      // restrict to a broad Canada boundary shape
      const x = 15 + (rVal * 70); // 15% to 85% width
      const y = 20 + (seedRandom(`y-${seed}-${i}`) * 55); // 20% to 75% height

      // check if it fits regional highlights of case studies
      let inCaseStudyRegion = false;
      if (selectedCaseStudyId === 'newfoundland' && x > 70 && y > 45) inCaseStudyRegion = true;
      if (selectedCaseStudyId === 'bc-parks' && x < 40 && y < 55) inCaseStudyRegion = true;
      if (selectedCaseStudyId === 'kbas' && rVal > 0.4) inCaseStudyRegion = true;

      cells.push({
        x,
        y,
        val: Math.floor(rVal * 100),
        kba: selectedCaseStudyId === 'kbas' && rVal > 0.5,
        park: selectedCaseStudyId === 'bc-parks' && rVal > 0.4 && x < 40,
        gap: rVal > 0.75 // Data Gap (Red highlighted)
      });
    }
    setGridCells(cells);
  }, [mode, selectedLayerId, selectedSdmId, activeTaxonGroup, selectedCaseStudyId]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert relative coordinates to reasonable Canada coordinates
    const pLng = -140 + (x / rect.width) * 85;
    const pLat = 83 - (y / rect.height) * 38;

    // Simulate an observation lookup value
    let simulatedValue = 'N/A';
    if (mode === 'useful-layers') {
      simulatedValue = `${(Math.sin((x + y) * 0.05) * 50 + 50).toFixed(1)} index score`;
    } else if (mode === 'sdm-explorer') {
      const probability = (Math.sin(x * 0.03) * Math.cos(y * 0.04) * 0.5 + 0.5) * 100;
      simulatedValue = `${biasCorrected ? '(Bias-Corrected) ' : ''}Prob: ${probability.toFixed(0)}%`;
    } else if (mode === 'blitz-gap') {
      const density = Math.floor((Math.sin(x * 0.01) * Math.cos(y * 0.02) * 0.5 + 0.5) * 45);
      simulatedValue = density === 0 ? 'Data Gap Sector (0 records)' : `${density} iNat obs/km²`;
    }

    setHoveredCoords({
      lat: `${pLat.toFixed(4)}° N`,
      lng: `${Math.abs(pLng).toFixed(4)}° W`,
      value: simulatedValue
    });
  };

  // Adjust visualization colors based on standard mode themes
  const getCellColor = (cell: typeof gridCells[0]) => {
    if (showUncertainty && mode === 'sdm-explorer') {
      // Uncertainty layer is typically high-contrast hot pink / magenta for warning zones
      return cell.val > 60 ? 'bg-fuchsia-500/70 border border-fuchsia-300' : 'bg-fuchsia-300/40';
    }

    if (mode === 'blitz-gap') {
      // Blitz the gap filters
      if (selectedCaseStudyId === 'bc-parks') {
        if (cell.park) {
          return 'bg-emerald-500/70 shadow-sm shadow-emerald-500/50 border border-emerald-300';
        }
        return cell.gap ? 'bg-orange-500/40 border-dashed border-orange-400' : 'bg-sage-500/20';
      }
      if (selectedCaseStudyId === 'kbas') {
        if (cell.kba) {
          return 'bg-amber-600/60 shadow-lg shadow-amber-600/30 border border-amber-300';
        }
        return cell.value && cell.val > 70 ? 'bg-rose-500/50 border border-rose-300' : 'bg-sage-600/10';
      }
      if (selectedCaseStudyId === 'newfoundland') {
        const isEastCoast = cell.x > 65;
        if (isEastCoast) return cell.gap ? 'bg-red-500/70 border border-red-300 animate-pulse' : 'bg-orange-400/40';
        return 'bg-stone-500/10';
      }
      // General map
      return cell.gap ? 'bg-red-500/80 shadow-md shadow-red-500/20 border border-red-300 animate-pulse' : 'bg-sage-500/30 border border-sage-300/20';
    }

    if (mode === 'sdm-explorer') {
      // SDM probability map (Sages & Greens)
      const alpha = (opacity / 100).toFixed(2);
      if (cell.val < 35) return 'hidden'; // threshold clipping
      if (cell.val > 75) return `bg-sage-700/80 border border-sage-200`;
      return `bg-sage-500/60`;
    }

    // Default or Useful Layers
    switch (selectedLayerId) {
      case 'layer-1': // Human Footprint Index (Grays, purples, reds)
        return cell.val > 70 ? 'bg-purple-700/80 border border-purple-400' : cell.val > 40 ? 'bg-amber-600/60' : 'bg-emerald-600/30';
      case 'layer-2': // Expected Richness (Thermatic yellow-green-dark blue)
        return cell.val > 80 ? 'bg-emerald-800/80 border border-emerald-400' : cell.val > 40 ? 'bg-lime-500/60' : 'bg-yellow-300/40';
      case 'layer-3': // Climate Velocity
        return cell.val > 60 ? 'bg-cyan-500/70' : 'bg-blue-300/40';
      case 'layer-4': // KBA polygons
        return 'bg-amber-500/40 border-2 border-amber-500';
      case 'layer-5': // Soil Carbon Stocks
        return cell.val > 60 ? 'bg-amber-950/80' : 'bg-amber-800/40';
      case 'layer-6': // CPCAD Protected
        return 'bg-emerald-600/50 border border-emerald-400';
      case 'layer-7': // Intact forest
        return cell.val > 50 ? 'bg-emerald-950/90' : 'hidden';
      case 'layer-8': // Canopy Height
        return cell.val > 70 ? 'bg-emerald-700/80' : cell.val > 40 ? 'bg-emerald-500/50' : 'bg-emerald-300/20';
      case 'layer-9': // Linear density
        return cell.val > 65 ? 'bg-red-500/60' : 'hidden';
      case 'layer-10': // Hydrological Flow
        return 'bg-cyan-600/40 border-b border-cyan-300';
      default:
        return 'bg-sage-500/40';
    }
  };

  return (
    <div className="flex flex-col bg-white border border-sage-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Map Control bar */}
      <div className="bg-sage-50/70 border-b border-sage-100 py-3 px-5 flex flex-wrap justify-end items-center gap-3">
        
        {/* Toggle layers controls */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-sage-200">
          <button
            onClick={() => setMapType('topo')}
            className={`px-3 py-1 text-xs rounded-md transition-all ${mapType === 'topo' ? 'bg-sage-500 text-white font-medium shadow-sm' : 'text-wood-600 hover:text-wood-900'}`}
          >
            OpenStreetMap Trails
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-3 py-1 text-xs rounded-md transition-all ${mapType === 'satellite' ? 'bg-sage-500 text-white font-medium shadow-sm' : 'text-wood-600 hover:text-wood-900'}`}
          >
            Satellite Toggle
          </button>
          <button
            onClick={() => setMapType('terrain')}
            className={`px-3 py-1 text-xs rounded-md transition-all ${mapType === 'terrain' ? 'bg-sage-500 text-white font-medium shadow-sm' : 'text-wood-600 hover:text-wood-900'}`}
          >
            UTM Terrain
          </button>
        </div>
      </div>

      {/* Main visualization frame */}
      <div className="relative flex-1 min-h-[420px] bg-slate-900 select-none overflow-hidden" ref={mapContainerRef} onMouseMove={handleMouseMove}>
        {/* Canvas visual grid and background matching selected base maps */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${mapType === 'satellite' ? 'bg-radial from-[#1e3a24] via-[#0b171c] to-[#04090d]' : mapType === 'terrain' ? 'bg-gradient-to-b from-[#e3eede] via-[#cfd9cc] to-[#b4beaf]' : 'bg-[#eef4f0]'}`}>
          {/* Faux grid cells to outline map coordinates lines */}
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-8 opacity-20 pointer-events-none">
            {Array.from({ length: 96 }).map((_, idx) => (
              <div key={idx} className="border-t border-l border-wood-500/20" />
            ))}
          </div>

          {/* Canada geographic outline drawing (SVG Silhouette) to look like a real map */}
          <svg className="absolute inset-x-0 inset-y-4 w-full h-[95%] opacity-30 pointer-events-none text-wood-500" viewBox="0 0 1000 600" fill="currentColor">
            {/* Extremely approximate path mapping Canada continental contours, islands & Great Lakes */}
            <path d="M 120 180 Q 150 140 230 110 T 380 90 T 520 120 T 680 70 T 820 90 T 890 240 Q 910 280 870 340 T 780 430 T 620 480 T 490 490 T 360 450 T 210 490 T 110 390 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
            {/* Newfoundland Island */}
            <path d="M 830 380 L 890 370 L 870 430 Z" />
            {/* Vancouver Island */}
            <path d="M 110 390 L 130 420 L 100 450 Z" />
            {/* Hudson Bay contour */}
            <path d="M 450 200 C 470 280 580 280 610 210 C 620 180 580 160 540 180 Z" fill={mapType === 'satellite' ? '#04090d' : '#acc8be'} />
            {/* Great Lakes contours */}
            <circle cx="580" cy="440" r="15" fill={mapType === 'satellite' ? '#04090d' : '#acc8be'} />
            <circle cx="620" cy="450" r="12" fill={mapType === 'satellite' ? '#04090d' : '#acc8be'} />
            <circle cx="660" cy="430" r="14" fill={mapType === 'satellite' ? '#04090d' : '#acc8be'} />
          </svg>

          {/* GridCells representing data overlays */}
          <div className="absolute inset-0">
            {gridCells.map((cell, idx) => (
              <div
                key={idx}
                className={`absolute w-7 h-7 rounded-md transition-all duration-300 flex items-center justify-center ${getCellColor(cell)}`}
                style={{
                  left: `${cell.x}%`,
                  top: `${cell.y}%`,
                  transform: `translate(-50%, -50%) scale(${zoom / 3})`,
                }}
              >
                {/* Specific features markings */}
                {mode === 'blitz-gap' && cell.gap && (
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-ping absolute" />
                )}
                {mode === 'blitz-gap' && selectedCaseStudyId === 'bc-parks' && cell.park && (
                  <Shield className="w-3 h-3 text-emerald-900" />
                )}
                {mode === 'sdm-explorer' && cell.val > 75 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-sage-200" />
                )}
              </div>
            ))}
          </div>

          {/* Compass Rose illustration */}
          <div className="absolute bottom-6 right-6 flex flex-col items-center gap-1 opacity-65 text-wood-700 pointer-events-none">
            <div className="relative w-12 h-12 rounded-full border border-wood-500/40 flex items-center justify-center bg-white/40 backdrop-blur-xs">
              <Compass className="w-8 h-8 text-wood-600 animate-[spin_12s_linear_infinite]" style={{ transform: `rotate(${rotation}deg)` }} />
              <span className="absolute -top-3 text-[10px] font-mono font-bold">N</span>
              <span className="absolute -bottom-3 text-[10px] font-mono font-bold">S</span>
              <span className="absolute -left-3 text-[10px] font-mono font-bold">W</span>
              <span className="absolute -right-3 text-[10px] font-mono font-bold">E</span>
            </div>
          </div>

          {/* Zoom & Rotation overlay hud */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 bg-white/80 backdrop-blur-md p-2.5 rounded-xl border border-sage-200 shadow-xs max-w-xs text-xs pointer-events-auto">
            <div className="font-semibold text-wood-900 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-sage-600" /> Map Projection HUD
            </div>
            <div className="text-[10px] text-wood-600 font-mono">
              <div>Scale Zoom: {zoom}x (Canada-aligned)</div>
              <div>Center Lat: {latitude}° N</div>
              <div>Center Lng: {Math.abs(rotation + 15).toFixed(0)}° W</div>
            </div>
            
            {/* Simulated sliders */}
            <div className="mt-1.5 pt-1.5 border-t border-sage-200 flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] text-wood-600">
                <span>Zoom Level</span>
                <div className="flex gap-1">
                  <button onClick={() => setZoom(z => Math.max(1, z - 1))} className="p-0.5 rounded hover:bg-sage-200 text-wood-900"><ZoomOut className="w-3 h-3" /></button>
                  <button onClick={() => setZoom(z => Math.min(6, z + 1))} className="p-0.5 rounded hover:bg-sage-200 text-wood-900"><ZoomIn className="w-3 h-3" /></button>
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-wood-600 mt-1">
                <span>Opacity ({opacity}%)</span>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-16 h-1 bg-sage-200 rounded-lg appearance-none cursor-pointer accent-sage-600"
                />
              </div>
            </div>
          </div>

          {/* Hover coordinate panel */}
          {hoveredCoords && (
            <div className="absolute bottom-4 left-4 bg-wood-900/90 text-white p-3 rounded-xl border border-wood-700 shadow-md max-w-xs font-mono text-xs flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-sage-200 font-bold border-b border-wood-700 pb-1 mb-1">
                <Navigation className="w-3 h-3 text-sage-400 rotate-45" /> Live Cell Probe
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-stone-400">Coord:</span>
                <span>{hoveredCoords.lat}, {hoveredCoords.lng}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-stone-400">Value:</span>
                <span className="text-sage-300 font-semibold">{hoveredCoords.value}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Legend Footer */}
      <div className="bg-wood-50 border-t border-sage-100 p-4 font-sans text-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-wood-700">Map Legend:</span>
            
            {mode === 'blitz-gap' ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-red-500 border border-red-300 inline-block" />
                  <span className="text-wood-600">Observation Gap (High Priority)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-sage-500/30 border border-sage-300 inline-block" />
                  <span className="text-wood-600">Sampled Zone (&ge; 1 Record)</span>
                </div>
                {selectedCaseStudyId === 'bc-parks' && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-500/70 border border-emerald-300 flex items-center justify-center inline-block">
                      <Shield className="w-2 h-2 text-emerald-950" />
                    </span>
                    <span className="text-wood-600">BC Parks boundary polygon</span>
                  </div>
                )}
                {selectedCaseStudyId === 'kbas' && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-amber-600/60 border border-amber-300 inline-block" />
                    <span className="text-wood-600">Key Biodiversity Area (KBA) Polygons</span>
                  </div>
                )}
              </>
            ) : mode === 'sdm-explorer' ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-sage-700 border border-sage-200 inline-block" />
                  <span className="text-wood-600">High Occurrence Probability (&gt;75%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-sage-500/60 inline-block" />
                  <span className="text-wood-600">Medium Occurrence Probability (35%-75%)</span>
                </div>
                {showUncertainty && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-fuchsia-500/70 border border-fuchsia-300 inline-block" />
                    <span className="text-wood-600">High Model Uncertainty Area</span>
                  </div>
                )}
              </>
            ) : (
              // Useful layers maps
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-600/70 inline-block" />
                  <span className="text-wood-600">Optimal Score / Intact Zone</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-amber-600/60 inline-block" />
                  <span className="text-wood-600">Moderate Threat / Edge Corridor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-purple-700/80 inline-block" />
                  <span className="text-wood-600">High Human Footprint / Fragmented</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 text-wood-500 text-[11px] font-mono">
            <span>Projection: WGS-84 Web-Globe</span>
            <span>Resolution: ~1km Pixel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
