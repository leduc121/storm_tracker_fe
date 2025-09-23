import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-velocity';
import 'leaflet-velocity/dist/leaflet-velocity.css';
import { mockWindData } from '../lib/windData';

interface VelocityLayerProps {
  options?: any;
}

const WindyLayer = ({ options }: VelocityLayerProps) => {
  const map = useMap();
  let layer: L.Layer;

  useEffect(() => {
    if (map) {
      // @ts-ignore: leaflet-velocity type is not fully compatible with leaflet v4
      layer = L.velocityLayer({
        displayValues: true,
        displayOptions: {
          velocityType: 'Wind',
          position: 'bottomleft',
          emptyString: 'Không có dữ liệu gió',
        },
        ...options,
        data: mockWindData,
      }).addTo(map);
    }
    
    return () => {
      if (layer) {
        map.removeLayer(layer);
      }
    };
  }, [map, options]);

  return null;
};

export default WindyLayer;