import { Eye, Wind, MapPin, Badge } from 'lucide-react';
import { getCategoryColor, getCategoryName, type Storm } from '../lib/stormData';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface StormTrackerProps {
  storms: Storm[];
  selectedStorm?: Storm;
  onStormSelect: (storm: Storm) => void;
}

export default function StormTracker({ storms, selectedStorm, onStormSelect }: StormTrackerProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Theo dõi bão
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {storms.length} cơn bão đang được theo dõi
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {storms.map((storm) => (
          <div
            key={storm.id}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedStorm?.id === storm.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => onStormSelect(storm)}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg">{storm.nameVi}</h3>
                <p className="text-sm text-muted-foreground">{storm.name}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge 
                  fontVariant={storm.status === 'active' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {storm.status === 'active' ? 'Hoạt động' : 'Suy yếu'}
                </Badge>
                <div 
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: getCategoryColor(storm.currentPosition.category) }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gray-500" />
                <span>{storm.currentPosition.lat.toFixed(1)}°N</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="h-3 w-3 text-blue-500" />
                <span>{storm.currentPosition.windSpeed} km/h</span>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground">
              <p>{getCategoryName(storm.currentPosition.category)}</p>
              <p>Áp suất: {storm.currentPosition.pressure} hPa</p>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-muted-foreground">
                Cập nhật: {new Date(storm.currentPosition.timestamp).toLocaleString('vi-VN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}
        
        {storms.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Hiện tại không có bão nào đang được theo dõi</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}