import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Info, MapPin, Radio, Shield } from 'lucide-react';

export default function HopMap({ hops = [], title = "Email Transit Route & Relay Geolocation Telemetry" }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Extract hops that have valid coordinates
  const validHops = hops
    .filter((h) => h.geo && typeof h.geo.lat === 'number' && typeof h.geo.lon === 'number')
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center if no hops
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

    // Dark-themed tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    if (validHops.length > 0) {
      const latlngs = [];

      validHops.forEach((h, index) => {
        const isOrigin = index === 0;
        const isFinal = index === validHops.length - 1;
        const markerColor = isOrigin ? '#f43f5e' : isFinal ? '#10b981' : '#a855f7';

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
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #f1edfa;">
            <div style="font-weight: 700; color: #a855f7; margin-bottom: 4px;">
              Hop #${h.order || index + 1}: ${isOrigin ? '(Initial Origin IP)' : isFinal ? '(Final MX Relay)' : '(Transit Relay)'}
            </div>
            <div><strong>IP:</strong> <span style="font-family: monospace; color: #c4b5fd;">${h.ip}</span></div>
            <div><strong>Location:</strong> ${h.geo.city || 'Unknown'}, ${h.geo.country || 'Unknown'}</div>
            <div><strong>Network:</strong> ${h.geo.org || h.geo.asn || 'Not listed'}</div>
            <div style="color: #94a3b8; font-size: 10px; margin-top: 4px;">Source: ${h.geo.source || 'Intel DB'}</div>
          </div>
        `);
      });

      // Draw connection lines between hops
      if (latlngs.length > 1) {
        L.polyline(latlngs, {
          color: '#a855f7',
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

  return (
    <div className="bg-[#130e23] border border-[#2b204e] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:border-violet-500/40">
      <div className="p-4 border-b border-[#2b204e] bg-[#16112a] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm tracking-wide">{title}</h3>
            <span className="text-[11px] text-violet-300/70 font-mono">
              {validHops.length} mapped {validHops.length === 1 ? 'node' : 'nodes'} plotted in network space
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3.5 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 inline-block"></span>
            <span className="text-slate-300">Earliest Hop</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400/50 inline-block"></span>
            <span className="text-slate-300">Intermediate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 inline-block"></span>
            <span className="text-slate-300">Final MX</span>
          </div>
        </div>
      </div>

      <div className="relative h-64 md:h-80 w-full bg-[#0a0713]">
        <div ref={mapContainerRef} className="h-full w-full" />

        {validHops.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0713]/85 backdrop-blur-[2px] p-4 text-center z-[500] pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-violet-950/60 border border-violet-800/40 flex items-center justify-center mb-2.5">
              <MapPin className="w-6 h-6 text-violet-400/70" />
            </div>
            <p className="text-sm text-slate-300 font-semibold">No Public IP Coordinates Available</p>
            <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
              Internal private RFC-1918 hops (e.g. 10.x, 192.168.x) or unconfigured GeoIP resolution are suppressed from external map plotting.
            </p>
          </div>
        )}
      </div>

      <div className="p-3.5 bg-[#0f0b1c] border-t border-[#2b204e] flex items-start gap-2.5 text-xs text-slate-400">
        <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-violet-300">Forensic Context & Uncertainty Notice: </span>
          Relay geolocation describes the network infrastructure or mail transfer agent (MTA) that routed the packet. It does <strong className="text-rose-300 font-semibold">not</strong> prove the physical location of the sender or attacker (VPNs, Tor exit nodes, cloud relays, and compromised machines are common in adversary infrastructure).
        </div>
      </div>
    </div>
  );
}
