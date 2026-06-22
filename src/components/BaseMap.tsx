// Embedding base map
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Styles dynamically configured with high-DPI retina tiles for crisp quality and globe projection
const getVoyagerStyle = (isRetina: boolean) => ({
  version: 8 as const,
  projection: { type: 'globe' as const },
  sources: {
    carto: {
      type: 'raster' as const,
      // Request retina high-density @2x tiles on High-DPI screens to remove blurriness/bad quality
      tiles: [
        `https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}${isRetina ? '@2x' : ''}.png`,
        `https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}${isRetina ? '@2x' : ''}.png`,
        `https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}${isRetina ? '@2x' : ''}.png`,
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://carto.com/attributions">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: 'carto-voyager', type: 'raster' as const, source: 'carto' }],
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

export default function BaseMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [bearing, setBearing] = useState(0);

  useEffect(() => {
    // Detect retina high-DPI screen for HD tiles
    const isRetina = typeof window !== 'undefined' && window.devicePixelRatio >= 2;

    const map = new maplibregl.Map({
      container: mapContainer.current!,
      // Initial style with globe projection support
      style: isSatellite ? getSatelliteStyle() : getVoyagerStyle(isRetina),
      center: [-98, 56],
      zoom: 3.2, // Zoom level zoomed to Canada's scale on globe
      projection: { type: 'globe' },
    } as any);

    mapRef.current = map;

    map.on('rotate', () => {
      setBearing(map.getBearing());
    });

    // Ensure map container renders strictly at correct quality and prevents pixelation
    map.on('load', () => {
      map.resize();
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

  // Swap style source when satellite toggle changes, maintaining the globe projection explicitly
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const isRetina = typeof window !== 'undefined' && window.devicePixelRatio >= 2;
    map.setStyle(isSatellite ? getSatelliteStyle() : getVoyagerStyle(isRetina));
    
    // Explicitly enforce map projection as globe on style loads
    const onStyleLoad = () => {
      map.setProjection({ type: 'globe' });
    };
    
    map.once('style.load', onStyleLoad);
  }, [isSatellite]);

  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 300 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 300 });
  const handleResetNorth = () =>
    mapRef.current?.rotateTo(0, { duration: 500, easing: (t) => t });

  // North arrow needle rotates opposite to map bearing so it always points north
  const arrowRotation = -bearing;

  // Seamless dark background transition for globe orbit view
  const bgStyleColor = isSatellite ? '#0b0c16' : '#eef4f0';

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }} className="rounded-2xl overflow-hidden border border-gray-150 shadow-sm">
      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '100%', 
          backgroundColor: bgStyleColor, 
          transition: 'background-color 0.4s ease' 
        }} 
      />

      {/* ── North arrow (Placed in the bottom left, above zoom controls) ── */}
      <button
        onClick={handleResetNorth}
        title="Reset north"
        aria-label="Reset north"
        style={styles.northArrow}
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 32 32"
          style={{
            transform: `rotate(${arrowRotation}deg)`,
            transition: 'transform 0.15s ease',
            display: 'block',
          }}
        >
          {/* North half — dark */}
          <path d="M16 4 L19.5 16 L16 14 L12.5 16 Z" fill="#222" />
          {/* South half — light */}
          <path d="M16 28 L19.5 16 L16 14 L12.5 16 Z" fill="#bbb" />
          {/* Centre dot */}
          <circle cx="16" cy="16" r="2" fill="#555" />
          {/* 'N' label */}
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
      <div style={styles.controlGroup}>
        <button
          onClick={handleZoomIn}
          style={styles.controlBtn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          style={{ ...styles.controlBtn, borderTop: '1px solid #e2e8f0' }}
          title="Zoom out"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* ── Satellite toggle (Placed in the top right) ── */}
      <button
        onClick={() => setIsSatellite((s) => !s)}
        style={{
          ...styles.toggleBtn,
          background: isSatellite ? '#1e293b' : '#ffffff',
          color: isSatellite ? '#f8fafc' : '#1e293b',
        }}
        title={isSatellite ? 'Switch to map view' : 'Switch to satellite view'}
      >
        {isSatellite ? '🗺 Map' : '🛰 Satellite'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  controlGroup: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 10,
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0,0,0,0.08)',
  },
  controlBtn: {
    width: 36,
    height: 36,
    background: '#ffffff',
    border: 'none',
    fontSize: 20,
    fontWeight: 500,
    lineHeight: '1',
    cursor: 'pointer',
    color: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    transition: 'background-color 0.15s, color 0.15s',
  },
  northArrow: {
    position: 'absolute',
    bottom: 92,
    left: 12,
    width: 36,
    height: 36,
    background: '#ffffff',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: '50%',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    zIndex: 10,
    transition: 'background-color 0.15s',
  },
  toggleBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: '8px 14px',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    fontSize: 13,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    letterSpacing: '0.01em',
    zIndex: 10,
  },
};
