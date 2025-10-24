import { useEffect, useState } from 'react';
// Thêm 'Tooltip' vào import
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import StormAnimation from './StormAnimation';
import WindyLayer from './WindyLayer';
import OptimizedTemperatureLayer from './OptimizedTemperatureLayer';
import WeatherLayerControl, { type LayerType } from './WeatherLayerControl'; 
import { DEFAULT_ZOOM, VIETNAM_BOUNDS, VIETNAM_CENTER } from '../lib/mapUtils';
import { getCategoryColor, type Storm, type StormPoint } from '../lib/stormData';

// --- BƯỚC 1: THÊM COMPONENT MỚI NÀY ---
function CreatePredictionPane() {
  const map = useMap();

  useEffect(() => {
    // Tạo một pane mới tên là 'customPredictionPane'
    map.createPane('customPredictionPane');
    const pane = map.getPane('customPredictionPane');
    if (pane) {
      // Ép nó luôn nổi lên trên cùng (cao hơn cả zIndex của Gió, Mây)
      
      // --- SỬA LỖI Ở ĐÂY: Chuyển 999 (number) thành "999" (string) ---
      pane.style.zIndex = "999"; 
    }
  }, [map]);

  return null; // Component này không render ra gì cả
}
// --- KẾT THÚC BƯỚC 1 ---


// Sửa props interface
interface WeatherMapProps {
  storms: Storm[];
  selectedStorm?: Storm;
  isPlayingAll: boolean;
  customPredictionPath?: [number, number][] | null; // Prop cũ
}

// ... (Giữ nguyên component SetMapBounds) ...
function SetMapBounds() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(VIETNAM_BOUNDS);
    map.setMinZoom(5);
    map.setMaxZoom(10);
  }, [map]);
  return null;
}

// ... (Giữ nguyên component getColoredPathSegments) ...
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
      pathOptions: { color, weight: 6, opacity: 1, dashArray: '0' }
    });
  }
  return segments;
}

// ... (Giữ nguyên component StormPath) ...
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


// Sửa component WeatherMap
export default function WeatherMap({ 
  storms, 
  selectedStorm, 
  isPlayingAll, 
  customPredictionPath 
}: WeatherMapProps) {
  
  const [activeLayer, setActiveLayer] = useState<LayerType>('none');
  const [layerOpacity, setLayerOpacity] = useState(0.6);
  const [showWindLayer, setShowWindLayer] = useState(false);
  const [showTemperatureAnimation, setShowTemperatureAnimation] = useState(false);

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
        {/* --- BƯỚC 2: THÊM COMPONENT TẠO PANE VÀO ĐÂY --- */}
        <SetMapBounds />
        <CreatePredictionPane /> 
        {/* --- KẾT THÚC BƯỚC 2 --- */}


        {/* ... (Giữ nguyên tất cả code TileLayer của bạn) ... */}
        {activeLayer === 'none' && (
          <>
            <TileLayer 
              attribution='© Google Satellite'
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={1}
            />
            <TileLayer 
              attribution='© Google Maps'
              url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={2}
            />
          </>
        )}
        
        {/* Các layer 'satellite', 'radar', 'temperature', 'wind' giữ nguyên */}
        
        {activeLayer === 'satellite' && (
          <>
            <TileLayer
              attribution='© ESRI'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={19}
              maxZoom={22}
              zIndex={1}
            />
            <TileLayer
              attribution='© OpenWeatherMap'
              url={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}`}
              opacity={0.5}
              zIndex={2}
            />
            <TileLayer
              attribution='© Google Maps'
              url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={3}
            />
          </>
        )}

        {activeLayer === 'radar' && (
          <>
            <TileLayer
              attribution='© Google Satellite'
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={1}
            />
            <WeatherLayerControl type={activeLayer} opacity={layerOpacity} />
            <TileLayer
              attribution='© Google Maps'
              url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={100}
              opacity={0.8}
            />
          </>
        )}

        {activeLayer === 'temperature' && (
          <>
            <TileLayer
              attribution='© Google Satellite'
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={1}
            />
            <OptimizedTemperatureLayer 
              opacity={layerOpacity} 
              showAnimation={showTemperatureAnimation}
            />
            <TileLayer
              attribution='© Google Maps'
              url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={100}
              opacity={0.8}
            />
          </>
        )}

        {showWindLayer && (
          <>
            <TileLayer
              attribution='© Google Satellite'
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={1}
            />
            <WindyLayer />
            <TileLayer
              attribution='© Google Maps'
              url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
              maxNativeZoom={20}
              maxZoom={22}
              zIndex={100}
              opacity={0.8}
            />
          </>
        )}


        {/* Storm Paths - (giữ nguyên) */}
        {stormsToDisplay.map(storm => (
          <StormPath
            key={storm.id}
            storm={storm}
            showAnimation={isPlayingAll || selectedStorm?.id === storm.id}
          />
        ))}
        
        {/* --- BƯỚC 3: SỬA LẠI PANE CỦA ĐƯỜNG DỰ ĐOÁN --- */}
        {customPredictionPath && (
          <Polyline
            positions={customPredictionPath}
            pathOptions={{
              color: 'cyan',
              weight: 5,
              opacity: 1, // Tăng độ rõ
              dashArray: '10, 10'
            }}
            pane="customPredictionPane" // <-- SỬ DỤNG PANE MỚI (CAO NHẤT)
          >
            <Popup>
              <div className="p-1">
                <h4 className="font-semibold">Đường đi dự đoán tùy chỉnh</h4>
                <p>{customPredictionPath.length} điểm dự đoán từ model.</p>
              </div>
            </Popup>
            <Tooltip>Đường đi dự đoán tùy chỉnh</Tooltip>
          </Polyline>
        )}
        {/* --- KẾT THÚC BƯỚC 3 --- */}

      </MapContainer>

      {/* ... (Giữ nguyên các div Legend và Layer Control Panel) ... */}
      {/* (Tất cả code chú giải, nút bấm... giữ nguyên) */}
      {activeLayer === 'temperature' && ( 
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg z-[1000] border border-gray-200 min-w-[280px]">
           {/* ... code ... */}
        </div> 
      )}
      {activeLayer === 'radar' && ( 
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000] border border-gray-200">
           {/* ... code ... */}
        </div> 
      )}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg z-[1001] min-w-[220px]">
         {/* ... code ... */}
      </div>
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000]">
         {/* ... code ... */}
      </div>
    </div>
  );
}