// Embedding base map with dynamic dual-resolution iNaturalist density layers
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Sliders, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  RefreshCw, 
  Info,
  ChevronDown,
  ChevronLeft,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';

// Styles dynamically configured with high-DPI retina tiles for crisp quality and globe projection
const getGreyStyle = (isRetina: boolean) => ({
  version: 8 as const,
  projection: { type: 'globe' as const },
  sources: {
    carto: {
      type: 'raster' as const,
      // Request retina high-density @2x tiles on High-DPI screens to remove blurriness/bad quality
      tiles: [
        `https://a.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}${isRetina ? '@2x' : ''}.png`,
        `https://b.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}${isRetina ? '@2x' : ''}.png`,
        `https://c.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}${isRetina ? '@2x' : ''}.png`,
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://carto.com/attributions">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    { 
      id: 'carto-grey', 
      type: 'raster' as const, 
      source: 'carto',
      paint: {
        'raster-opacity': 0.85, // Dim base map so the heatmap stands out and glows beautifully
      }
    }
  ],
});

const getSatelliteStyle = () => ({
  version: 8 as const,
  projection: { type: 'globe' as const },
  sources: {
    esri: {
      type: 'raster' as const,
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        'Tiles © <a href="https://www.esri.com/">Esri</a> — Source: Esri, Maxar, Earthstar Geographics',
    },
  },
  layers: [{ id: 'esri-satellite', type: 'raster' as const, source: 'esri' }],
});

// Definition of the 14 iNaturalist density layers provided by the user
const densityLayers = [
  {
    id: 'all',
    name: 'All Species',
    description: 'Overall iNaturalist observation density across all recorded kingdoms in Canada.',
    url1km: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/All_density_inat_dec25_1km.tif',
    url100m: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/All_density_inat_dec25_100m.tif',
    has1km: true,
  },
  {
    id: 'mammalia',
    name: 'Mammals (Mammalia)',
    description: 'Observations of terrestrial and marine mammals across Canada.',
    url1km: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Mammalia_density_inat_dec25_1km.tif',
    url100m: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Mammalia_density_inat_dec25_100m.tif',
    has1km: true,
  },
  {
    id: 'aves',
    name: 'Birds (Aves)',
    description: 'Bird observation density, showing hotspots, flyways, and breeding sites.',
    url1km: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Aves_density_inat_dec25_1km.tif',
    url100m: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Aves_density_inat_dec25_100m.tif',
    has1km: true,
  },
  {
    id: 'reptilia',
    name: 'Reptiles (Reptilia)',
    description: 'Observations of snakes, lizards, and turtles across the country.',
    url1km: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Reptilia_density_inat_dec25_1km.tif',
    url100m: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Reptilia_density_inat_dec25_100m.tif',
    has1km: true,
  },
  {
    id: 'amphibia',
    name: 'Amphibians (Amphibia)',
    description: 'Focal zones for frogs, toads, newts, and salamanders.',
    url1km: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Amphibia_density_inat_dec25_1km.tif',
    url100m: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Amphibia_density_inat_dec25_100m.tif',
    has1km: true,
  },
  {
    id: 'actinopterygii',
    name: 'Ray-finned Fishes',
    description: 'Observations of freshwater and marine ray-finned fish species.',
    url1km: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Actinopterygii_density_inat_dec25_1km.tif',
    url100m: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Actinopterygii_density_inat_dec25_100m.tif',
    has1km: true,
  },
  {
    id: 'insecta',
    name: 'Insects (Insecta)',
    description: 'Observations of butterflies, bees, beetles, and other insect orders.',
    url1km: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Insecta_density_inat_dec25_1km.tif',
    url100m: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Insecta_density_inat_dec25_100m.tif',
    has1km: true,
  },
  {
    id: 'arachnida',
    name: 'Arachnids (Arachnida)',
    description: 'Spiders, ticks, mites, and harvestmen observations.',
    url1km: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Arachnida_density_inat_dec25_1km.tif',
    url100m: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Arachnida_density_inat_dec25_100m.tif',
    has1km: true,
  },
  {
    id: 'mollusca',
    name: 'Molluscs (Mollusca)',
    description: 'Observations of snails, slugs, clams, and other molluscs.',
    url1km: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Mollusca_density_inat_dec25_1km.tif',
    url100m: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Mollusca_density_inat_dec25_100m.tif',
    has1km: true,
  },
  {
    id: 'plantae',
    name: 'Plants (Plantae)',
    description: 'Trees, vascular plants, ferns, and mosses observation density.',
    url1km: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Plantae_density_inat_dec25_1km.tif',
    url100m: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Plantae_density_inat_dec25_100m.tif',
    has1km: true,
  },
  {
    id: 'animalia',
    name: 'All Animals (Animalia)',
    description: 'Hotspots for all zoological observations across Canada.',
    url1km: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Animalia_density_inat_dec25_1km.tif',
    url100m: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Animalia_density_inat_dec25_100m.tif',
    has1km: true,
  },
  {
    id: 'fungi',
    name: 'Fungi',
    description: 'Mushrooms, bracket fungi, lichens, and molds observations.',
    url1km: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Fungi_density_inat_dec25_100m.tif', // Fallback to 100m
    url100m: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Fungi_density_inat_dec25_100m.tif',
    has1km: false,
  },
  {
    id: 'chromista',
    name: 'Chromista',
    description: 'Recorded diatoms, brown algae, and water molds.',
    url1km: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Chromista_density_inat_dec25_100m.tif', // Fallback to 100m
    url100m: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Chromista_density_inat_dec25_100m.tif',
    has1km: false,
  },
  {
    id: 'protozoa',
    name: 'Protozoa',
    description: 'Observations of single-celled eukaryotic amoebae and protozoans.',
    url1km: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Protozoa_density_inat_dec25_100m.tif', // Fallback to 100m
    url100m: 'https://object-arbutus.alliancecan.ca/86e1f3d5df8442d39450533329f621ae:stac/inat_canada_heatmaps/Protozoa_density_inat_dec25_100m.tif',
    has1km: false,
  }
];

// Transition zoom level constant: zoom level at which we switch from 1km density to 100m high-res density
const RESOLUTION_TRANSITION_ZOOM = 7.5;

export default function BaseMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  
  // Base Map configuration states
  const [isSatellite, setIsSatellite] = useState(false);
  const [bearing, setBearing] = useState(0);
  const [zoom, setZoom] = useState(3.2);

  // Density layers configuration states
  const [densityEnabled, setDensityEnabled] = useState(true);
  const [selectedLayerId, setSelectedLayerId] = useState('all');
  const [layerOpacity, setLayerOpacity] = useState(0.75); // Perfect default opacity for clear heatmaps
  const [isExpanded, setIsExpanded] = useState(true); // Collapsible status state for top-left widget
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Esc key down listener
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

  // Initialize and clean up MapLibre GL instance
  useEffect(() => {
    // Detect retina high-DPI screen for HD tiles
    const isRetina = typeof window !== 'undefined' && window.devicePixelRatio >= 2;

    const map = new maplibregl.Map({
      container: mapContainer.current!,
      style: isSatellite ? getSatelliteStyle() : getGreyStyle(isRetina),
      center: [-98, 56],
      zoom: 3.2, // Zoom level zoomed to Canada's scale on globe
      minZoom: 2.5,
      maxBounds: [[-145, 41.0], [-50, 83.5]], // strictly restrict viewport to Canada and avoid showing/panning to US points
      projection: { type: 'globe' },
    } as any);

    mapRef.current = map;

    // Track rotation/bearing and zoom changes
    map.on('rotate', () => {
      setBearing(map.getBearing());
    });

    map.on('zoom', () => {
      setZoom(map.getZoom());
    });

    // Ensure map container renders strictly at correct quality and prevents pixelation
    map.on('load', () => {
      map.resize();
      applyDensityLayers();
    });

    // Re-add custom COG sources and layers upon style updates (to prevent loss during street/satellite switches)
    map.on('style.load', () => {
      map.setProjection({ type: 'globe' });
      applyDensityLayers();
    });

    // Create a ResizeObserver to observe size changes and trigger layout resize so it is never blurry
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });

    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update layers reactively when dependencies change
  useEffect(() => {
    applyDensityLayers();
  }, [selectedLayerId, densityEnabled, layerOpacity, isSatellite]);

  // Handle map style changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const isRetina = typeof window !== 'undefined' && window.devicePixelRatio >= 2;
    map.setStyle(isSatellite ? getSatelliteStyle() : getGreyStyle(isRetina));
  }, [isSatellite]);

  // Method to re-create and paint the Cloud-Optimized GeoTIFF layers
  const applyDensityLayers = () => {
    const map = mapRef.current;
    if (!map) return;

    const source1kmId = 'density-1km-source';
    const source100mId = 'density-100m-source';
    const sourceOverlayId = 'density-overlay-source';
    const layer1kmId = 'density-1km-layer';
    const layer100mId = 'density-100m-layer';
    const layerOverlayId = 'density-overlay-layer';

    // 1. Remove existing layers safely if they exist
    if (map.getLayer(layerOverlayId)) map.removeLayer(layerOverlayId);
    if (map.getLayer(layer1kmId)) map.removeLayer(layer1kmId);
    if (map.getLayer(layer100mId)) map.removeLayer(layer100mId);

    // 2. Remove existing sources safely if they exist
    if (map.getSource(sourceOverlayId)) map.removeSource(sourceOverlayId);
    if (map.getSource(source1kmId)) map.removeSource(source1kmId);
    if (map.getSource(source100mId)) map.removeSource(source100mId);

    // If disabled, just stop here
    if (!densityEnabled) return;

    const activeLayer = densityLayers.find(l => l.id === selectedLayerId);
    if (!activeLayer) return;

    // Use Development Seed's TiTiler instance to serve the Cloud Optimized GeoTIFF on-the-fly
    // We request PNG tiles from TiTiler, mapped through the magma color scheme, rescaled to maximize pop
    // Setting rescale lower bound to 1 treats all 0 values as completely transparent, preventing black squares
    const colormap = 'magma';
    const rescale = '1,100'; // Rescale range to highlight the densities beautifully on-the-fly

    const tilerUrl1km = `https://titiler.xyz/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${encodeURIComponent(activeLayer.url1km)}&colormap_name=${colormap}&rescale=${rescale}&nodata=0`;
    const tilerUrl100m = `https://titiler.xyz/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${encodeURIComponent(activeLayer.url100m)}&colormap_name=${colormap}&rescale=${rescale}&nodata=0`;

    try {
      // 3. Add 1km density layer (Visible up to the transition zoom level)
      map.addSource(source1kmId, {
        type: 'raster',
        tiles: [tilerUrl1km],
        tileSize: 256,
        bounds: [-141.0, 41.67, -52.61, 83.11],
      });

      map.addLayer({
        id: layer1kmId,
        type: 'raster',
        source: source1kmId,
        maxzoom: RESOLUTION_TRANSITION_ZOOM, // Native MapLibre zoom ceiling
        paint: {
          'raster-opacity': layerOpacity,
          'raster-opacity-transition': { duration: 250 },
          'raster-contrast': 0.45,      // Sharpen hotspots to make them stand out
          'raster-saturation': 0.70,    // Intensify colors for a gorgeous vibrant glowing heat map
          'raster-brightness-min': 0.10  // Elevate low density glow to look beautiful over satellite & maps
        }
      });

      // 4. Add 100m density layer (Visible from the transition zoom level up to max zoom)
      map.addSource(source100mId, {
        type: 'raster',
        tiles: [tilerUrl100m],
        tileSize: 256,
        bounds: [-141.0, 41.67, -52.61, 83.11],
      });

      map.addLayer({
        id: layer100mId,
        type: 'raster',
        source: source100mId,
        minzoom: RESOLUTION_TRANSITION_ZOOM, // Native MapLibre zoom floor
        paint: {
          'raster-opacity': layerOpacity,
          'raster-opacity-transition': { duration: 250 },
          'raster-contrast': 0.45,      // Sharpen hotspots to make them stand out
          'raster-saturation': 0.70,    // Intensify colors for a gorgeous vibrant glowing heat map
          'raster-brightness-min': 0.10  // Elevate low density glow to look beautiful over satellite & maps
        }
      });

      // 5. Add Reference Borders and Labels Layer on top of the heatmaps
      const isRetina = typeof window !== 'undefined' && window.devicePixelRatio >= 2;
      const overlayUrl = isSatellite
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
        : `https://a.basemaps.cartocdn.com/rastertiles/light_only_labels/{z}/{x}/{y}${isRetina ? '@2x' : ''}.png`;

      map.addSource(sourceOverlayId, {
        type: 'raster',
        tiles: [overlayUrl],
        tileSize: 256,
      });

      map.addLayer({
        id: layerOverlayId,
        type: 'raster',
        source: sourceOverlayId,
        paint: {
          'raster-opacity': 1.0, // Fully solid and highly visible borders and labels
        }
      });
    } catch (err) {
      console.warn('MapLibre layer addition error (expected during layout transitions):', err);
    }
  };

  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 300 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 300 });
  const handleResetNorth = () =>
    mapRef.current?.rotateTo(0, { duration: 500, easing: (t) => t });

  // North arrow needle rotates opposite to map bearing so it always points north
  const arrowRotation = -bearing;

  // Selected layer description details
  const activeLayerDetails = densityLayers.find(l => l.id === selectedLayerId) || densityLayers[0];

  // Dynamic status indicators for resolution
  const is1kmActive = zoom < RESOLUTION_TRANSITION_ZOOM;
  const resolutionStatusLabel = is1kmActive 
    ? '1km Resolution (Regional Coarse Grid)' 
    : '100m Resolution (High-Precision Detailed Grid)';

  return (
    <div className={`relative w-full overflow-hidden border-none shadow-xl flex flex-col transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-50 rounded-none w-screen h-screen bg-white' 
        : 'h-[550px] rounded-3xl'
    }`}>
      
      {/* ── COLLAPSED OR EXPANDED TOP-LEFT FLOATING CONTROL BOX ── */}
      {isExpanded ? (
        <div className="absolute top-3 left-3 z-20 flex items-center font-sans">
          {/* Dropdown Box */}
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-1.5 pr-2.5 relative flex items-center border-none">
            <div className="relative min-w-[155px]">
              <select
                id="density-layer-selector"
                value={selectedLayerId}
                onChange={(e) => setSelectedLayerId(e.target.value)}
                className="w-full bg-gray-50/70 hover:bg-gray-100 text-wood-950 border-none py-1.5 pl-2.5 pr-7 rounded-lg text-xs font-semibold cursor-pointer focus:outline-none focus:ring-0 outline-none appearance-none transition-colors"
              >
                {densityLayers.map((layer) => (
                  <option key={layer.id} value={layer.id}>
                    {layer.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-2 pointer-events-none" />
            </div>
          </div>
          {/* Separate, smaller round collapse button overlapping slightly */}
          <button 
            onClick={() => setIsExpanded(false)}
            title="Collapse panel"
            aria-label="Collapse panel"
            className="-ml-1.5 z-30 w-5 h-5 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-all border-none focus:outline-none focus:ring-0 outline-none"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          title="Expand panel"
          aria-label="Expand panel"
          className="absolute top-3 left-3 z-20 w-8 h-8 bg-white/95 backdrop-blur-md rounded-lg shadow-xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors border-none focus:outline-none focus:ring-0 outline-none"
        >
          <Layers className="w-4 h-4 text-sage-700" />
        </button>
      )}

      {/* Live Map viewport */}
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ backgroundColor: isSatellite ? '#0b0c16' : '#111215' }} 
      />

      {/* ── North arrow (Placed in the bottom left, above zoom controls) ── */}
      <button
        onClick={handleResetNorth}
        title="Reset North"
        aria-label="Reset North"
        className="absolute bottom-24 left-3 w-9 h-9 bg-white rounded-full shadow-xl cursor-pointer flex items-center justify-center p-0 z-10 hover:bg-gray-50 transition-colors border-none focus:outline-none focus:ring-0 outline-none"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          style={{
            transform: `rotate(${arrowRotation}deg)`,
            transition: 'transform 0.15s ease',
            display: 'block',
          }}
        >
          <path d="M16 4 L19.5 16 L16 14 L12.5 16 Z" fill="#222" />
          <path d="M16 28 L19.5 16 L16 14 L12.5 16 Z" fill="#bbb" />
          <circle cx="16" cy="16" r="2" fill="#555" />
          <text
            x="16"
            y="3"
            textAnchor="middle"
            fontSize="5.5"
            fontFamily="system-ui, sans-serif"
            fontWeight="700"
            fill="#222"
          >
            N
          </text>
        </svg>
      </button>

      {/* ── Zoom controls (Placed in the bottom left) ── */}
      <div className="absolute bottom-3 left-3 flex flex-col rounded-lg overflow-hidden shadow-xl z-10 bg-white border-none">
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 bg-white border-none text-base font-bold cursor-pointer text-slate-700 flex items-center justify-center p-0 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-0 outline-none"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 bg-white border-t border-slate-100 text-base font-bold cursor-pointer text-slate-700 flex items-center justify-center p-0 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-0 outline-none"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* ── Top-right button controls (Satellite & Fullscreen) ── */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="w-8 h-8 rounded-xl bg-white text-slate-800 hover:bg-gray-50 flex items-center justify-center cursor-pointer shadow-xl transition-all border-none focus:outline-none focus:ring-0 outline-none"
          title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand Map to Fullscreen"}
          aria-label={isFullscreen ? "Exit Fullscreen" : "Expand Map to Fullscreen"}
        >
          {isFullscreen ? (
            <X className="w-4 h-4 text-red-600 font-bold" />
          ) : (
            <Maximize2 className="w-4 h-4 text-sage-600 font-medium" />
          )}
        </button>
        <button
          onClick={() => setIsSatellite((s) => !s)}
          className={`py-1.5 px-3 rounded-xl shadow-xl text-[11px] font-semibold cursor-pointer transition-all border-none focus:outline-none focus:ring-0 outline-none ${
            isSatellite 
              ? 'bg-slate-900 text-slate-50 hover:bg-slate-800' 
              : 'bg-white text-slate-800 hover:bg-gray-50'
          }`}
          title={isSatellite ? 'Switch to map view' : 'Switch to satellite view'}
        >
          {isSatellite ? 'Map' : 'Satellite'}
        </button>
      </div>

      {/* ── Compass Rose illustration (bottom right) ── */}
      <div className="absolute bottom-3 right-3 flex flex-col items-center gap-1 opacity-90 text-slate-800 pointer-events-none z-10">
        <div className="relative w-11 h-11 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-md shadow-xl border-none">
          <Compass className="w-7 h-7 text-slate-700 transition-transform duration-100" style={{ transform: `rotate(${bearing}deg)` }} />
          <span className="absolute -top-3 text-[8px] font-mono font-bold text-slate-900">N</span>
          <span className="absolute -bottom-3 text-[8px] font-mono font-bold text-slate-400">S</span>
          <span className="absolute -left-3 text-[8px] font-mono font-bold text-slate-400">W</span>
          <span className="absolute -right-3 text-[8px] font-mono font-bold text-slate-400">E</span>
        </div>
      </div>

      {/* Custom Heatmap colormap legend inside the map footer */}
      {densityEnabled && (
        <div className="absolute bottom-3 left-16 z-10 pointer-events-auto bg-white/95 backdrop-blur-md rounded-lg p-2 flex items-center gap-2.5 font-sans shadow-xl border-none">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-mono font-bold text-gray-500 uppercase">Density Scale</span>
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-gray-400 font-mono">Low</span>
              {/* Visual gradient showing the magma colormap used by TiTiler */}
              <div 
                className="w-24 h-2 rounded" 
                style={{ 
                  background: 'linear-gradient(to right, #000004, #3b0f70, #8c2981, #de4968, #fe9f6d, #fcfdbf)' 
                }} 
              />
              <span className="text-[8px] text-gray-400 font-mono">High</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
