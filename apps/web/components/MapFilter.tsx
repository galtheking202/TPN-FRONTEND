import React, { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import type { FeatureCollection, Feature, Polygon, MultiPolygon } from 'geojson';
import type { Layer, PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Article } from '../types';

interface MapFilterProps {
  articles: Article[];
  // Single-select mode (default)
  selectedRegion?: string;
  onSelectRegion?: (region: string) => void;
  // Multi-select mode
  multiSelect?: boolean;
  selectedRegions?: string[];
  onSelectRegions?: (regions: string[]) => void;
}

interface RegionData {
  name: string;
  count: number;
  geometry: { type: string; coordinates: any[] };
}

const MapFilter: React.FC<MapFilterProps> = ({
  articles,
  selectedRegion = 'All Regions',
  onSelectRegion,
  multiSelect = false,
  selectedRegions = [],
  onSelectRegions,
}) => {
  const regions = useMemo<RegionData[]>(() => {
    const map = new Map<string, RegionData>();
    for (const article of articles) {
      if (!article.region || !article.area_exterior) continue;
      const existing = map.get(article.region);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(article.region, {
          name: article.region,
          count: 1,
          geometry: article.area_exterior,
        });
      }
    }
    return Array.from(map.values());
  }, [articles]);

  if (regions.length === 0) return null;

  const featureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: regions.map(r => ({
      type: 'Feature' as const,
      properties: { name: r.name, count: r.count },
      geometry: r.geometry as Polygon | MultiPolygon,
    })),
  };

  const isSelected = (name: string) =>
    multiSelect ? selectedRegions.includes(name) : name === selectedRegion;

  const styleFeature = (feature: Feature | undefined): PathOptions => {
    const name = feature?.properties?.name;
    const selected = isSelected(name);
    return {
      color: selected ? '#D4A843' : '#1E1A14',
      weight: selected ? 2.5 : 1,
      fillColor: selected ? '#D4A843' : '#1E1A14',
      fillOpacity: selected ? 0.25 : 0.08,
      opacity: selected ? 1 : 0.4,
    };
  };

  const handleClick = (name: string) => {
    if (multiSelect && onSelectRegions) {
      onSelectRegions(
        selectedRegions.includes(name)
          ? selectedRegions.filter(r => r !== name)
          : [...selectedRegions, name]
      );
    } else if (onSelectRegion) {
      onSelectRegion(selectedRegion === name ? 'All Regions' : name);
    }
  };

  const onEachFeature = (feature: Feature, layer: Layer) => {
    const name = feature.properties?.name as string;
    const count = feature.properties?.count as number;

    (layer as any).bindTooltip(
      `<span style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:0.05em">${name} (${count})</span>`,
      { sticky: true, className: 'map-tooltip' }
    );

    layer.on('click', () => handleClick(name));

    layer.on('mouseover', () => {
      (layer as any).setStyle({ fillOpacity: 0.35, weight: 2 });
    });

    layer.on('mouseout', () => {
      (layer as any).setStyle(styleFeature(feature));
    });
  };

  const mapKey = multiSelect
    ? selectedRegions.join(',') + regions.length
    : `${selectedRegion}-${regions.length}`;

  return (
    <div className="w-full border-b border-[#EDEAE3]" style={{ height: '280px' }}>
      <MapContainer
        center={[31.5, 35]}
        zoom={6}
        style={{ height: '100%', width: '100%', background: '#FAF7F0' }}
        zoomControl={true}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <GeoJSON
          key={mapKey}
          data={featureCollection}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
      <style>{`
        .map-tooltip {
          background: #1E1A14;
          border: none;
          color: #FAF7F0;
          padding: 4px 8px;
          border-radius: 0;
          box-shadow: none;
        }
        .map-tooltip::before { display: none; }
        .leaflet-container { font-family: inherit; }
      `}</style>
    </div>
  );
};

export default MapFilter;
