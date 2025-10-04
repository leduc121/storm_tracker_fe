import { MapPin, Wind, Thermometer, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { getCategoryColor, type Storm, type StormPoint } from '../lib/stormData';
import { Card, CardContent } from './ui/card';

interface StormInfoProps {
  storm: Storm;
}

function WeatherIcon({ category }: { category: string }) {
  const color = getCategoryColor(category);
  return (
    <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
      <div className="w-6 h-6 rounded-full border-2 border-black" style={{ backgroundColor: color }}></div>
    </div>
  );
}

function StormDetailsCard({ title, icon, value, unit, color }: {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  unit: string;
  color: string;
}) {
  return (
    <Card className="flex flex-col items-center justify-center p-4 text-center">
      <div className="flex items-center gap-2 mb-2" style={{ color: color }}>
        {icon}
        <h5 className="text-sm font-semibold">{title}</h5>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{unit}</p>
    </Card>
  );
}

function ForecastPoint({ point, isFirst }: { point: StormPoint, isFirst: boolean }) {
  return (
    <div className="relative pl-6">
      {!isFirst && <div className="absolute top-0 left-3 h-full w-0.5 bg-gray-200 dark:bg-gray-700"></div>}
      <div className="relative z-10 flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <WeatherIcon category={point.category} />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{new Date(point.timestamp).toLocaleString('vi-VN')}</p>
          <p className="text-sm text-muted-foreground">Vị trí: {point.lat}°N, {point.lng}°E</p>
          <div className="flex items-center gap-4 text-sm mt-1">
            <p className="flex items-center gap-1"><Wind className="h-4 w-4" /> {point.windSpeed} km/h</p>
            <p className="flex items-center gap-1"><Thermometer className="h-4 w-4" /> {point.pressure} hPa</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StormInfo({ storm }: StormInfoProps) {
  const currentPos = storm.currentPosition;
  const forecast = storm.forecast;

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold">{storm.nameVi}</h3>
        <p className="text-sm text-muted-foreground">Cập nhật: {new Date(storm.lastPointTime).toLocaleString('vi-VN')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StormDetailsCard
          title="Tốc độ gió"
          icon={<Wind className="h-4 w-4" />}
          value={currentPos.windSpeed}
          unit="km/h"
          color="hsl(var(--primary))"
        />
        <StormDetailsCard
          title="Áp suất"
          icon={<Thermometer className="h-4 w-4" />}
          value={currentPos.pressure}
          unit="hPa"
          color="hsl(var(--primary))"
        />
      </div>

      <div className="space-y-4">
        <h4 className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Thông tin chi tiết
        </h4>
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <p><strong>Vị trí:</strong> {currentPos.lat.toFixed(2)}°N, {currentPos.lng.toFixed(2)}°E</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full border-2 border-black" style={{ backgroundColor: getCategoryColor(currentPos.category) }}></span>
              <p><strong>Cấp độ:</strong> {currentPos.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <p><strong>Thời gian:</strong> {new Date(currentPos.timestamp).toLocaleString('vi-VN')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h4 className="flex items-center gap-2 font-semibold">
          <TrendingUp className="h-5 w-5 text-red-500" />
          Dự báo đường đi
        </h4>
        <div className="space-y-6">
          {forecast.map((point, index) => (
            <ForecastPoint key={index} point={point} isFirst={index === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}