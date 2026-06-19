import React, { useState, useEffect, useRef } from 'react';
import { Globe, Map as MapIcon, Layers, Eye, Shield, Compass, Navigation, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Helper to provide compliant styles reactively based on selected Map type
const getMapStyle = (type: 'topo' | 'satellite' | 'terrain') => {
  const dpr = typeof window !== 'undefined' && window.devicePixelRatio >= 2 ? '@2x' : '';
  let tilesUrl = `https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}${dpr}.png`;
  let attribution = '© <a href="https://carto.com/attributions">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  if (type === 'satellite') {
    tilesUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    attribution = '© Esri — Source: Esri, USDA, USGS, and the GIS User Community';
  } else if (type === 'terrain') {
    tilesUrl = 'https://tile.opentopomap.org/{z}/{x}/{y}.png';
    attribution = '© <a href="https://opentopomap.org">OpenTopoMap</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  }

  return {
    version: 8 as const,
    sources: {
      'raster-tiles': {
        type: 'raster' as const,
        tiles: [tilesUrl],
        tileSize: 256,
        attribution
      }
    },
    layers: [
      {
        id: 'simple-tiles-layer',
        type: 'raster' as const,
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 18
      }
    ]
  };
};

interface GlobePlaceholderProps {
  mode: 'useful-layers' | 'sdm-explorer' | 'blitz-gap';
  selectedLayerId?: string; // for useful layers
  selectedLayerIds?: string[]; // Multiple layer IDs support
  layerOpacities?: Record<string, number>; // Individual opacity layers support
  selectedSdmId?: string; // for SDMs
  activeTaxonGroup?: string; // e.g. Mammal, Bird, etc.
  biasCorrected?: boolean;
  showUncertainty?: boolean;
  selectedCaseStudyId?: 'general' | 'kbas' | 'bc-parks' | 'newfoundland';
  onTaxonGroupChange?: (group: string) => void;
  onBiasCorrectedChange?: (val: boolean) => void;
  onShowUncertaintyChange?: (val: boolean) => void;
}

export default function GlobePlaceholder({
  mode,
  selectedLayerId = 'layer-1',
  selectedLayerIds = ['layer-1'],
  layerOpacities = {},
  selectedSdmId,
  activeTaxonGroup = 'All',
  biasCorrected = true,
  showUncertainty = false,
  selectedCaseStudyId = 'general',
  onTaxonGroupChange,
  onBiasCorrectedChange,
  onShowUncertaintyChange,
}: GlobePlaceholderProps) {
  const [zoom, setZoom] = useState<number>(3.2);
  const [rotation, setRotation] = useState<number>(0); 
  const [latitude, setLatitude] = useState<number>(60); 
  const [mapType, setMapType] = useState<'topo' | 'satellite' | 'terrain'>('topo');
  const [hoveredCoords, setHoveredCoords] = useState<{ lat: string; lng: string; value?: string } | null>({ lat: '56.1304° N', lng: '106.3468° W', value: 'Baseline data' });
  const [simulationActive, setSimulationActive] = useState<boolean>(true);
  const [opacity, setOpacity] = useState<number>(85);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [projectedCells, setProjectedCells] = useState<Array<{ x: number; y: number; original: any }>>([]);

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
    const seed = `${mode}-${selectedLayerIds ? selectedLayerIds.join(',') : selectedLayerId}-${selectedSdmId}-${activeTaxonGroup}-${selectedCaseStudyId}`;
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

  const updateCellProjections = (mapInstance: maplibregl.Map | null) => {
    if (!mapInstance) return;
    try {
      const projected = gridCells.map(cell => {
        const lng = -140 + (cell.x / 100) * 85;
        const lat = 83 - (cell.y / 100) * 38;
        const point = mapInstance.project([lng, lat]);
        return {
          x: point.x,
          y: point.y,
          original: cell
        };
      });
      setProjectedCells(projected);
    } catch (e) {
      // guard against any projection issues during initialization
    }
  };

  // Synchronize projected cells when gridCells change or Map changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.resize();
      updateCellProjections(mapRef.current);
    }
  }, [gridCells]);

  // Handle map initialization and events
  useEffect(() => {
    if (!mapDivRef.current) return;

    const map = new maplibregl.Map({
      container: mapDivRef.current,
      // try out inserting base map style here.
      // apparently with straight url would fix problem caused by maplibre/carto issue (?)
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [-98, 60], // Centered beautifully over Canada
      zoom: 3.2,
      maxZoom: 14,
      minZoom: 1.5,
      bearing: 0,
      pitch: 0,
      dragRotate: false, // keep it aligned but allow zoom & pan
    });

    mapRef.current = map;

    const onMapEvent = () => {
      updateCellProjections(map);
      setZoom(map.getZoom());
      setRotation(map.getBearing());
    };

    map.on('load', () => {
      map.resize();
      onMapEvent();
    });
    map.on('move', onMapEvent);
    map.on('zoom', onMapEvent);
    map.on('resize', onMapEvent);

    // Call resize to ensure accurate calculations after render pipeline settles
    const timer1 = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
        updateCellProjections(mapRef.current);
      }
    }, 150);

    const timer2 = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
        updateCellProjections(mapRef.current);
      }
    }, 600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      map.remove();
      mapRef.current = null;
    };
  }, []);
  
  // comment out to allow base map to be loaded properly.
  // Set style when mapType changes
  //useEffect(() => {
  //  if (mapRef.current) {
  //    mapRef.current.setStyle(getMapStyle(mapType));
  //  }
  //}, [mapType]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let pLat = 56;
    let pLng = -106;

    if (mapRef.current) {
      try {
        const lngLat = mapRef.current.unproject([x, y]);
        pLat = lngLat.lat;
        pLng = lngLat.lng;
      } catch (err) {
        pLng = -140 + (x / rect.width) * 85;
        pLat = 83 - (y / rect.height) * 38;
      }
    } else {
      pLng = -140 + (x / rect.width) * 85;
      pLat = 83 - (y / rect.height) * 38;
    }

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

  const getCellColorForLayer = (cell: any, lId: string) => {
    switch (lId) {
      case 'layer-1': 
        return cell.val > 70 ? 'bg-purple-700 border border-purple-400' : cell.val > 40 ? 'bg-amber-600' : 'bg-emerald-600';
      case 'layer-2': 
        return cell.val > 80 ? 'bg-emerald-800 border border-emerald-400' : cell.val > 40 ? 'bg-lime-500' : 'bg-yellow-300';
      case 'layer-3': 
        return cell.val > 60 ? 'bg-cyan-500' : 'bg-blue-300';
      case 'layer-4': 
        return 'bg-amber-500 border-2 border-amber-500';
      case 'layer-5': 
        return cell.val > 60 ? 'bg-amber-950' : 'bg-amber-800';
      case 'layer-6': 
        return 'bg-emerald-600 border border-emerald-400';
      case 'layer-7': 
        return cell.val > 50 ? 'bg-emerald-950/90' : 'hidden';
      case 'layer-8': 
        return cell.val > 70 ? 'bg-emerald-700' : cell.val > 40 ? 'bg-emerald-500' : 'bg-emerald-300';
      case 'layer-9': 
        return cell.val > 65 ? 'bg-red-500' : 'hidden';
      case 'layer-10': 
        return 'bg-cyan-600 border-b border-cyan-300';
      default:
        return 'bg-sage-500';
    }
  };

  return (
    <div className="flex flex-col bg-white border border-sage-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Map Control bar */}
      <div className="bg-sage-50/70 border-b border-sage-100 py-2.5 px-5 flex flex-wrap justify-between items-center gap-3">
        {mode === 'sdm-explorer' && onBiasCorrectedChange && onShowUncertaintyChange ? (
          <div className="flex items-center gap-1.5 font-sans">
            <span className="text-xs font-semibold text-gray-650">Model Presentation:</span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-sage-200">
              <button
                onClick={() => onBiasCorrectedChange(!biasCorrected)}
                className={`px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${biasCorrected ? 'bg-sage-500 text-white font-medium shadow-sm' : 'text-wood-650 hover:text-wood-950 hover:bg-gray-50'}`}
              >
                {biasCorrected ? 'Bias-Corrected' : 'Raw Model'}
              </button>
              <button
                onClick={() => onShowUncertaintyChange(!showUncertainty)}
                className={`px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${showUncertainty ? 'bg-fuchsia-600 text-white font-medium shadow-sm' : 'text-wood-650 hover:text-wood-950 hover:bg-gray-50'}`}
              >
                {showUncertainty ? 'Uncertainty Active' : 'Uncertainty Hidden'}
              </button>
            </div>
          </div>
        ) : mode === 'blitz-gap' && selectedCaseStudyId === 'general' && onTaxonGroupChange ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-650 font-sans">Group:</span>
            <select
              value={activeTaxonGroup}
              onChange={(e) => onTaxonGroupChange(e.target.value)}
              className="bg-white border border-sage-200 hover:border-sage-300 text-wood-950 text-xs px-2.5 py-1.5 rounded-lg font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-sage-500"
            >
              {['All', 'Fungi', 'Plants', 'Insects', 'Birds', 'Mammals', 'Amphibians', 'Reptiles'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div />
        )}
        
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
      <div 
        className={`relative flex-1 min-h-[600px] select-none overflow-hidden transition-colors duration-300 ${
          mapType === 'satellite' ? 'bg-[#0b171c]' : 'bg-[#eef4f0]'
        }`} 
        ref={mapContainerRef} 
        onMouseMove={handleMouseMove}
      >
        {/* Live MapLibre viewport rendering interactive tiles */}
        <div ref={mapDivRef} className="absolute inset-0 w-full h-full z-0" style={{ width: '100%', height: '100%' }} />

        {/* Dynamic high-contrast canvas overlays aligned to unprojected GIS points */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* GridCells representing data overlays */}
          <div className="absolute inset-0">
            {mode === 'useful-layers' ? (
              selectedLayerIds.map((layerId) => {
                const layerOpacityPercent = layerOpacities[layerId] !== undefined ? layerOpacities[layerId] : opacity;
                return (
                  <div 
                    key={layerId} 
                    style={{ opacity: layerOpacityPercent / 100 }} 
                    className="absolute inset-0 pointer-events-none"
                  >
                    {projectedCells.map((pCell, idx) => {
                      const colorClass = getCellColorForLayer(pCell.original, layerId);
                      if (colorClass === 'hidden') return null;
                      return (
                        <div
                          key={`${layerId}-${idx}`}
                          className={`absolute w-7 h-7 rounded-md transition-all duration-350 flex items-center justify-center ${colorClass}`}
                          style={{
                            left: `${pCell.x}px`,
                            top: `${pCell.y}px`,
                            transform: `translate(-50%, -50%)`,
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })
            ) : (
              projectedCells.map((pCell, idx) => {
                const cell = pCell.original;
                return (
                  <div
                    key={idx}
                    className={`absolute w-7 h-7 rounded-md transition-all duration-300 flex items-center justify-center ${getCellColor(cell)}`}
                    style={{
                      left: `${pCell.x}px`,
                      top: `${pCell.y}px`,
                      transform: `translate(-50%, -50%)`,
                    }}
                  >
                    {/* Specific features markings */}
                    {mode === 'blitz-gap' && cell.gap && (
                      <div className="w-2 h-2 rounded-full bg-red-600 animate-ping absolute" />
                    )}
                    {mode === 'blitz-gap' && selectedCaseStudyId === 'bc-parks' && cell.park && (
                      <Shield className="w-3 h-3 text-emerald-990" />
                    )}
                    {mode === 'sdm-explorer' && cell.val > 75 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-sage-200" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Compass Rose illustration */}
          <div className="absolute bottom-6 right-6 flex flex-col items-center gap-1 opacity-80 text-wood-950 pointer-events-none">
            <div className="relative w-12 h-12 rounded-full border border-wood-500/50 flex items-center justify-center bg-white/70 backdrop-blur-xs shadow-sm">
              <Compass className="w-8 h-8 text-wood-800 transition-transform duration-100" style={{ transform: `rotate(${rotation}deg)` }} />
              <span className="absolute -top-3.5 text-[9px] font-mono font-bold text-wood-950">N</span>
              <span className="absolute -bottom-3.5 text-[9px] font-mono font-bold text-gray-500">S</span>
              <span className="absolute -left-3.5 text-[9px] font-mono font-bold text-gray-500">W</span>
              <span className="absolute -right-3.5 text-[9px] font-mono font-bold text-gray-500">E</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Overlay Telemetry Info Footer - Legends removed as requested */}
      <div className="bg-wood-50 border-t border-sage-100 p-4 font-sans text-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-wood-650 font-semibold font-sans">
            Observation Grid Overlays Enabled
          </div>
 
          <div className="flex flex-wrap items-center gap-3.5 text-[11px] font-mono text-gray-500">
            <div className="bg-white/80 border border-gray-200 rounded-lg px-2.5 py-1 text-xs">
              {hoveredCoords ? (
                <span>Cell Probe: <span className="text-wood-950 font-semibold">{hoveredCoords.lat}, {hoveredCoords.lng}</span> &bull; <span className="text-sage-600 font-bold">{hoveredCoords.value}</span></span>
              ) : (
                <span className="text-gray-400">Cell Probe: Hover over map</span>
              )}
            </div>
            <div className="flex items-center gap-2.5 border-l border-gray-200/60 pl-3">
              <span>Proj: WGS-84</span>
              <span>Res: ~1km Pixel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}