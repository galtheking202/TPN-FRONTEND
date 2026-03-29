import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Polygon, Region } from 'react-native-maps';
import { Article } from '@tpn/shared';

const COLORS = {
  bg: '#0A0A0F',
  surface: '#111118',
  border: '#1E1E2A',
  primary: '#0057FF',
  primaryFill: 'rgba(0,87,255,0.25)',
  unselectedFill: 'rgba(168,168,192,0.08)',
  unselectedStroke: 'rgba(168,168,192,0.3)',
  text: '#FFFFFF',
  textMuted: '#505070',
};

interface RegionData {
  name: string;
  coordinates: { latitude: number; longitude: number }[];
  center: { latitude: number; longitude: number };
}

interface Props {
  articles: Article[];
  selected: string[];
  onToggle: (region: string) => void;
  multiSelect?: boolean;
}

function geoJsonToCoords(geometry: { type: string; coordinates: any[] }) {
  try {
    // Handle Polygon and MultiPolygon
    const rings = geometry.type === 'MultiPolygon' ? geometry.coordinates[0] : geometry.coordinates;
    const ring = rings[0];
    return (ring as number[][]).map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
  } catch {
    return [];
  }
}

function centerOfCoords(coords: { latitude: number; longitude: number }[]) {
  if (!coords.length) return { latitude: 31.5, longitude: 35.0 };
  const lat = coords.reduce((s, c) => s + c.latitude, 0) / coords.length;
  const lng = coords.reduce((s, c) => s + c.longitude, 0) / coords.length;
  return { latitude: lat, longitude: lng };
}

export default function MapFilter({ articles, selected, onToggle, multiSelect = true }: Props) {
  const mapRef = useRef<MapView>(null);

  const regions = useMemo<RegionData[]>(() => {
    const seen = new Set<string>();
    const result: RegionData[] = [];
    for (const article of articles) {
      if (!article.region || seen.has(article.region)) continue;
      seen.add(article.region);
      if (article.area_exterior) {
        const coordinates = geoJsonToCoords(article.area_exterior);
        if (coordinates.length > 2) {
          result.push({ name: article.region, coordinates, center: centerOfCoords(coordinates) });
        }
      }
    }
    return result;
  }, [articles]);

  // Plain-text regions (no GeoJSON)
  const textRegions = useMemo(() => {
    const withGeo = new Set(regions.map(r => r.name));
    const seen = new Set<string>();
    const result: string[] = [];
    for (const a of articles) {
      if (a.region && !withGeo.has(a.region) && !seen.has(a.region)) {
        seen.add(a.region);
        result.push(a.region);
      }
    }
    return result;
  }, [articles, regions]);

  // Fit map to all region polygons on load
  useEffect(() => {
    if (!regions.length || !mapRef.current) return;
    const allCoords = regions.flatMap(r => r.coordinates);
    if (allCoords.length) {
      setTimeout(() => mapRef.current?.fitToCoordinates(allCoords, { edgePadding: { top: 20, right: 20, bottom: 20, left: 20 }, animated: true }), 400);
    }
  }, [regions]);

  const initialRegion: Region = {
    latitude: 31.5, longitude: 35.0,
    latitudeDelta: 8, longitudeDelta: 8,
  };

  return (
    <View style={styles.container}>
      {regions.length > 0 && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          mapType="mutedStandard"
        >
          {regions.map(r => {
            const isSelected = selected.includes(r.name);
            return (
              <Polygon
                key={r.name}
                coordinates={r.coordinates}
                fillColor={isSelected ? COLORS.primaryFill : COLORS.unselectedFill}
                strokeColor={isSelected ? COLORS.primary : COLORS.unselectedStroke}
                strokeWidth={isSelected ? 2 : 1}
                tappable
                onPress={() => onToggle(r.name)}
              />
            );
          })}
        </MapView>
      )}

      {/* Chip list for all regions (with and without GeoJSON) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
        {[...regions.map(r => r.name), ...textRegions].map(name => {
          const active = selected.includes(name);
          return (
            <Pressable
              key={name}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onToggle(name)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {active ? '✓ ' : ''}{name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  map: { height: 220, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  chips: { maxHeight: 44 },
  chipsContent: { gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: 'transparent' },
  chipActive: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
  chipText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '500' },
  chipTextActive: { color: COLORS.primary, fontWeight: '600' },
});
