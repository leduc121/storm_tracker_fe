import { Wind, Gauge, MapPin, Clock, TrendingUp, AlertTriangle, Badge } from 'lucide-react';
import { getCategoryColor, getCategoryName, type Storm } from '../lib/stormData';
import { calculateBearing, calculateDistance, getDirectionName } from '../lib/mapUtils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';

interface StormInfoProps {
  storm: Storm;
}

export default function StormInfo({ storm }: StormInfoProps) {
  const currentPos = storm.currentPosition;
  const nextForecast = storm.forecast[0];
  
  // Tính toán hướng và tốc độ di chuyển
  const bearing = nextForecast ? calculateBearing(
    currentPos.lat, currentPos.lng,
    nextForecast.lat, nextForecast.lng
  ) : 0;
  
  const distance = nextForecast ? calculateDistance(
    currentPos.lat, currentPos.lng,
    nextForecast.lat, nextForecast.lng
  ) : 0;
  
  const direction = getDirectionName(bearing);
  const speed = nextForecast ? Math.round(distance / 24) : 0; // km/h (giả sử 24h)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'weakening': return 'secondary';
      case 'dissipated': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Đang hoạt động';
      case 'weakening': return 'Đang suy yếu';
      case 'dissipated': return 'Đã tan';
      default: return 'Không xác định';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">{storm.nameVi}</CardTitle>
          <Badge fontVariant={getStatusColor(storm.status)}>
            {getStatusText(storm.status)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Cập nhật: {new Date(currentPos.timestamp).toLocaleString('vi-VN')}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Thông tin vị trí hiện tại */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-500" />
            <span className="font-semibold">Vị trí hiện tại</span>
          </div>
          <div className="pl-6 space-y-1 text-sm">
            <p>Vĩ độ: {currentPos.lat.toFixed(2)}°N</p>
            <p>Kinh độ: {currentPos.lng.toFixed(2)}°E</p>
          </div>
        </div>

        <Separator />

        {/* Thông tin cường độ */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Tốc độ gió</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {currentPos.windSpeed}
              <span className="text-sm font-normal ml-1">km/h</span>
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Áp suất</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {currentPos.pressure}
              <span className="text-sm font-normal ml-1">hPa</span>
            </p>
          </div>
        </div>

        {/* Cấp độ bão */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" style={{ color: getCategoryColor(currentPos.category) }} />
            <span className="text-sm font-medium">Cấp độ</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: getCategoryColor(currentPos.category) }}
            />
            <span className="font-semibold">{getCategoryName(currentPos.category)}</span>
          </div>
        </div>

        <Separator />

        {/* Hướng di chuyển */}
        {nextForecast && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="font-semibold">Hướng di chuyển dự kiến</span>
            </div>
            <div className="pl-6 space-y-1 text-sm">
              <p>Hướng: <span className="font-medium">{direction}</span></p>
              <p>Tốc độ: <span className="font-medium">{speed} km/h</span></p>
            </div>
          </div>
        )}

        {/* Dự báo tiếp theo */}
        {nextForecast && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <span className="font-semibold">Dự báo tiếp theo</span>
              </div>
              <div className="pl-6 space-y-1 text-sm">
                <p>Thời gian: {new Date(nextForecast.timestamp).toLocaleString('vi-VN')}</p>
                <p>Vị trí: {nextForecast.lat.toFixed(1)}°N, {nextForecast.lng.toFixed(1)}°E</p>
                <p>Tốc độ gió: {nextForecast.windSpeed} km/h</p>
                <p>Áp suất: {nextForecast.pressure} hPa</p>
                <p>Cấp độ: {getCategoryName(nextForecast.category)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}