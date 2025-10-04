import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StormAnimation from './StormAnimation';
import { getCategoryColor, type Storm, type StormPoint } from '../lib/stormData';
import { DEFAULT_ZOOM, VIETNAM_BOUNDS, VIETNAM_CENTER } from '../lib/mapUtils';

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

// Hàm mới để tạo các đoạn đường đi được tô màu theo cấp độ bão (CẬP NHẬT)
function getColoredPathSegments(points: StormPoint[], isForecast: boolean) {
    if (points.length < 2) return [];

    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
        const startPoint = points[i];
        const endPoint = points[i + 1];

        // Lấy màu dựa trên cấp độ bão của điểm cuối (endPoint)
        const color = getCategoryColor(endPoint.category);

        segments.push({
            positions: [
                [startPoint.lat, startPoint.lng],
                [endPoint.lat, endPoint.lng]
            ] as [number, number][],
            pathOptions: {
                color: color,
                weight: 6, // Tăng độ dày đường
                opacity: 1, 
                dashArray: '0', // Đường liền (solid)
            }
        });
    }
    return segments;
}

function StormPath({ storm, showAnimation }: { storm: Storm; showAnimation: boolean }) {
  // Điểm hiện tại
  const currentPosPoint = storm.currentPosition;
  
  // Lịch sử: Các điểm đã qua + Vị trí hiện tại
  const historicalPathPoints = [...storm.historical, currentPosPoint];
  
  // Dự báo: Vị trí hiện tại + Các điểm dự báo
  const forecastPathPoints = [currentPosPoint, ...storm.forecast];

  // Tạo các đoạn đường màu cho Lịch sử
  const historicalSegments = getColoredPathSegments(historicalPathPoints, false);
  
  // Tạo các đoạn đường màu cho Dự báo (Chúng ta vẫn coi forecast là đoạn liền nhau)
  const forecastSegments = getColoredPathSegments(forecastPathPoints, true);

  return (
    <>
      {/* VẼ ĐƯỜNG ĐI LỊCH SỬ (SOLID, MÀU THEO CẤP ĐỘ) */}
      {historicalSegments.map((segment, index) => (
          <Polyline 
              key={`hist-${storm.id}-${index}`}
              positions={segment.positions}
              pathOptions={segment.pathOptions}
          />
      ))}

      {/* VẼ ĐƯỜNG ĐI DỰ BÁO (SOLID, MÀU THEO CẤP ĐỘ) */}
      {forecastSegments.map((segment, index) => (
          <Polyline 
              key={`fore-${storm.id}-${index}`}
              positions={segment.positions}
              pathOptions={segment.pathOptions}
          />
      ))}

      {showAnimation ? (
        <StormAnimation storm={storm} isActive={true} />
      ) : (
        <>
          {/* Vị trí hiện tại (Hình tròn lớn) */}
          <CircleMarker
            center={[currentPosPoint.lat, currentPosPoint.lng]}
            radius={14} // Tăng kích thước để nổi bật
            pathOptions={{
              fillColor: getCategoryColor(currentPosPoint.category),
              color: '#333', // Viền đen đậm
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
              radius={7} // Kích thước nhỏ hơn
              pathOptions={{
                fillColor: getCategoryColor(point.category),
                color: '#fff', // Viền trắng
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
  
  const stormsToDisplay = selectedStorm ? [selectedStorm] : storms;

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

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {stormsToDisplay.map(storm => (
          <StormPath
            key={storm.id}
            storm={storm}
            showAnimation={isPlayingAll || selectedStorm?.id === storm.id}
          />
        ))}
      </MapContainer>

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