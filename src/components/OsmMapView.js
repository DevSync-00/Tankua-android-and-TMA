import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { OSM_TILE_URL } from '../config/osm';

/**
 * 100% Google-Free OpenStreetMap Component powered by Leaflet, MarkerCluster & react-native-webview.
 * Features automated marker clustering to prevent overlapping pill clutter on the map.
 */
const OsmMapView = ({
  region = { latitude: 9.0320, longitude: 38.7469, latitudeDelta: 0.15, longitudeDelta: 0.15 },
  destinations = [],
  stations = [],
  routeCoordinates = [],
  userLocation = null,
  selectedDestination = null,
  selectedStation = null,
  onMarkerPress,
  onMapPress,
  style,
}) => {
  const webViewRef = useRef(null);

  const getHtmlContent = () => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .leaflet-touch .leaflet-control-attribution { display: none; }
    .leaflet-touch .leaflet-control-zoom { display: none; }
    
    /* Marker Cluster Custom Badges */
    .marker-cluster-small { background-color: rgba(255, 184, 0, 0.35); border-radius: 50%; }
    .marker-cluster-small div { background-color: #FFB800; color: #1A1A2E; font-weight: 800; font-size: 13px; }
    .marker-cluster-medium { background-color: rgba(37, 99, 235, 0.35); border-radius: 50%; }
    .marker-cluster-medium div { background-color: #2563EB; color: #ffffff; font-weight: 800; font-size: 13px; }
    .marker-cluster-large { background-color: rgba(26, 26, 46, 0.35); border-radius: 50%; }
    .marker-cluster-large div { background-color: #1A1A2E; color: #FFB800; font-weight: 800; font-size: 13px; }
    .marker-cluster div { width: 32px; height: 32px; margin-left: 4px; margin-top: 4px; text-align: center; border-radius: 50%; line-height: 32px; box-shadow: 0 4px 10px rgba(0,0,0,0.25); }

    /* Custom Marker Pill Styling */
    .pill-wrapper { display: flex; flex-direction: column; align-items: center; cursor: pointer; }
    .pill-container { display: flex; flex-direction: row; align-items: center; background: #ffffff; padding: 5px 12px; border-radius: 20px; box-shadow: 0 4px 14px rgba(0,0,0,0.18); border: 2px solid #ffffff; transition: all 0.2s ease; }
    .pill-container.selected { background: #1A1A2E; border-color: #FFB800; transform: scale(1.08); color: #ffffff; z-index: 999; }
    .pill-icon { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 6px; font-size: 11px; font-weight: bold; color: white; background: #FFB800; flex-shrink: 0; }
    .pill-text { font-size: 12px; font-weight: 700; color: #1F2937; max-width: 110px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pill-container.selected .pill-text { color: #ffffff; }
    .pill-stem { width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #ffffff; margin-top: -1px; }
    .pill-container.selected + .pill-stem { border-top-color: #FFB800; }

    /* Pulsing User Location Marker */
    .user-pulse-container { position: relative; width: 24px; height: 24px; }
    .user-pulse { position: absolute; width: 24px; height: 24px; background: rgba(37, 99, 235, 0.35); border-radius: 50%; animation: pulse 1.8s infinite ease-out; }
    .user-core { position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; background: #2563EB; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
    @keyframes pulse { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${region.latitude}, ${region.longitude}], 7);
    L.tileLayer('${OSM_TILE_URL}', { maxZoom: 19, tileSize: 256 }).addTo(map);

    // Marker Cluster Group to prevent overlapping marker clutter
    var markersGroup = L.markerClusterGroup({
      maxClusterRadius: 45,
      disableClusteringAtZoom: 14,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true
    });
    map.addLayer(markersGroup);

    var polylineLayer = null;
    var userMarker = null;

    map.on('click', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_PRESS' }));
    });

    function updateData(data) {
      markersGroup.clearLayers();
      if (polylineLayer) map.removeLayer(polylineLayer);
      if (userMarker) map.removeLayer(userMarker);

      // User location
      if (data.userLocation) {
        var userIcon = L.divIcon({
          className: '',
          html: '<div class="user-pulse-container"><div class="user-pulse"></div><div class="user-core"></div></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        userMarker = L.marker([data.userLocation.latitude, data.userLocation.longitude], { icon: userIcon }).addTo(map);
      }

      // Route Polyline
      if (data.routeCoordinates && data.routeCoordinates.length > 0) {
        var latLngs = data.routeCoordinates.map(function(c) { return [c.latitude, c.longitude]; });
        polylineLayer = L.polyline(latLngs, { color: '#2563EB', weight: 6, opacity: 0.9, lineCap: 'round' }).addTo(map);
      }

      // Destinations
      if (data.destinations) {
        data.destinations.forEach(function(dest) {
          var isSel = data.selectedDestinationId === dest.id;
          var htmlStr = '<div class="pill-wrapper"><div class="pill-container ' + (isSel ? 'selected' : '') + '"><div class="pill-icon">📍</div><span class="pill-text">' + (dest.name || '') + '</span></div><div class="pill-stem"></div></div>';
          var customIcon = L.divIcon({
            className: '',
            html: htmlStr,
            iconSize: [120, 36],
            iconAnchor: [60, 36]
          });
          var marker = L.marker([dest.lat, dest.lng], { icon: customIcon });
          marker.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DESTINATION_PRESS', payload: dest }));
          });
          markersGroup.addLayer(marker);

          if (isSel) {
            map.flyTo([dest.lat, dest.lng], 13, { duration: 0.8 });
          }
        });
      }

      // Stations
      if (data.stations) {
        data.stations.forEach(function(stn) {
          var isSel = data.selectedStationId === stn.id;
          var htmlStr = '<div class="pill-wrapper"><div class="pill-container ' + (isSel ? 'selected' : '') + '"><div class="pill-icon" style="background:#2563EB;">🚌</div><span class="pill-text">' + (stn.name || '') + '</span></div><div class="pill-stem"></div></div>';
          var customIcon = L.divIcon({
            className: '',
            html: htmlStr,
            iconSize: [120, 36],
            iconAnchor: [60, 36]
          });
          var marker = L.marker([stn.lat, stn.lng], { icon: customIcon });
          marker.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATION_PRESS', payload: stn }));
          });
          markersGroup.addLayer(marker);

          if (isSel) {
            map.flyTo([stn.lat, stn.lng], 13, { duration: 0.8 });
          }
        });
      }
    }
  </script>
</body>
</html>
  `;

  useEffect(() => {
    if (webViewRef.current) {
      const dataPayload = JSON.stringify({
        destinations,
        stations,
        routeCoordinates,
        userLocation,
        selectedDestinationId: selectedDestination?.id,
        selectedStationId: selectedStation?.id,
      });
      const jsCode = `if (window.updateData) { window.updateData(${dataPayload}); } true;`;
      webViewRef.current.injectJavaScript(jsCode);
    }
  }, [destinations, stations, routeCoordinates, userLocation, selectedDestination, selectedStation]);

  const handleMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'DESTINATION_PRESS' && onMarkerPress) {
        onMarkerPress(msg.payload);
      } else if (msg.type === 'STATION_PRESS' && onMarkerPress) {
        onMarkerPress(msg.payload);
      } else if (msg.type === 'MAP_PRESS' && onMapPress) {
        onMapPress();
      }
    } catch (e) {
      console.error('Error handling webview message:', e);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: getHtmlContent() }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        scrollEnabled={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
});

export default OsmMapView;
