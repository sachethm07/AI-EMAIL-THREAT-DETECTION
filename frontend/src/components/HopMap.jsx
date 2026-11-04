import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Info, MapPin } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function HopMap({ hops = [], title = "Email Transit Route & Relay Geolocation Telemetry" }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const currentTileLayersRef = useRef([]);
  const { isDark } = useTheme();
  const [mapStyle, setMapStyle] = useState(isDark ? 'dark' : 'osm');

  // Synchronize default map layer with theme mode
  useEffect(() => {
    setMapStyle(isDark ? 'dark' : 'osm');
  }, [isDark]);

  // Extract hops that have valid coordinates
  const validHops = hops
    .filter((h) => h.geo && typeof h.geo.lat === 'number' && typeof h.geo.lon === 'number')
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Helper to create tile layers for a given style (all key-free, zero watermarks)
  const createTileLayers = (style) => {
    switch (style) {
      case 'osm':
        return [
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
            subdomains: ['a', 'b', 'c'],
            maxZoom: 19,
          }),
        ];
      case 'satellite':
        return [
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a>, Maxar, Earthstar',
            maxZoom: 17,
          }),
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            attribution: '',
            maxZoom: 17,
          }),
        ];
      case 'dark':
      default:
        return [
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a>, HERE, Garmin',
            maxZoom: 16,
          }),
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
            attribution: '',
            maxZoom: 16,
          }),
        ];
    }
  };

  // Initialize map and hop markers
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultCenter = [25.0, 10.0];
    const defaultZoom = 2;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      minZoom: 1,
      maxZoom: 14,
      scrollWheelZoom: false,
    });
    mapInstanceRef.current = map;

    // Attach initial tile layers
    const layers = createTileLayers(mapStyle);
    layers.forEach((layer) => layer.addTo(map));
    currentTileLayersRef.current = layers;

    if (validHops.length > 0) {
      const latlngs = [];

      validHops.forEach((h, index) => {
        const isOrigin = index === 0;
        const isFinal = index === validHops.length - 1;
        const markerColor = isOrigin ? '#f43f5e' : isFinal ? '#10b981' : '#8b5cf6';

        const customIcon = L.divIcon({
          className: 'custom-pin',
          html: `
            <div style="
              background-color: ${markerColor};
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 2px solid #ffffff;
              box-shadow: 0 0 12px ${markerColor};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: bold;
              color: #ffffff;
              font-family: monospace;
            ">
              ${h.order || index + 1}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const latlng = [h.geo.lat, h.geo.lon];
        latlngs.push(latlng);

        const marker = L.marker(latlng, { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: inherit;">
            <div style="font-weight: 700; color: #8b5cf6; margin-bottom: 4px;">
              Hop #${h.order || index + 1}: ${isOrigin ? '(Initial Origin IP)' : isFinal ? '(Final MX Relay)' : '(Transit Relay)'}
            </div>
            <div><strong>IP:</strong> <span style="font-family: monospace; font-weight: 600;">${h.ip}</span></div>
            <div><strong>Location:</strong> ${h.geo.city || 'Unknown'}, ${h.geo.country || 'Unknown'}</div>
            <div><strong>Network:</strong> ${h.geo.org || h.geo.asn || 'Not listed'}</div>
            <div style="opacity: 0.75; font-size: 10px; margin-top: 4px;">Source: ${h.geo.source || 'Intel DB'}</div>
          </div>
        `);
      });

      // Draw connection lines between hops
      if (latlngs.length > 1) {
        L.polyline(latlngs, {
          color: '#8b5cf6',
          weight: 2.5,
          dashArray: '5, 5',
          opacity: 0.85,
        }).addTo(map);
      }

      // Fit bounds to show all markers
      try {
        const bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
      } catch (e) {
        // Fallback
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hops]);

  // Handle live basemap style changes without tearing down pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayersRef.current && currentTileLayersRef.current.length > 0) {
      currentTileLayersRef.current.forEach((layer) => {
        try {
          map.removeLayer(layer);
        } catch (e) {
          // ignore
        }
      });
    }

    const newLayers = createTileLayers(mapStyle);
    newLayers.forEach((layer) => {
      layer.addTo(map);
      if (layer.bringToBack) {
        layer.bringToBack();
      }
    });
    currentTileLayersRef.current = newLayers;
  }, [mapStyle]);

  return (
    <div className="bg-white dark:bg-[#130e23] border border-slate-200 dark:border-[#2b204e] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:border-violet-500/40">
      <div className="p-4 border-b border-slate-200 dark:border-[#2b204e] bg-slate-50 dark:bg-[#16112a] flex items-center justify-between flex-wrap gap-3 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm tracking-wide">{title}</h3>
            <span className="text-[11px] text-violet-600 dark:text-violet-300/70 font-mono">
              {validHops.length} mapped {validHops.length === 1 ? 'node' : 'nodes'} plotted in network space
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Map Layer Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-[#0a0713] p-1 rounded-lg border border-slate-300 dark:border-[#2b204e] transition-colors">
            <button
              type="button"
              onClick={() => setMapStyle('dark')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                mapStyle === 'dark'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Dark Cyber SOC Canvas (Key-free)"
            >
              Dark SOC
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('osm')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                mapStyle === 'osm'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="OpenStreetMap Open-Source Basemap (Key-free)"
            >
              OpenStreetMap
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                mapStyle === 'satellite'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Satellite Imagery (Key-free)"
            >
              Satellite
            </button>
          </div>

          {/* Hop Legend */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 inline-block"></span>
              <span className="text-slate-700 dark:text-slate-300">Earliest Hop</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 dark:bg-violet-400 shadow-sm shadow-violet-400/50 inline-block"></span>
              <span className="text-slate-700 dark:text-slate-300">Intermediate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 inline-block"></span>
              <span className="text-slate-700 dark:text-slate-300">Final MX</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-64 md:h-80 w-full bg-slate-100 dark:bg-[#0a0713] transition-colors">
        <div ref={mapContainerRef} className="h-full w-full" />

        {validHops.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 dark:bg-[#0a0713]/85 backdrop-blur-[2px] p-4 text-center z-[500] pointer-events-none transition-colors">
            <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/40 flex items-center justify-center mb-2.5">
              <MapPin className="w-6 h-6 text-violet-600 dark:text-violet-400/70" />
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-300 font-semibold">No Public IP Coordinates Available</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
              Internal private RFC-1918 hops (e.g. 10.x, 192.168.x) or unconfigured GeoIP resolution are suppressed from external map plotting.
            </p>
          </div>
        )}
      </div>

      <div className="p-3.5 bg-slate-50 dark:bg-[#0f0b1c] border-t border-slate-200 dark:border-[#2b204e] flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 transition-colors">
        <Info className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-violet-700 dark:text-violet-300">Forensic Context & Uncertainty Notice: </span>
          Relay geolocation describes the network infrastructure or mail transfer agent (MTA) that routed the packet. It does <strong className="text-rose-600 dark:text-rose-300 font-semibold">not</strong> prove the physical location of the sender or attacker (VPNs, Tor exit nodes, cloud relays, and compromised machines are common in adversary infrastructure).
        </div>
      </div>
    </div>
  );
}
