import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import StormAnimation from './StormAnimation';
import WindyLayer from './WindyLayer';
import WeatherLayerControl, { type LayerType } from './WeatherLayerControl'; 
import { DEFAULT_ZOOM, VIETNAM_BOUNDS, VIETNAM_CENTER } from '../lib/mapUtils';
import { getCategoryColor, type Storm, type StormPoint } from '../lib/stormData';
// import { getHurricaneVortexIcon } from '../lib/customIcons'; // Đã loại bỏ icon xoáy bão


interface WeatherMapProps {
  storms: Storm[];
  selectedStorm?: Storm;
  isPlayingAll: boolean;
}

function SetMapBounds() {
  const map = useMap();

  useEffect(() => {
    map.setMaxBounds(VIETNAM_BOUNDS);
    map.setMinZoom(5);
    map.setMaxZoom(10);
  }, [map]);

  return null;
}

function getColoredPathSegments(points: StormPoint[]) {
    if (points.length < 2) return [];

    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
        const startPoint = points[i];
        const endPoint = points[i + 1];
        const color = getCategoryColor(endPoint.category);

        segments.push({
            positions: [
                [startPoint.lat, startPoint.lng],
                [endPoint.lat, endPoint.lng]
            ] as [number, number][],
            pathOptions: {
                color: color,
                weight: 6,
                opacity: 1, 
                dashArray: '0',
            }
        });
    }
    return segments;
}

function StormPath({ storm, showAnimation }: { storm: Storm; showAnimation: boolean }) {
  const currentPosPoint = storm.currentPosition;
  const fullPathPoints = [
    ...storm.historical, 
    currentPosPoint, 
    ...storm.forecast.slice(1)
  ];

  const fullSegments = getColoredPathSegments(fullPathPoints);

  return (
    <>
      {fullSegments.map((segment, index) => (
          <Polyline 
              key={`path-${storm.id}-${index}`}
              positions={segment.positions}
              pathOptions={segment.pathOptions}
          />
      ))}

      {showAnimation ? (
        <StormAnimation storm={storm} isActive={true} />
      ) : (
        <>
          {/* QUAY LẠI SỬ DỤNG CircleMarker CHO VỊ TRÍ HIỆN TẠI */}
          <CircleMarker
            center={[currentPosPoint.lat, currentPosPoint.lng]}
            radius={14}
            pathOptions={{
              fillColor: getCategoryColor(currentPosPoint.category),
              color: '#333',
              weight: 3,
              opacity: 1,
              fillOpacity: 0.9
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg">{storm.nameVi}</h3>
                <p><strong>Vị trí hiện tại:</strong> {currentPosPoint.lat.toFixed(1)}°N, {currentPosPoint.lng.toFixed(1)}°E</p>
                <p><strong>Tốc độ gió:</strong> {currentPosPoint.windSpeed} km/h</p>
                <p><strong>Áp suất:</strong> {currentPosPoint.pressure} hPa</p>
                <p><strong>Cấp độ:</strong> {currentPosPoint.category}</p>
              </div>
            </Popup>
          </CircleMarker>

          {/* Các điểm dự báo (Chấm tròn nhỏ) */}
          {storm.forecast.map((point, index) => (
            <CircleMarker
              key={`forecast-${index}`}
              center={[point.lat, point.lng]}
              radius={7}
              pathOptions={{
                fillColor: getCategoryColor(point.category),
                color: '#fff',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 1
              }}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold">Dự báo {storm.nameVi}</h4>
                  <p><strong>Thời gian:</strong> {new Date(point.timestamp).toLocaleString('vi-VN')}</p>
                  <p><strong>Tốc độ gió:</strong> {point.windSpeed} km/h</p>
                  <p><strong>Áp suất:</strong> {point.pressure} hPa</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </>
      )}
    </>
  );
}

export default function WeatherMap({ storms, selectedStorm, isPlayingAll }: WeatherMapProps) {
  const [activeLayer, setActiveLayer] = useState<LayerType>('none');
  const [layerOpacity, setLayerOpacity] = useState(0.8);
  const [showWindLayer, setShowWindLayer] = useState(false);
  
  const stormsToDisplay = selectedStorm ? [selectedStorm] : storms;

  const handleLayerChange = (layer: LayerType) => {
    if (layer === 'wind') {
      setShowWindLayer(true);
      setActiveLayer('none');
    } else {
      setShowWindLayer(false);
      setActiveLayer(layer);
    }
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[VIETNAM_CENTER.lat, VIETNAM_CENTER.lng]}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <SetMapBounds />

        {/* 1. LỚP BẢN ĐỒ VỆ TINH (Base Layer - An toàn chủ quyền) */}
        <TileLayer
          attribution='© Google Satellite'
          url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          maxNativeZoom={20}
          maxZoom={22}
          zIndex={1}
        />

        {/* 2. LỚP NHÃN VÀ BIÊN GIỚI (Overlay Layer - Đảm bảo tên thành phố/quốc gia) */}
        <TileLayer
          attribution='© Google Maps Data'
          url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
          maxNativeZoom={20}
          maxZoom={22}
          zIndex={2}
        />

        {/* Weather Layers (Satellite, Temperature, Radar) */}
        <WeatherLayerControl type={activeLayer} opacity={layerOpacity} />

        {/* Wind Layer (leaflet-velocity) */}
        {showWindLayer && <WindyLayer />}

        {/* Storm Paths */}
        {stormsToDisplay.map(storm => (
          <StormPath
            key={storm.id}
            storm={storm}
            showAnimation={isPlayingAll || selectedStorm?.id === storm.id}
          />
        ))}
      </MapContainer>

      {/* Legend cho lớp bản đồ nhiệt độ */}
      {activeLayer === 'temperature' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg z-[1000] border border-gray-200">
            <h4 className="text-xs font-semibold text-center mb-1 text-gray-800">Nhiệt độ (℃)</h4>
            <div className="flex justify-between text-xs font-medium">
                <span className="text-blue-600">5</span>
                <span className="text-cyan-500">15</span>
                <span className="text-yellow-500">25</span>
                <span className="text-red-500">35</span>
                <span className="text-purple-600">45</span>
            </div>
            <div className="h-2 w-full rounded-full" style={{
                background: 'linear-gradient(to right, #4F46E5, #06B6D4, #FACC15, #EF4444, #9333EA)'
            }}></div>
        </div>
      )}

      {/* Layer Control Panel (ĐÃ DI CHUYỂN XUỐNG DƯỚI BÊN PHẢI) */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg z-[1001] min-w-[220px]">
        <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Lớp bản đồ
        </h4>
        
        <div className="space-y-2">
          <button
            onClick={() => handleLayerChange('none')}
            className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all flex items-center gap-2 ${
              activeLayer === 'none' && !showWindLayer
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span className="text-base">🗺️</span>
            <span>Bản đồ thường</span>
          </button>
          
          <button
            onClick={() => handleLayerChange('satellite')}
            className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all flex items-center gap-2 ${
              activeLayer === 'satellite'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span className="text-base">🛰️</span>
            <span>Hình ảnh vệ tinh</span>
          </button>
          
          <button
            onClick={() => handleLayerChange('temperature')}
            className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all flex items-center gap-2 ${
              activeLayer === 'temperature'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span className="text-base">🌡️</span>
            <span>Bản đồ nhiệt</span>
          </button>

          <button
            onClick={() => handleLayerChange('radar')}
            className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all flex items-center gap-2 ${
              activeLayer === 'radar'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span className="text-base">☔</span>
            <span>Radar mưa</span>
          </button>

          <button
            onClick={() => handleLayerChange('wind')}
            className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all flex items-center gap-2 ${
              showWindLayer
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span className="text-base">💨</span>
            <span>Dòng gió</span>
          </button>
        </div>

        {(activeLayer !== 'none' || showWindLayer) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="text-xs text-gray-600 block mb-2 font-medium">
              Độ mờ layer: {Math.round(layerOpacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={layerOpacity}
              onChange={(e) => setLayerOpacity(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
              disabled={showWindLayer}
            />
            {showWindLayer && (
              <p className="text-xs text-gray-500 mt-1">
                * Độ mờ không áp dụng cho layer gió
              </p>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000]">
        <h4 className="font-semibold mb-2 text-sm">Chú thích</h4>
        <div className="space-y-1 text-xs"> 
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-red-600"></div>
            <span>Đường đi đã qua</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-red-300 border-dashed border-t-2 border-red-300"></div>
            <span>Đường đi dự kiến</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-black"></div>
            <span>Vị trí hiện tại</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white border-2 border-white shadow-lg animate-pulse"></div>
            <span>Đang di chuyển</span>
          </div>
        </div>
      </div>
    </div>
  );
}