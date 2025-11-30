import { type LayerType } from './WeatherLayerControl';
import { WindyModeToggle } from './storm/WindyModeToggle';

interface WeatherLayerControlPanelProps {
  activeLayer: LayerType;
  onLayerChange: (layer: LayerType) => void;
  opacity: number;
  onOpacityChange: (value: number) => void;
  showTemperatureAnimation: boolean;
  onTemperatureAnimationChange: (value: boolean) => void;
  isWindyMode?: boolean;
  onWindyModeChange?: (value: boolean) => void;
}

export default function WeatherLayerControlPanel({
  activeLayer,
  onLayerChange,
  opacity,
  onOpacityChange,
  showTemperatureAnimation,
  onTemperatureAnimationChange,
  isWindyMode = false,
  onWindyModeChange,
}: WeatherLayerControlPanelProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium mb-1">Chọn lớp phủ</p>
        <div className="grid grid-cols-2 gap-1">
          {(['none', 'satellite', 'radar', 'temperature', 'wind'] as LayerType[]).map((layer) => (
            <button
              key={layer}
              onClick={() => onLayerChange(layer)}
              className={`px-2 py-1 text-xs rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                activeLayer === layer
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              aria-label={`Select ${layer} layer`}
              aria-pressed={activeLayer === layer}
            >
              {layer === 'none' && 'Mặc định'}
              {layer === 'satellite' && 'Vệ tinh'}
              {layer === 'radar' && 'Radar'}
              {layer === 'temperature' && 'Nhiệt độ'}
              {layer === 'wind' && 'Gió'}
            </button>
          ))}
        </div>
      </div>

      {activeLayer !== 'none' && (
        <div>
          <p className="text-xs font-medium mb-1">Độ trong suốt</p>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            aria-label="Layer opacity"
          />
          <span className="text-xs text-gray-600">{(opacity * 100).toFixed(0)}%</span>
        </div>
      )}

      {activeLayer === 'temperature' && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="temp-animation"
            checked={showTemperatureAnimation}
            onChange={(e) => onTemperatureAnimationChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          />
          <label htmlFor="temp-animation" className="text-xs cursor-pointer">
            Hiệu ứng động
          </label>
        </div>
      )}

      {/* Windy Mode Toggle */}
      {onWindyModeChange && (
        <div className="pt-2 border-t border-gray-300">
          <WindyModeToggle
            isWindyMode={isWindyMode}
            onToggle={onWindyModeChange}
          />
        </div>
      )}
    </div>
  );
}