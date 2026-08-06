import React, { useState, useEffect, useRef } from 'react';
import { Globe, Map as MapIcon, Layers, Eye, Shield, Compass, Navigation, RefreshCw, ZoomIn, ZoomOut, Maximize2, Minimize2, X } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Helper to provide compliant styles reactively based on selected Map type
const getMapStyle = (type: 'topo' | 'satellite' | 'terrain') => {
  const dpr = typeof window !== 'undefined' && window.devicePixelRatio >= 2 ? '@2x' : '';
  let tilesUrls: string[] = [];
  let attribution = '© <a href="https://carto.com/attributions">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  if (type === 'satellite') {
    // Esri raster tile servers distributed to ensure redundancy and avoid rate limits
    tilesUrls = [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    ];
    attribution = '© Esri — Source: Esri, USDA, USGS, and the GIS User Community';
  } else if (type === 'terrain') {
    // OpenTopoMap with active subdomains for faster tile loading and robust access
    tilesUrls = [
      'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
      'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
      'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    ];
    attribution = '© <a href="https://opentopomap.org">OpenTopoMap</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  } else {
    // Topo style (CARTO Voyager with multiple subdomains and standard openstreetmap as direct backup)
    tilesUrls = [
      `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}${dpr}.png`,
      `https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}${dpr}.png`,
      `https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}${dpr}.png`,
      `https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}${dpr}.png`,
      `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
    ];
  }

  return {
    version: 8 as const,
    sources: {
      'raster-tiles': {
        type: 'raster' as const,
        tiles: tilesUrls,
        tileSize: 256,
        attribution
      }
    },
    layers: [
      {
        id: 'bg-color',
        type: 'background' as const,
        paint: {
          'background-color': type === 'satellite' ? '#0b171c' : '#eef4f0'
        }
      },
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

function isPointInCanada(lat: number, lng: number): boolean {
  // Broad bounding box of Canada
  if (lng < -141.0 || lng > -52.6) return false;
  if (lat < 41.6 || lat > 83.2) return false;

  // West of the Great Lakes (approx -123 to -95 W): the border is at lat 49 N
  if (lng >= -123 && lng <= -95 && lat < 49.0) return false;

  // Between -95 and -89 W (Minnesota, Ontario border): border is around 48 N
  if (lng > -95 && lng <= -89 && lat < 48.0) return false;

  // Between -89 and -83 W (Michigan, Huron border): border is around 46 N
  if (lng > -89 && lng <= -83 && lat < 46.0) return false;

  // Between -83 and -75 W (Ontario/NY border): border is around 42-45 N
  if (lng > -83 && lng <= -75) {
    if (lng <= -80 && lat < 42.0) return false;
    if (lng > -80 && lat < 43.5) return false;
  }

  // Between -75 and -67 W (Quebec/Maine border): border goes up to 47.4 N
  if (lng > -75 && lng <= -67) {
    if (lng <= -71.5 && lat < 45.0) return false;
    // Maine border peaks at about 47.46 N at about -69 W
    if (lng > -71.5 && lng <= -68 && lat < 47.2) return false;
    if (lng > -68 && lat < 45.5) return false;
  }

  // New Brunswick/Nova Scotia:
  if (lng > -67 && lat < 43.0) return false;

  return true;
}

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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Esc key down listener to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Handle map resize on fullscreen transition
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.resize();
      }, 100);
    }
  }, [isFullscreen]);
  
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [projectedCells, setProjectedCells] = useState<Array<{ x: number; y: number; original: any }>>([]);
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 800, height: 600 });

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

    let attempts = 0;
    while (cells.length < 40 && attempts < 150) {
      const rVal = seedRandom(`${seed}-${attempts}`);
      // restrict to a broad Canada boundary shape
      const x = 15 + (rVal * 70); // 15% to 85% width
      const y = 20 + (seedRandom(`y-${seed}-${attempts}`) * 55); // 20% to 75% height

      const lng = -140 + (x / 100) * 85;
      const lat = 83 - (y / 100) * 38;

      attempts++;

      if (isPointInCanada(lat, lng)) {
        cells.push({
          x,
          y,
          val: Math.floor(rVal * 100),
          kba: selectedCaseStudyId === 'kbas' && rVal > 0.5,
          park: selectedCaseStudyId === 'bc-parks' && rVal > 0.4 && x < 40,
          gap: rVal > 0.75 // Data Gap (Red highlighted)
        });
      }
    }
    setGridCells(cells);
  }, [mode, selectedLayerId, selectedSdmId, activeTaxonGroup, selectedCaseStudyId]);

  const updateCellProjections = (mapInstance: maplibregl.Map | null) => {
    if (mapInstance && mapLoaded) {
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
        return;
      } catch (e) {
        // Fall through to exact percentage calculation
      }
    }

    // High fidelity percentage-based vector fall back calculation
    const projected = gridCells.map(cell => {
      const xPx = (cell.x / 100) * containerSize.width;
      const yPx = (cell.y / 100) * containerSize.height;
      return {
        x: xPx,
        y: yPx,
        original: cell
      };
    });
    setProjectedCells(projected);
  };

  // Synchronize projected cells when elements change
  useEffect(() => {
    updateCellProjections(mapRef.current);
  }, [gridCells, containerSize, mapLoaded, webGlSupported]);

  // Handle map initialization and events
  useEffect(() => {
    if (!mapDivRef.current) return;

    // Direct WebGL check to prevent catastrophic iframe load failures in browser sandbox environments
    let isSupported = false;
    try {
      const canvas = document.createElement('canvas');
      isSupported = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      isSupported = false;
    }
    setWebGlSupported(isSupported);

    if (!isSupported) {
      console.warn("WebGL not detected or restricted in this browser context. Launching Vector Map fallback mode.");
      return;
    }

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: mapDivRef.current,
        style: getMapStyle(mapType),
        center: [-98, 60], // Centered beautifully over Canada
        zoom: 3.2,
        maxZoom: 14,
        minZoom: 2.5,
        maxBounds: [[-145, 41.0], [-50, 83.5]], // strictly restrict viewport to Canada and avoid showing/panning to US points
        bearing: 0,
        pitch: 0,
        dragRotate: false, // keep it aligned but allow zoom & pan
      });
      mapRef.current = map;
    } catch (err) {
      console.error("MapLibre GL failed to initialize:", err);
      setWebGlSupported(false);
      return;
    }

    const onMapEvent = () => {
      updateCellProjections(map);
      setZoom(map.getZoom());
      setRotation(map.getBearing());
    };

    map.on('load', () => {
      setMapLoaded(true);
      map.resize();
      onMapEvent();
    });
    map.on('move', onMapEvent);
    map.on('zoom', onMapEvent);
    map.on('resize', onMapEvent);

    // Dynamic ResizeObserver ensures precise canvas scaling and prevents blank viewports during container expands/tabs transitions
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width: width || 800, height: height || 600 });
      }
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    
    if (mapDivRef.current) {
      resizeObserver.observe(mapDivRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (map) {
        map.remove();
      }
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Set style when mapType changes (safeguarded on mapLoaded to prevent race condition)
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      try {
        mapRef.current.setStyle(getMapStyle(mapType));
      } catch (err) {
        console.warn("Could not set dynamic style:", err);
      }
    }
  }, [mapType, mapLoaded]);

  const handleZoomIn = () => {
    if (mapRef.current && mapLoaded) {
      mapRef.current.zoomIn();
    } else {
      setZoom(prev => Math.min(prev + 0.5, 10));
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current && mapLoaded) {
      mapRef.current.zoomOut();
    } else {
      setZoom(prev => Math.max(prev - 0.5, 1.5));
    }
  };

  const handleResetView = () => {
    if (mapRef.current && mapLoaded) {
      mapRef.current.easeTo({
        center: [-98, 60],
        zoom: 3.2,
        bearing: 0,
        pitch: 0,
        duration: 800
      });
    } else {
      setZoom(3.2);
      setRotation(0);
    }
  };

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
    const isCanada = isPointInCanada(pLat, pLng);

    if (isCanada) {
      if (mode === 'useful-layers') {
        simulatedValue = `${(Math.sin((x + y) * 0.05) * 50 + 50).toFixed(1)} index score`;
      } else if (mode === 'sdm-explorer') {
        const probability = (Math.sin(x * 0.03) * Math.cos(y * 0.04) * 0.5 + 0.5) * 100;
        simulatedValue = `${biasCorrected ? '(Bias-Corrected) ' : ''}Prob: ${probability.toFixed(0)}%`;
      } else if (mode === 'blitz-gap') {
        const density = Math.floor((Math.sin(x * 0.01) * Math.cos(y * 0.02) * 0.5 + 0.5) * 45);
        simulatedValue = density === 0 ? 'Data Gap Sector (0 records)' : `${density} iNat obs/km²`;
      }
    } else {
      simulatedValue = 'Outside Study Area (No Data)';
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
    <div className={`flex flex-col bg-white overflow-hidden transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' 
        : 'border border-sage-200 rounded-2xl shadow-sm'
    }`}>
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
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 px-1.5 text-wood-600 hover:text-wood-900 hover:bg-gray-50/80 rounded-md transition-all cursor-pointer flex items-center justify-center border-none"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand Map to Fullscreen"}
          >
            {isFullscreen ? (
              <X className="w-4 h-4 text-red-600 font-bold" />
            ) : (
              <Maximize2 className="w-4 h-4 text-sage-600 font-medium" />
            )}
          </button>
          <div className="w-[1px] h-4 bg-gray-200" />
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
        className={`relative flex-1 ${isFullscreen ? 'min-h-0' : 'min-h-[600px]'} select-none overflow-hidden transition-colors duration-300 ${
          mapType === 'satellite' ? 'bg-[#0b171c]' : 'bg-[#eef4f0]'
        }`} 
        ref={mapContainerRef} 
        onMouseMove={handleMouseMove}
      >
        {/* Live MapLibre viewport rendering interactive tiles */}
        <div ref={mapDivRef} className="absolute inset-0 w-full h-full z-0" style={{ width: '100%', height: '100%' }} />

        {/* Dynamic high-contrast aesthetic vector base map of Canada for sandboxed, disabled, or initializing map fallbacks */}
        {(!webGlSupported || !mapLoaded) && (
          <div className="absolute inset-0 w-full h-full z-0 flex items-center justify-center opacity-85 transition-all duration-300 p-8 select-none pointer-events-none">
            <svg viewBox="0 0 800 500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full max-w-5xl max-h-[500px]">
              {/* Grid Lines / Coordinate lines grid to give a great scientific telemetry look */}
              <g stroke="currentColor" className="opacity-10 text-gray-500" strokeWidth="0.5" strokeDasharray="3 3">
                <line x1="100" y1="0" x2="100" y2="500" />
                <line x1="200" y1="0" x2="200" y2="500" />
                <line x1="300" y1="0" x2="300" y2="500" />
                <line x1="400" y1="0" x2="400" y2="500" />
                <line x1="500" y1="0" x2="500" y2="500" />
                <line x1="600" y1="0" x2="600" y2="500" />
                <line x1="700" y1="0" x2="700" y2="500" />
                <line x1="0" y1="100" x2="800" y2="100" />
                <line x1="0" y1="200" x2="800" y2="200" />
                <line x1="0" y1="300" x2="800" y2="300" />
                <line x1="0" y1="400" x2="800" y2="400" />
              </g>
              
              {/* Canada Landmass borders */}
              <path 
                d="M 120 180 L 120 350 L 220 350 L 400 350 L 500 370 L 540 410 L 540 370 L 580 410 L 610 370 L 640 375 L 680 340 L 710 345 L 750 280 L 710 240 L 680 250 L 620 200 L 580 180 L 540 220 L 480 190 L 400 230 L 360 200 L 280 210 Z" 
                className={`${mapType === 'satellite' ? 'fill-sky-950/40 stroke-cyan-500/50' : mapType === 'terrain' ? 'fill-amber-100/30 stroke-amber-700/30' : 'fill-sage-50/50 stroke-sage-500/40'}`} 
                strokeWidth="1.5"
              />
              
              {/* Baffin Island */}
              <path 
                d="M 540 100 L 600 130 L 640 180 L 580 200 L 520 160 Z" 
                className={`${mapType === 'satellite' ? 'fill-sky-950/40 stroke-cyan-500/50' : mapType === 'terrain' ? 'fill-amber-100/30 stroke-amber-700/30' : 'fill-sage-50/50 stroke-sage-500/40'}`} 
                strokeWidth="1.5"
              />
              
              {/* Victoria, Ellesmere & Arctic islands */}
              <circle cx="340" cy="110" r="28" className={`${mapType === 'satellite' ? 'fill-sky-950/20 stroke-cyan-500/30' : mapType === 'terrain' ? 'fill-amber-100/20 stroke-amber-700/25' : 'fill-sage-50/20 stroke-sage-500/20'}`} strokeDasharray="3 3" />
              <circle cx="450" cy="90" r="35" className={`${mapType === 'satellite' ? 'fill-sky-950/20 stroke-cyan-500/30' : mapType === 'terrain' ? 'fill-amber-100/20 stroke-amber-700/25' : 'fill-sage-50/20 stroke-sage-500/20'}`} strokeDasharray="3 3" />
              <circle cx="560" cy="60" r="25" className={`${mapType === 'satellite' ? 'fill-sky-950/20 stroke-cyan-500/30' : mapType === 'terrain' ? 'fill-amber-100/20 stroke-amber-700/25' : 'fill-sage-50/20 stroke-sage-500/20'}`} strokeDasharray="3 3" />

              {/* Newfoundland Island */}
              <path 
                d="M 720 310 L 755 305 L 750 335 L 725 330 Z" 
                className={`${mapType === 'satellite' ? 'fill-sky-950/50 stroke-cyan-400/60' : mapType === 'terrain' ? 'fill-amber-100/40 stroke-amber-700/40' : 'fill-sage-50/60 stroke-sage-500/60'}`} 
              />

              {/* Vancouver Island */}
              <path 
                d="M 115 340 L 135 355 L 125 365 Z" 
                className={`${mapType === 'satellite' ? 'fill-sky-950/50 stroke-cyan-400/60' : mapType === 'terrain' ? 'fill-amber-100/40 stroke-amber-700/40' : 'fill-sage-50/60 stroke-sage-500/60'}`} 
              />

              {/* Major lakes markings (for topological feel) */}
              <path d="M 520 395 C 510 395, 510 405, 520 405" fill="none" className="stroke-cyan-500/40" strokeWidth="1.5" />
              <circle cx="450" cy="365" r="8" fill="none" className="stroke-cyan-500/30" strokeWidth="1" />
              <circle cx="340" cy="315" r="9" fill="none" className="stroke-cyan-500/30" strokeWidth="1" />
              <circle cx="280" cy="275" r="8" fill="none" className="stroke-cyan-500/30" strokeWidth="1" />
            </svg>
          </div>
        )}

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

          {/* Navigation control cluster */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 font-sans pointer-events-auto">
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 rounded-lg bg-white/95 border border-sage-200 shadow-md flex items-center justify-center text-wood-800 hover:text-sage-600 transition-all cursor-pointer hover:bg-gray-50"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 rounded-lg bg-white/95 border border-sage-200 shadow-md flex items-center justify-center text-wood-800 hover:text-sage-600 transition-all cursor-pointer hover:bg-gray-50"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="w-8 h-8 rounded-lg bg-white/95 border border-sage-200 shadow-md flex items-center justify-center text-wood-800 hover:text-sage-600 transition-all cursor-pointer hover:bg-gray-50"
              title="Reset Map View"
            >
              <RefreshCw className="w-4 h-4 animate-spin-hover" />
            </button>
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
            Observation Grid Overlays Enabled {!webGlSupported && " (Aesthetic Vector Sandbox Mode)"}
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
