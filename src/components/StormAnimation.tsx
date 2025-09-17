import { useEffect, useState } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { getCategoryColor, type Storm, type StormPoint } from '../lib/stormData';

interface StormAnimationProps {
  storm: Storm;
  isActive: boolean;
}

export default function StormAnimation({ storm, isActive }: StormAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animatedPosition, setAnimatedPosition] = useState<StormPoint>(storm.currentPosition);
  
  // Tạo danh sách tất cả các điểm (lịch sử + hiện tại + dự báo)
  const allPoints = [...storm.historical, storm.currentPosition, ...storm.forecast];
  
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % allPoints.length;
        setAnimatedPosition(allPoints[nextIndex]);
        return nextIndex;
      });
    }, 2000); // Chuyển điểm mỗi 2 giây
    
    return () => clearInterval(interval);
  }, [isActive, allPoints]);
  
  // Reset về vị trí hiện tại khi không active
  useEffect(() => {
    if (!isActive) {
      const currentIdx = storm.historical.length;
      setCurrentIndex(currentIdx);
      setAnimatedPosition(storm.currentPosition);
    }
  }, [isActive, storm]);
  
  const isPastPoint = currentIndex < storm.historical.length;
  const isFuturePoint = currentIndex > storm.historical.length;
  const radius = isActive ? (isPastPoint ? 8 : isFuturePoint ? 10 : 15) : 12;
  const opacity = isActive ? (isPastPoint ? 0.6 : isFuturePoint ? 0.7 : 1.0) : 0.8;
  
  return (
    <CircleMarker
      center={[animatedPosition.lat, animatedPosition.lng]}
      radius={radius}
      pathOptions={{
        fillColor: getCategoryColor(animatedPosition.category),
        color: isActive ? '#fff' : '#000',
        weight: isActive ? 3 : 2,
        opacity: 1,
        fillOpacity: opacity
      }}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-bold text-lg">{storm.nameVi}</h3>
          <p><strong>Thời gian:</strong> {new Date(animatedPosition.timestamp).toLocaleString('vi-VN')}</p>
          <p><strong>Vị trí:</strong> {animatedPosition.lat.toFixed(1)}°N, {animatedPosition.lng.toFixed(1)}°E</p>
          <p><strong>Tốc độ gió:</strong> {animatedPosition.windSpeed} km/h</p>
          <p><strong>Áp suất:</strong> {animatedPosition.pressure} hPa</p>
          <p><strong>Cấp độ:</strong> {animatedPosition.category}</p>
          {isActive && (
            <p className="text-sm text-blue-600 mt-1">
              {isPastPoint && "📍 Đã qua"}
              {currentIndex === storm.historical.length && "🔴 Hiện tại"}
              {isFuturePoint && "🔮 Dự báo"}
            </p>
          )}
        </div>
      </Popup>
    </CircleMarker>
  );
}