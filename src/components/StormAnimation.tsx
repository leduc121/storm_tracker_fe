import React, { useEffect, useState, useRef } from "react";
import { CircleMarker, Popup, Marker, Polygon, Polyline } from "react-leaflet";
import { divIcon } from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { getCategoryColor, type Storm, type StormPoint } from "../lib/stormData";

interface StormAnimationProps {
  storm: Storm;
  isActive: boolean;
}

const PulsingDivIcon = (category: string) => {
  const color = getCategoryColor(category);
  const html = renderToStaticMarkup(
    <div
      style={{
        backgroundColor: color,
        width: "24px",  
        height: "24px",
        borderRadius: "50%",
        border: "3px solid white",
        boxShadow: "0 0 12px rgba(0,0,0,0.3), 0 0 24px " + color,
      }}
    />
  );
  return divIcon({
    html: html + `
      <style>
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .custom-icon > div {
          animation: pulse-scale 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      </style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    className: "custom-icon",
  });
};

/* ---------- helper geo functions ---------- */
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** geodesic offset: trả về [lat, lng] khi dịch điểm theo bearing và khoảng cách (km) */
function offsetPoint(lat: number, lng: number, bearingDeg: number, offsetKm: number) {
  const R = 6371; // km
  const d = offsetKm / R;
  const brng = toRad(bearingDeg);

  const lat1 = toRad(lat);
  const lon1 = toRad(lng);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [toDeg(lat2), toDeg(lon2)];
}

/** tính bearing (initial) từ from -> to (0..360) */
function bearing(from: StormPoint, to: StormPoint) {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLon = toRad(to.lng - from.lng);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  let brng = Math.atan2(y, x);
  brng = toDeg(brng);
  return (brng + 360) % 360;
}

/* ---------- component ---------- */
export default function StormAnimation({ storm, isActive }: StormAnimationProps) {
  // allPoints: history + current + forecast
  const allPoints: StormPoint[] = [...storm.historical, storm.currentPosition, ...storm.forecast];
  const currentIndexDefault = storm.historical.length;
  
  const [currentIndex, setCurrentIndex] = useState<number>(currentIndexDefault);
  const [animatedPosition, setAnimatedPosition] = useState<StormPoint>(storm.currentPosition);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animation ticker
  useEffect(() => {
    // Clear previous interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isActive || allPoints.length === 0) {
      // Reset về vị trí hiện tại khi không active
      setCurrentIndex(currentIndexDefault);
      setAnimatedPosition(storm.currentPosition);
      return;
    }

    // Bắt đầu từ điểm đầu tiên
    let idx = 0;
    setCurrentIndex(idx);
    setAnimatedPosition(allPoints[idx]);

    intervalRef.current = setInterval(() => {
      idx = idx + 1;
      
      if (idx >= allPoints.length) {
        // Loop lại từ đầu
        idx = 0;
      }
      
      setCurrentIndex(idx);
      setAnimatedPosition(allPoints[idx]);
    }, 800); // 800ms mỗi bước để mượt hơn

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, storm.id]); // Chỉ phụ thuộc vào isActive và storm.id

  /* ---------- build cone of uncertainty ---------- */
  if (allPoints.length < 2) {
    return (
      <>
        <CircleMarker
          center={[animatedPosition.lat, animatedPosition.lng]}
          radius={12}
          pathOptions={{
            fillColor: getCategoryColor(animatedPosition.category),
            color: "#fff",
            weight: 3,
            fillOpacity: 0.8,
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-lg">{storm.nameVi}</h3>
              <p><strong>Vị trí:</strong> {animatedPosition.lat.toFixed(2)}°N, {animatedPosition.lng.toFixed(2)}°E</p>
            </div>
          </Popup>
        </CircleMarker>
      </>
    );
  }

  const lastIndex = allPoints.length - 1;
  const currentIdx = currentIndexDefault;

  // Chỉ vẽ cone cho forecast (từ vị trí hiện tại trở đi)
  const forecastPoints = allPoints.slice(currentIdx);
  
  const leftOuter: [number, number][] = [];
  const rightOuter: [number, number][] = [];
  const leftMiddle: [number, number][] = [];
  const rightMiddle: [number, number][] = [];
  const leftInner: [number, number][] = [];
  const rightInner: [number, number][] = [];

  for (let i = 0; i < forecastPoints.length; i++) {
    const pt = forecastPoints[i];
    
    // Tính bearing
    let brng: number;
    if (i < forecastPoints.length - 1) {
      brng = bearing(pt, forecastPoints[i + 1]);
    } else if (i > 0) {
      brng = bearing(forecastPoints[i - 1], pt);
    } else {
      brng = 0;
    }

    // Tính offset dựa trên cường độ bão
    // Bão càng mạnh (windSpeed cao) → cone càng hẹp (độ chắc chắn cao)
    // Bão càng yếu (windSpeed thấp) → cone càng rộng (độ không chắc chắn cao)
    const windSpeed = pt.windSpeed || 50; // km/h
    
    // Công thức: offset tỉ lệ nghịch với windSpeed
    // windSpeed 150+ km/h → offset ~40-60km (hẹp)
    // windSpeed 50-80 km/h → offset ~200-300km (rộng)
    const minOffset = 40;
    const maxOffset = 300;
    
    // Normalize windSpeed (giả sử range 30-200 km/h)
    const normalizedWind = Math.max(0, Math.min(1, (windSpeed - 30) / 170));
    
    // Offset tỉ lệ nghịch: gió mạnh → offset nhỏ
    const offsetKm = maxOffset - normalizedWind * (maxOffset - minOffset);
    
    // Thêm yếu tố khoảng cách thời gian (cone mở rộng theo thời gian)
    const timeProgress = forecastPoints.length > 1 ? i / (forecastPoints.length - 1) : 0;
    const timeMultiplier = 1 + timeProgress * 0.5; // tăng thêm 50% theo thời gian
    
    const finalOffset = offsetKm * timeMultiplier;

    // 3 lớp với độ rộng khác nhau
    const outerOffset = finalOffset;
    const middleOffset = finalOffset * 0.65;
    const innerOffset = finalOffset * 0.35;

    leftOuter.push(offsetPoint(pt.lat, pt.lng, brng - 90, outerOffset) as [number, number]);
    rightOuter.push(offsetPoint(pt.lat, pt.lng, brng + 90, outerOffset) as [number, number]);
    
    leftMiddle.push(offsetPoint(pt.lat, pt.lng, brng - 90, middleOffset) as [number, number]);
    rightMiddle.push(offsetPoint(pt.lat, pt.lng, brng + 90, middleOffset) as [number, number]);
    
    leftInner.push(offsetPoint(pt.lat, pt.lng, brng - 90, innerOffset) as [number, number]);
    rightInner.push(offsetPoint(pt.lat, pt.lng, brng + 90, innerOffset) as [number, number]);
  }

  // Tạo polygon khép kín cho mỗi lớp
  const outerCone = [...leftOuter, ...rightOuter.slice().reverse()];
  const middleCone = [...leftMiddle, ...rightMiddle.slice().reverse()];
  const innerCone = [...leftInner, ...rightInner.slice().reverse()];
  
  const centerTrack: [number, number][] = forecastPoints.map((p) => [p.lat, p.lng]);

  /* ---------- render ---------- */
  return (
    <>
      {/* Lớp ngoài cùng - màu nhạt nhất */}
      <Polygon
        positions={outerCone}
        pathOptions={{
          color: "transparent",
          weight: 0,
          fillColor: "#e5e7eb",
          fillOpacity: 0.25,
        }}
      />
      
      {/* Viền outer */}
      <Polyline
        positions={leftOuter}
        pathOptions={{
          color: "#ffffff",
          weight: 2.5,
          opacity: 0.8,
          dashArray: "12,10",
        }}
      />
      <Polyline
        positions={rightOuter}
        pathOptions={{
          color: "#ffffff",
          weight: 2.5,
          opacity: 0.8,
          dashArray: "12,10",
        }}
      />

      {/* Lớp giữa */}
      <Polygon
        positions={middleCone}
        pathOptions={{
          color: "transparent",
          weight: 0,
          fillColor: "#d1d5db",
          fillOpacity: 0.3,
        }}
      />
      
      {/* Viền middle */}
      <Polyline
        positions={leftMiddle}
        pathOptions={{
          color: "#ffffff",
          weight: 2,
          opacity: 0.75,
          dashArray: "10,8",
        }}
      />
      <Polyline
        positions={rightMiddle}
        pathOptions={{
          color: "#ffffff",
          weight: 2,
          opacity: 0.75,
          dashArray: "10,8",
        }}
      />

      {/* Lớp trong - màu đậm nhất */}
      <Polygon
        positions={innerCone}
        pathOptions={{
          color: "transparent",
          weight: 0,
          fillColor: "#9ca3af",
          fillOpacity: 0.35,
        }}
      />
      
      {/* Viền inner */}
      <Polyline
        positions={leftInner}
        pathOptions={{
          color: "#ffffff",
          weight: 1.8,
          opacity: 0.7,
          dashArray: "8,6",
        }}
      />
      <Polyline
        positions={rightInner}
        pathOptions={{
          color: "#ffffff",
          weight: 1.8,
          opacity: 0.7,
          dashArray: "8,6",
        }}
      />

      {/* Center track - đường trung tâm */}
      <Polyline
        positions={centerTrack}
        pathOptions={{
          color: "#ffffff",
          weight: 2.5,
          opacity: 0.9,
          dashArray: "3,12",
        }}
      />

      {/* Vẽ đường đi đã qua (từ điểm đầu đến vị trí hiện tại) */}
      {currentIndex > 0 && (
        <Polyline
          positions={allPoints.slice(0, currentIndex + 1).map(p => [p.lat, p.lng] as [number, number])}
          pathOptions={{
            color: getCategoryColor(animatedPosition.category),
            weight: 4,
            opacity: 0.8,
          }}
        />
      )}

      {/* Pulsing marker */}
      <Marker
        position={[animatedPosition.lat, animatedPosition.lng]}
        icon={PulsingDivIcon(animatedPosition.category)}
      />

      {/* Wind Radii Ellipses - Vùng ảnh hưởng gió */}
      {(() => {
        // Tính hướng di chuyển để xoay ellipse
        let movementBearing = 0;
        if (currentIndex < allPoints.length - 1) {
          movementBearing = bearing(animatedPosition, allPoints[currentIndex + 1]);
        } else if (currentIndex > 0) {
          movementBearing = bearing(allPoints[currentIndex - 1], animatedPosition);
        }

        // Tạo hình ellipse bằng cách tạo nhiều điểm xung quanh tâm
        const createEllipse = (centerLat: number, centerLng: number, radiusA: number, radiusB: number, rotationDeg: number, numPoints = 64) => {
          const points: [number, number][] = [];
          const rotation = toRad(rotationDeg);
          
          for (let i = 0; i <= numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            
            // Tọa độ ellipse chuẩn
            const x = radiusA * Math.cos(angle);
            const y = radiusB * Math.sin(angle);
            
            // Xoay theo hướng di chuyển
            const xRot = x * Math.cos(rotation) - y * Math.sin(rotation);
            const yRot = x * Math.sin(rotation) + y * Math.cos(rotation);
            
            // Chuyển sang tọa độ địa lý
            const point = offsetPoint(centerLat, centerLng, 0, yRot);
            const finalPoint = offsetPoint(point[0], point[1], 90, xRot);
            points.push(finalPoint as [number, number]);
          }
          
          return points;
        };

        // 3 ellipse với kích thước khác nhau
        const outerEllipse = createEllipse(animatedPosition.lat, animatedPosition.lng, 250, 180, movementBearing);
        const middleEllipse = createEllipse(animatedPosition.lat, animatedPosition.lng, 160, 110, movementBearing);
        const innerEllipse = createEllipse(animatedPosition.lat, animatedPosition.lng, 90, 60, movementBearing);

        return (
          <>
            {/* Ellipse ngoài cùng - Gió 34 knots */}
            <Polygon
              positions={outerEllipse}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                opacity: 0.5,
                dashArray: "10,8",
                fillColor: "#d1d5db",
                fillOpacity: 0.12,
              }}
            />
            
            {/* Ellipse giữa - Gió 50 knots */}
            <Polygon
              positions={middleEllipse}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                opacity: 0.6,
                dashArray: "8,6",
                fillColor: "#9ca3af",
                fillOpacity: 0.15,
              }}
            />
            
            {/* Ellipse trong - Gió 64 knots */}
            <Polygon
              positions={innerEllipse}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                opacity: 0.7,
                fillColor: getCategoryColor(animatedPosition.category),
                fillOpacity: 0.2,
              }}
            />
          </>
        );
      })()}

      {/* Main circle marker */}
      <CircleMarker
        center={[animatedPosition.lat, animatedPosition.lng]}
        radius={isActive ? 14 : 10}
        pathOptions={{
          fillColor: getCategoryColor(animatedPosition.category),
          color: "#fff",
          weight: 3,
          fillOpacity: 0.9,
        }}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-bold text-lg">{storm.nameVi}</h3>
            <p className="text-xs text-gray-500 mb-2">
              {currentIndex <= currentIdx ? "Lịch sử" : "Dự báo"}
            </p>
            <p>
              <strong>Thời gian:</strong>{" "}
              {new Date(animatedPosition.timestamp).toLocaleString("vi-VN")}
            </p>
            <p>
              <strong>Vị trí:</strong> {animatedPosition.lat.toFixed(2)}°N,{" "}
              {animatedPosition.lng.toFixed(2)}°E
            </p>
            <p>
              <strong>Tốc độ gió:</strong> {animatedPosition.windSpeed} km/h
            </p>
            <p>
              <strong>Áp suất:</strong> {animatedPosition.pressure} hPa
            </p>
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
}