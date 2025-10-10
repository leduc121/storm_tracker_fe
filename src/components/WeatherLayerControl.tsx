import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export type LayerType = 'none' | 'satellite' | 'temperature' | 'radar' | 'wind';

interface WeatherLayerControlProps {
    type: LayerType;
    opacity?: number;
}

// Đọc API Key (Giả sử bạn dùng Key OWM cho các dịch vụ khác)
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY; 

// Base URL của MeteoMatics (hoặc OpenWeatherMap cho các lớp cơ bản)
const METEO_BASE_URL = 'https://api.meteomatics.com/2024-06-12T00:00:00Z/';
const OWM_BASE_URL = 'https://tile.openweathermap.org/map/';


export default function WeatherLayerControl({ type, opacity = 0.8 }: WeatherLayerControlProps) {
    const map = useMap();
    const [apiError, setApiError] = useState(false);

    useEffect(() => {
        setApiError(false);
        
        map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                // Chỉ xóa các lớp dữ liệu thời tiết
                if (layer.options.attribution?.includes('Weather') || layer.options.attribution?.includes('RainViewer') || layer.options.attribution?.includes('MeteoMatics')) {
                    map.removeLayer(layer);
                }
            }
        });

        if (type === 'none' || type === 'wind') return;

        let tileLayer: L.TileLayer | null = null;
        let tileUrl = '';
        let attribution = '';
        
        const layerOptions: L.TileLayerOptions = {
            opacity: opacity,
            maxZoom: 10,
            zIndex: 500,
            errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 
        };

        if (API_KEY) {
            switch (type) {
                case 'satellite':
                    // Sử dụng lớp Mây (Cloud) của OWM (ổn định)
                    tileUrl = `${OWM_BASE_URL}clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`;
                    attribution = '© OpenWeatherMap';
                    break;
                    
                case 'temperature':
                    // Sử dụng lớp Nhiệt độ (Temp) của OWM
                    tileUrl = `${OWM_BASE_URL}temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`;
                    attribution = '© OpenWeatherMap';
                    break;
                    
                case 'radar':
                    // Sử dụng RainViewer cho Radar (chất lượng tốt và miễn phí)
                    tileUrl = 'https://tilecache.rainviewer.com/v2/radar/{z}/{x}/{y}/4/1_1.png';
                    attribution = '© RainViewer';
                    break;
                default:
                    break;
            }
            
            if (tileUrl && attribution) {
                tileLayer = L.tileLayer(
                    tileUrl,
                    { ...layerOptions, attribution: attribution }
                );
                
                // Bắt lỗi tải tile
                tileLayer.on('tileerror', () => {
                    console.error(`ERROR: Layer ${type} failed to load from ${attribution}.`);
                    setApiError(true);
                    
                    if (tileLayer) map.removeLayer(tileLayer); 
                    
                    // Fallback cho Satellite/Radar nếu OWM lỗi
                    if (type === 'radar' || type === 'satellite') {
                         L.tileLayer(
                            'https://tilecache.rainviewer.com/v2/radar/{z}/{x}/{y}/4/1_1.png',
                            { opacity: opacity, attribution: '© RainViewer', maxZoom: 10, zIndex: 500 }
                        ).addTo(map);
                    }
                });
            }
        }
        
        // --- Fallback chính cho Radar/Satellite nếu không có API Key hoặc bị lỗi ---
        if (!tileLayer && (type === 'radar' || type === 'satellite')) {
             tileLayer = L.tileLayer(
                'https://tilecache.rainviewer.com/v2/radar/{z}/{x}/{y}/4/1_1.png',
                { opacity: opacity, attribution: '© RainViewer', maxZoom: 10, zIndex: 500 }
            );
        }

        if (tileLayer) {
            tileLayer.addTo(map);
        }

        return () => {
            if (tileLayer) {
                map.removeLayer(tileLayer);
            }
        };
    }, [map, type, opacity, API_KEY]);

    return null;
}