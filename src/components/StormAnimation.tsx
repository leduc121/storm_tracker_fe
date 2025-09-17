// StormAnimation.tsx
import React, { useEffect, useState } from "react";
import { CircleMarker, Popup, Marker, Polygon, Polyline } from "react-leaflet";
import { divIcon } from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { getCategoryColor, type Storm, type StormPoint } from "../lib/stormData";

interface StormAnimationProps {
  storm: Storm;
  isActive: boolean;
}

const PulsingDivIcon = (category: number) => {
  const color = getCategoryColor(category);
  const html = renderToStaticMarkup(
    <div
      style={{
        backgroundColor: color,
        width: "24px",  
        height: "24px",
        borderRadius: "50%",
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        opacity: 0.9,
        boxShadow: "0 0 8px rgba(0,0,0,0.2)",
      }}
    />
  );
  return divIcon({
    html,
    iconSize: [24, 24],
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
  let brng = Math.atan2(y, x); // radians
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

  // simple animation ticker (cycle through allPoints when active)
  useEffect(() => {
    if (!isActive || allPoints.length === 0) return;
    let idx = currentIndexDefault;
    setCurrentIndex(idx);
    setAnimatedPosition(allPoints[idx]);

    const t = setInterval(() => {
      idx = Math.min(allPoints.length - 1, idx + 1);
      setCurrentIndex(idx);
      setAnimatedPosition(allPoints[idx]);
      // stop at last forecast point (no loop) — nếu muốn loop đổi logic ở đây
      if (idx >= allPoints.length - 1) {
        clearInterval(t);
      }
    }, 1200);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, storm]);

  // reset when not active
  useEffect(() => {
    if (!isActive) {
      setCurrentIndex(currentIndexDefault);
      setAnimatedPosition(storm.currentPosition);
    }
  }, [isActive, storm, currentIndexDefault]);

  /* ---------- build cone of uncertainty ---------- */
  // nếu ít hơn 2 điểm thì không vẽ cone
  if (allPoints.length < 2) {
    return (
      <>
        <CircleMarker
          center={[animatedPosition.lat, animatedPosition.lng]}
          radius={12}
          pathOptions={{
            fillColor: getCategoryColor(animatedPosition.category),
            color: isActive ? "#fff" : "#000",
            weight: isActive ? 3 : 2,
            fillOpacity: 1,
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-lg">{storm.nameVi}</h3>
            </div>
          </Popup>
        </CircleMarker>
      </>
    );
  }

  const lastIndex = allPoints.length - 1;
  const startIdx = 0;
  const currentIdx = currentIndexDefault; // index của "hiện tại" trong allPoints

  // offsets (km)
  const baseOffsetKm = 20; // gần hiện tại, nhỏ
  const maxOffsetKm = 220; // đến cuối forecast rộng bao nhiêu (adustable)

  const leftBoundary: [number, number][] = [];
  const rightBoundary: [number, number][] = [];
  const leftInner: [number, number][] = [];
  const rightInner: [number, number][] = [];

  for (let i = 0; i <= lastIndex; i++) {
    const pt = allPoints[i];
    // pick direction for bearing: nếu còn next dùng next, nếu là cuối dùng prev
    const next = i < lastIndex ? allPoints[i + 1] : allPoints[i - 1];
    const brng = bearing(pt, next);

    // compute offset scale: historical => small & almost constant; future => grows with distance
    let offsetKm: number;
    if (i <= currentIdx) {
      // historical -> slightly increase toward current point
      const pHist = currentIdx > 0 ? i / currentIdx : 1;
      offsetKm = baseOffsetKm * (0.5 + 0.5 * pHist); // 50% .. 100% of baseOffsetKm
    } else {
      // future -> grow from baseOffsetKm to maxOffsetKm
      const denom = Math.max(1, lastIndex - currentIdx);
      const pFuture = (i - currentIdx) / denom; // 0 .. 1
      offsetKm = baseOffsetKm + pFuture * (maxOffsetKm - baseOffsetKm);
    }

    const innerFactor = 0.55; // inner dashed line nằm ở ~55% của khoảng rộng
    const leftPt = offsetPoint(pt.lat, pt.lng, brng - 90, offsetKm) as [number, number];
    const rightPt = offsetPoint(pt.lat, pt.lng, brng + 90, offsetKm) as [number, number];
    const leftInnerPt = offsetPoint(pt.lat, pt.lng, brng - 90, offsetKm * innerFactor) as [number, number];
    const rightInnerPt = offsetPoint(pt.lat, pt.lng, brng + 90, offsetKm * innerFactor) as [number, number];

    leftBoundary.push(leftPt);
    rightBoundary.push(rightPt);
    leftInner.push(leftInnerPt);
    rightInner.push(rightInnerPt);
  }

  // polygon positions must be closed loop: leftBoundary (start->end) + rightBoundary reversed (end->start)
  const conePolygon = [...leftBoundary, ...rightBoundary.slice().reverse()];

  // center track (dashed)
  const centerTrack: [number, number][] = allPoints.map((p) => [p.lat, p.lng]);

  // left/right outlines for stroke (dashed)
  const leftOutline = leftBoundary;
  const rightOutline = rightBoundary;

  // inner outline (optional dashed)
  const innerOutline = [...leftInner, ...rightInner.slice().reverse()];

  /* ---------- render ---------- */
  return (
    <>
      {/* filled cone with subtle color */}
      <Polygon
        positions={conePolygon}
        pathOptions={{
          color: "rgba(255,255,255,0.9)", // stroke color for polygon (you can hide by stroke:false)
          weight: 1,
          fillColor: "rgba(220,200,150,0.25)", // beige-ish fill similar Windy
          fillOpacity: 0.25,
          dashArray: undefined,
        }}
      />

      {/* outer dashed boundaries (white dotted lines) */}
      <Polyline
        positions={leftOutline}
        pathOptions={{
          color: "#ffffff",
          weight: 2,
          opacity: 0.95,
          dashArray: "8,8",
        }}
      />
      <Polyline
        positions={rightOutline}
        pathOptions={{
          color: "#ffffff",
          weight: 2,
          opacity: 0.95,
          dashArray: "8,8",
        }}
      />

      {/* inner dashed boundary (smaller, for 'double dashed' look) */}
      <Polyline
        positions={innerOutline}
        pathOptions={{
          color: "#ffffff",
          weight: 1,
          opacity: 0.9,
          dashArray: "6,8",
        }}
      />

      {/* center dashed path */}
      <Polyline
        positions={centerTrack}
        pathOptions={{
          color: "#ffffff",
          weight: 2,
          opacity: 0.9,
          dashArray: "2,10", // small dots to look like central dotted track
        }}
      />

      {/* animated marker (pulsing) & main circle */}
      <Marker
        position={[animatedPosition.lat, animatedPosition.lng]}
        icon={PulsingDivIcon(animatedPosition.category)}
      />

      <CircleMarker
        center={[animatedPosition.lat, animatedPosition.lng]}
        radius={isActive ? 12 : 10}
        pathOptions={{
          fillColor: getCategoryColor(animatedPosition.category),
          color: "#fff",
          weight: isActive ? 3 : 2,
          fillOpacity: 1,
        }}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-bold text-lg">{storm.nameVi}</h3>
            <p>
              <strong>Thời gian:</strong>{" "}
              {new Date(animatedPosition.timestamp).toLocaleString("vi-VN")}
            </p>
            <p>
              <strong>Vị trí:</strong> {animatedPosition.lat.toFixed(2)}°,{" "}
              {animatedPosition.lng.toFixed(2)}°
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
