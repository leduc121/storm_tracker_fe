import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Popup,
  useMap,
  Tooltip,
} from 'react-leaflet';
import { type LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useWindyState } from '../contexts/WindyStateContext';
import { useToast } from '../hooks/use-toast';
import { ToastContainer } from './ui/toast';
import { LoadingSpinner } from './ui/loading-spinner';

// Import các component
import StormAnimation from './StormAnimation';
import WindyLayer from './WindyLayer';
import WeatherLayerControl, { type LayerType } from './WeatherLayerControl';
import WeatherLayerControlPanel from './WeatherLayerControlPanel';
import RightSidebar from './RightSidebar';
import WeatherOverlay from './WeatherOverlay';
import WeatherValueTooltip from './WeatherValueTooltip';
import { DEFAULT_ZOOM, VIETNAM_BOUNDS, VIETNAM_CENTER } from '../lib/mapUtils';
import { getCategoryColor, type Storm } from '../lib/stormData';

// Marker CSS for custom styling
const markerCss = `
  .leaflet-marker-icon-green { filter: hue-rotate(80deg) saturate(1.5) brightness(0.8); }
  .leaflet-marker-icon-blue { filter: hue-rotate(170deg) saturate(1.5) brightness(0.8); }
  .leaflet-marker-icon-red { filter: hue-rotate(300deg) saturate(1.5) brightness(0.8); }
`;

// --- COMPONENT TẠO PANE ---
function CreatePredictionPane() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane('customPredictionPane')) {
      map.createPane('customPredictionPane');
    }
    const pane = map.getPane('customPredictionPane');
    if (pane) {
      pane.style.zIndex = '999';
    }
  }, [map]);
  return null;
}

// --- COMPONENT TẠO STORM PANE ---
// Creates dedicated panes for storm visualization layers with proper z-index ordering
function CreateStormPanes() {
  const map = useMap();
  useEffect(() => {
    // Storm track pane - below markers but above base layers
    if (!map.getPane('stormTrackPane')) {
      map.createPane('stormTrackPane');
    }
    const trackPane = map.getPane('stormTrackPane');
    if (trackPane) {
      trackPane.style.zIndex = '450'; // Above overlayPane (400) but below markerPane (600)
    }

    // Storm cone pane - below tracks
    if (!map.getPane('stormConePane')) {
      map.createPane('stormConePane');
    }
    const conePane = map.getPane('stormConePane');
    if (conePane) {
      conePane.style.zIndex = '440'; // Below tracks
    }

    // Storm circle pane - above cone, below marker
    if (!map.getPane('stormCirclePane')) {
      map.createPane('stormCirclePane');
    }
    const circlePane = map.getPane('stormCirclePane');
    if (circlePane) {
      circlePane.style.zIndex = '445'; // Above cone (440), below tracks (450)
    }

    // Storm marker pane - above tracks
    if (!map.getPane('stormMarkerPane')) {
      map.createPane('stormMarkerPane');
    }
    const markerPane = map.getPane('stormMarkerPane');
    if (markerPane) {
      markerPane.style.zIndex = '650'; // Above default markerPane (600)
    }
  }, [map]);
  return null;
}

// --- GIỚI HẠN BẢN ĐỒ ---
function SetMapBounds() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(VIETNAM_BOUNDS);
    map.setMinZoom(5);
    map.setMaxZoom(10);
  }, [map]);
  return null;
}

// --- TỰ ĐỘNG ZOOM ---
function AutoFitBounds({
  bounds,
  onComplete,
}: {
  bounds: LatLngBounds | null;
  onComplete?: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
      onComplete?.();
    }
  }, [bounds, map, onComplete]);
  return null;
}

// --- PROPS ---
interface WeatherMapProps {
  storms: Storm[];
  selectedStorm?: Storm;
  isPlayingAll: boolean;
  customPredictionPath?: [number, number][] | null;
  mapFocusBounds?: LatLngBounds | null;
  onMapFocusComplete?: () => void;
  currentTime?: number;
}

// === COMPONENT CHÍNH ===
export default function WeatherMap({
  storms,
  selectedStorm,
  isPlayingAll,
  customPredictionPath,
  mapFocusBounds,
  onMapFocusComplete,
  currentTime,
}: WeatherMapProps) {
  // Use global state for layer management
  // Requirements: 2.3, 4.8 - State synchronization
  const { state, dispatch, layers: layerActions } = useWindyState();
  const activeLayer = state.layers.activeLayer;
  const layerOpacity = state.layers.overlayOpacity;
  const showWindLayer = state.layers.showWindLayer;
  const isWindyMode = state.layers.windyMode;
  
  const [showTemperatureAnimation, setShowTemperatureAnimation] = useState(false);
  const [hoverValue, setHoverValue] = useState<{
    type: string;
    value: number;
    unit: string;
    position: { x: number; y: number };
  } | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  
  const { toasts, hideToast, info: showInfo } = useToast();

  const stormsToDisplay = selectedStorm ? [selectedStorm] : storms;

  // Keyboard shortcuts for layer toggles
  // Requirements: 10.6
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const layerMap: { [key: string]: LayerType } = {
        '1': 'wind',
        '2': 'temperature',
        '3': 'radar',
        '4': 'satellite',
        '5': 'none', // Toggle all layers off
      };

      if (layerMap[e.key]) {
        e.preventDefault();
        const layer = layerMap[e.key];
        handleLayerChange(layer);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeLayer, showWindLayer]);

  // Thêm CSS cho icon vào <head>
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = markerCss;
    document.head.appendChild(styleElement);
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  const handleLayerChange = (layer: LayerType) => {
    // Use global state actions for layer changes
    // Requirements: 4.8 - Coordinate layer toggles with overlay rendering
    dispatch(layerActions.setActiveLayer(layer));
    
    // Show feedback for layer changes
    if (layer !== 'none') {
      const layerNames: { [key in LayerType]: string } = {
        none: '',
        wind: 'Wind',
        temperature: 'Temperature',
        radar: 'Radar',
        satellite: 'Satellite',
      };
      showInfo(`${layerNames[layer]} layer activated`);
    }
  };

  const handleOpacityChange = (opacity: number) => {
    dispatch(layerActions.setOverlayOpacity(opacity));
  };

  const handleWindyModeChange = (enabled: boolean) => {
    dispatch(layerActions.setWindyMode(enabled));
  };

  return (
    <div className="h-full w-full relative">
      {/* Skip link for keyboard navigation - WCAG 2.1 Level AA */}
      <a 
        href="#main-map"
        className="absolute left-[-9999px] top-0 z-[2000] bg-blue-600 text-white px-4 py-2 rounded shadow-lg focus:left-4 focus:top-4"
      >
        Skip to main map
      </a>

      <MapContainer
        id="main-map"
        center={[VIETNAM_CENTER.lat, VIETNAM_CENTER.lng]}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <SetMapBounds />
        <CreatePredictionPane />
        <CreateStormPanes />
        <AutoFitBounds bounds={mapFocusBounds ?? null} onComplete={onMapFocusComplete} />

        {/* === LAYER MẶC ĐỊNH === */}
        {activeLayer === 'none' && !showWindLayer && (
          <>
            <TileLayer
              attribution="© Google Satellite"
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={1}
            />
            <TileLayer
              attribution="© Google Maps"
              url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={2}
              pane="overlayPane"
            />
          </>
        )}

        {/* === LAYER VỆ TINH === */}
        {activeLayer === 'satellite' && (
          <>
            <TileLayer
              attribution="© ESRI"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={19}
              maxZoom={22}
              zIndex={1}
            />
            <WeatherLayerControl type="satellite" opacity={layerOpacity} />
            <TileLayer
              attribution="© Google Maps"
              url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={100}
              opacity={0.8}
              pane="overlayPane"
            />
          </>
        )}

        {/* === LAYER RADAR === */}
        {activeLayer === 'radar' && (
          <>
            <TileLayer
              attribution="© Google Satellite"
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={1}
            />
            <WeatherLayerControl type="radar" opacity={layerOpacity} />
            <TileLayer
              attribution="© Google Maps"
              url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={100}
              opacity={0.8}
              pane="overlayPane"
            />
          </>
        )}

        {/* === LAYER NHIỆT ĐỘ === */}
        {activeLayer === 'temperature' && (
          <>
            <TileLayer
              attribution="© Google Satellite"
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={1}
            />
            <WeatherOverlay 
              type="temperature" 
              opacity={layerOpacity}
              currentTime={currentTime}
              onHoverValue={setHoverValue}
              onLoadingChange={setIsWeatherLoading}
            />
            <TileLayer
              attribution="© Google Maps"
              url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={100}
              opacity={0.8}
              pane="overlayPane"
            />
          </>
        )}

        {/* === LAYER GIÓ === */}
        {showWindLayer && (
          <>
            <TileLayer
              attribution="© Google Satellite"
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={1}
            />
            <WindyLayer />
            <WeatherOverlay 
              type="wind" 
              opacity={layerOpacity}
              currentTime={currentTime}
              onHoverValue={setHoverValue}
              onLoadingChange={setIsWeatherLoading}
            />
            <TileLayer
              attribution="© Google Maps"
              url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={100}
              opacity={0.8}
              pane="overlayPane"
            />
          </>
        )}

        {/* === STORM VISUALIZATION === */}
        {/* Renders enhanced storm tracks with gradient colors, hurricane markers, and forecast cones */}
        {/* Z-index layering: Cones (440) < Tracks (450) < Markers (650) */}
        {/* Requirements: 2.3, 2.4 - Storm positions update based on timeline */}
        {stormsToDisplay.map((storm, index) => {
          // Gán màu khác nhau cho mỗi cơn bão
          // Màu sắc: Đỏ, Xanh dương, Xanh lá, Cam, Tím, Vàng
          const stormColors = ['#ef4444', '#3b82f6', '#10b981', '#f97316', '#a855f7', '#eab308'];
          const stormColor = stormColors[index % stormColors.length];
          
          return (
            <StormAnimation
              key={storm.id}
              storm={storm}
              isActive={false}
              stormIndex={index}
              totalStorms={stormsToDisplay.length}
              isWindyMode={isWindyMode}
              currentTime={currentTime}
              customColor={stormColor}
            />
          );
        })}

        {/* === ĐƯỜNG DỰ ĐOÁN TÙY CHỈNH (CYAN) === */}
        {customPredictionPath && customPredictionPath.length > 0 && (
          <Polyline
            positions={customPredictionPath}
            pathOptions={{
              color: 'cyan',
              weight: 5,
              opacity: 1,
              dashArray: '10, 10'
            }}
            pane="customPredictionPane"
          >
            <Popup>
              <div className="p-1">
                <h4 className="font-semibold">Đường đi dự đoán tùy chỉnh</h4>
                <p>{customPredictionPath.length} điểm dự đoán từ model.</p>
              </div>
            </Popup>
            <Tooltip direction="top">Đường đi dự đoán</Tooltip>
          </Polyline>
        )}
      </MapContainer>

      {/* === PANEL NHIỆT ĐỘ === */}
      {activeLayer === 'temperature' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg z-[1000] border border-gray-200 min-w-[280px]">
          <p className="text-sm font-medium mb-2">Biểu đồ nhiệt độ</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-xs">Lạnh (&lt; 15°C)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-xs">Mát (15-25°C)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-xs">Ấm (25-30°C)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="text-xs">Nóng (&gt; 30°C)</span>
            </div>
          </div>
        </div>
      )}

      {/* === PANEL RADAR === */}
      {activeLayer === 'radar' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000] border border-gray-200">
          <p className="text-sm font-medium">Lớp radar thời tiết</p>
          <p className="text-xs text-gray-600 mt-1">Hiển thị mưa và mây</p>
        </div>
      )}

      {/* === WEATHER VALUE HOVER TOOLTIP === */}
      <WeatherValueTooltip value={hoverValue} />

      {/* === LOADING INDICATOR FOR WEATHER DATA === */}
      {isWeatherLoading && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1001] border border-gray-200">
          <LoadingSpinner size="sm" message="Loading weather data..." />
        </div>
      )}

      {/* === TOAST NOTIFICATIONS === */}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </div>
  );
}