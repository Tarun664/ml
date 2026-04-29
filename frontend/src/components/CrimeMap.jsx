import React, { useEffect, useRef } from 'react';

// Use Leaflet loaded via CDN in index.html
const L = window.L;

// Fix default marker icon paths broken by webpack
function fixLeafletIcons() {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const REGION_CENTERS = {
  india: { center: [20.5937, 78.9629], zoom: 5 },
  uk:    { center: [52.3555, -1.1743], zoom: 6 },
  us:    { center: [39.8283, -98.5795], zoom: 4 }
};

// Change 4: Three-tier B&W colors based on crime count thirds
function markerColor(rank, total) {
  const ratio = rank / total;
  if (ratio <= 0.333) return '#ffffff'; // Top third — white (highest crime)
  if (ratio <= 0.666) return '#888888'; // Middle third — grey
  return '#333333';                      // Bottom third — dark
}

function clusterRadius(count, maxCount) {
  return 8 + (count / maxCount) * 22;
}

export default function CrimeMap({
  region = 'india', clusters, heatmapPoints, selectedCluster, onClusterSelect, loading
}) {
  const mapRef        = useRef(null);
  const mapInstance   = useRef(null);
  const heatLayer     = useRef(null);
  const markersLayer  = useRef(null);
  const markerRefs    = useRef({}); // cluster.id -> L.circleMarker

  // Initialize map once
  useEffect(() => {
    fixLeafletIcons();

    const map = L.map(mapRef.current, {
      center: REGION_CENTERS['india'].center,
      zoom: REGION_CENTERS['india'].zoom,
      zoomControl: true,
      attributionControl: true,
    });

    // Dark CartoDB tile layer (original B&W neo-brutalist look)
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '© OpenStreetMap © CartoDB',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update heatmap layer
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (heatLayer.current) {
      map.removeLayer(heatLayer.current);
      heatLayer.current = null;
    }

    if (heatmapPoints.length > 0 && window.L.heatLayer) {
      heatLayer.current = window.L.heatLayer(heatmapPoints, {
        radius: 22,
        blur: 18,
        maxZoom: 17,
        max: 1.0,
        gradient: {
          0.4: '#333333',
          0.65: '#888888',
          1.0: '#ffffff',
        },
      }).addTo(map);
    }
  }, [heatmapPoints]);

  // Update cluster markers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (markersLayer.current) {
      map.removeLayer(markersLayer.current);
      markersLayer.current = null;
    }
    markerRefs.current = {};

    if (clusters.length === 0) return;

    const group = L.layerGroup();
    const maxCount = clusters[0]?.crime_count || 1;

    clusters.forEach((cluster) => {
      const isSelected = selectedCluster?.id === cluster.id;
      const radius = clusterRadius(cluster.crime_count, maxCount);

      // Change 4: B&W only — no borders (stroke: false)
      const baseColor = markerColor(cluster.rank || 1, clusters.length);

      const markerOptions = isSelected
        ? {
            radius,
            stroke: false,
            fillColor: baseColor === '#ffffff' ? '#000000' : '#ffffff',
            fillOpacity: 1,
          }
        : {
            radius,
            stroke: false,        // Change 4: no border whatsoever
            fillColor: baseColor,
            fillOpacity: 0.85,
          };

      const marker = L.circleMarker([cluster.lat, cluster.lng], markerOptions);

      // Tooltip on hover
      const areaLabel = cluster.area_name ? ` · ${cluster.area_name}` : '';
      marker.bindTooltip(
        `<b>${cluster.top_crime}</b>${areaLabel}<br/>${cluster.crime_count.toLocaleString()} incidents`,
        { direction: 'top', offset: [0, -radius] }
      );

      // Popup — Change 5: show area_name prominently for Bangalore
      const areaTitle = cluster.area_name
        ? `<div style="font-size:18px;font-weight:900;font-family:'Space Mono',monospace;letter-spacing:1px;margin-bottom:2px;color:#111">${cluster.area_name}</div>`
        : '';
      const popupHTML = `
        <div style="font-family:'Space Mono',monospace;font-size:11px;min-width:200px;padding:8px;background:#000;color:#fff;border:2px solid #fff">
          <div style="font-size:9px;color:#666;letter-spacing:2px;font-weight:700;margin-bottom:6px">
            HOTSPOT #${cluster.rank || '--'}
          </div>
          ${areaTitle}
          <div style="font-size:13px;font-weight:700;margin-bottom:10px;color:#aaa">
            ${cluster.top_crime}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            <div style="background:#111;padding:6px;border:1px solid #333">
              <div style="font-size:8px;color:#555;letter-spacing:1px;margin-bottom:2px">INCIDENTS</div>
              <div style="font-size:14px;font-weight:900;color:#fff">${cluster.crime_count?.toLocaleString()}</div>
            </div>
            <div style="background:#111;padding:6px;border:1px solid #333">
              <div style="font-size:8px;color:#555;letter-spacing:1px;margin-bottom:2px">ARRESTS</div>
              <div style="font-size:14px;font-weight:900;color:#fff">${((cluster.arrest_rate || 0) * 100).toFixed(0)}%</div>
            </div>
            <div style="background:#111;padding:6px;border:1px solid #333">
              <div style="font-size:8px;color:#555;letter-spacing:1px;margin-bottom:2px">PEAK HOUR</div>
              <div style="font-size:14px;font-weight:900;color:#fff">${cluster.peak_hour}:00</div>
            </div>
            <div style="background:#111;padding:6px;border:1px solid #333">
              <div style="font-size:8px;color:#555;letter-spacing:1px;margin-bottom:2px">PEAK DAY</div>
              <div style="font-size:14px;font-weight:900;color:#fff">${cluster.peak_day}</div>
            </div>
          </div>
          <div style="margin-top:8px;font-size:9px;color:#555;border-top:1px solid #222;padding-top:6px">
            ${cluster.cities?.join(' · ')}
          </div>
        </div>
      `;

      marker.bindPopup(popupHTML, { maxWidth: 260 });

      marker.on('click', () => onClusterSelect(cluster));

      group.addLayer(marker);
      markerRefs.current[cluster.id] = marker;
    });

    group.addTo(map);
    markersLayer.current = group;
  }, [clusters, selectedCluster, onClusterSelect]);

  // Change 5: flyTo at zoom 13 with auto-popup on moveend
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    if (selectedCluster) {
      // Change 5: zoom 13, neighborhood level
      map.flyTo([selectedCluster.lat, selectedCluster.lng], 13, {
        duration: 1.0,
        easeLinearity: 0.25,
      });
      // Auto-open popup after animation completes
      map.once('moveend', () => {
        const marker = markerRefs.current[selectedCluster.id];
        if (marker) {
          marker.openPopup();
        }
      });
    } else if (region && REGION_CENTERS[region]) {
      map.flyTo(REGION_CENTERS[region].center, REGION_CENTERS[region].zoom, { duration: 1.2 });
    }
  }, [selectedCluster, region]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {loading && (
        <div className="map-loading-overlay">
          <span className="map-loading-text">ANALYZING...</span>
        </div>
      )}

      {/* Change 6: Horizontal legend, top-left */}
      <div className="map-legend-horizontal">
        <div className="legend-item-h">
          <div className="legend-dot-h" style={{ background: '#ffffff' }} />
          <span className="legend-label-h">HIGH</span>
        </div>
        <div className="legend-item-h">
          <div className="legend-dot-h" style={{ background: '#888888' }} />
          <span className="legend-label-h">MEDIUM</span>
        </div>
        <div className="legend-item-h">
          <div className="legend-dot-h" style={{ background: '#333333' }} />
          <span className="legend-label-h">LOW</span>
        </div>
      </div>
    </div>
  );
}
