import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StormAnimation from './StormAnimation';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { getCategoryColor, type Storm } from '../lib/stormData';
import { DEFAULT_ZOOM, VIETNAM_BOUNDS, VIETNAM_CENTER } from '../lib/mapUtils';
import { Button } from './ui/button';

interface WeatherMapProps {
  storms: Storm[];
  selectedStorm?: Storm;
}

// Component để set bounds cho map
function SetMapBounds() {
  const map = useMap();
  
  useEffect(() => {
    map.setMaxBounds(VIETNAM_BOUNDS);
    map.setMinZoom(5);
    map.setMaxZoom(10);
  }, [map]);
  
  return null;
}

// Component hiển thị đường đi bão
function StormPath({ storm, showAnimation }: { storm: Storm; showAnimation: boolean }) {
  const historicalPath = storm.historical.map(point => [point.lat, point.lng] as [number, number]);
  const forecastPath = storm.forecast.map(point => [point.lat, point.lng] as [number, number]);
  const currentPos = [storm.currentPosition.lat, storm.currentPosition.lng] as [number, number];
  
  const fullHistoricalPath = [...historicalPath, currentPos];
  const fullForecastPath = [currentPos, ...forecastPath];

  return (
    <>
      {/* Đường đi đã qua (màu đỏ đậm) */}
      <Polyline 
        positions={fullHistoricalPath}
        pathOptions={{ 
          color: '#dc2626', 
          weight: 4, 
          opacity: 0.8,
          dashArray: '0'
        }}
      />
      
      {/* Đường đi dự kiến (màu đỏ nhạt, nét đứt) */}
      <Polyline 
        positions={fullForecastPath}
        pathOptions={{ 
          color: '#f87171', 
          weight: 3, 
          opacity: 0.6,
          dashArray: '10, 10'
        }}
      />
      
      {/* Hiển thị animation hoặc vị trí tĩnh */}
      {showAnimation ? (
        <StormAnimation storm={storm} isActive={true} />
      ) : (
        <>
          {/* Vị trí hiện tại */}
          <CircleMarker
            center={currentPos}
            radius={12}
            pathOptions={{
              fillColor: getCategoryColor(storm.currentPosition.category),
              color: '#000',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg">{storm.nameVi}</h3>
                <p><strong>Vị trí hiện tại:</strong> {storm.currentPosition.lat.toFixed(1)}°N, {storm.currentPosition.lng.toFixed(1)}°E</p>
                <p><strong>Tốc độ gió:</strong> {storm.currentPosition.windSpeed} km/h</p>
                <p><strong>Áp suất:</strong> {storm.currentPosition.pressure} hPa</p>
                <p><strong>Cấp độ:</strong> {storm.currentPosition.category}</p>
              </div>
            </Popup>
          </CircleMarker>
          
          {/* Các điểm dự báo */}
          {storm.forecast.map((point, index) => (
            <CircleMarker
              key={`forecast-${index}`}
              center={[point.lat, point.lng]}
              radius={8}
              pathOptions={{
                fillColor: getCategoryColor(point.category),
                color: '#000',
                weight: 1,
                opacity: 0.7,
                fillOpacity: 0.5
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

export default function WeatherMap({ storms, selectedStorm }: WeatherMapProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingStorm, setAnimatingStorm] = useState<string | null>(null);

  const handleToggleAnimation = () => {
    if (isAnimating) {
      setIsAnimating(false);
      setAnimatingStorm(null);
    } else {
      setIsAnimating(true);
      setAnimatingStorm(selectedStorm?.id || storms[0]?.id || null);
    }
  };

  const handleResetAnimation = () => {
    setIsAnimating(false);
    setAnimatingStorm(null);
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
        
        {/* Tile layer - OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Hiển thị tất cả bão */}
        {storms.map(storm => (
          <StormPath 
            key={storm.id} 
            storm={storm} 
            showAnimation={isAnimating && animatingStorm === storm.id}
          />
        ))}
      </MapContainer>
      
      {/* Animation Controls */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000]">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isAnimating ? "destructive" : "default"}
            onClick={handleToggleAnimation}
            className="flex items-center gap-2"
          >
            {isAnimating ? (
              <>
                <Pause className="h-4 w-4" />
                Dừng
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Phát
              </>
            )}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetAnimation}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
        
        {isAnimating && (
          <p className="text-xs text-muted-foreground mt-2">
            Đang mô phỏng: {storms.find(s => s.id === animatingStorm)?.nameVi}
          </p>
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