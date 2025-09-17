export interface StormPoint {
  lat: number;
  lng: number;
  timestamp: string;
  windSpeed: number; // km/h
  pressure: number; // hPa
  category: number; // 1-5
}

export interface Storm {
  id: string;
  name: string;
  nameVi: string;
  status: 'active' | 'weakening' | 'dissipated';
  currentPosition: StormPoint;
  forecast: StormPoint[];
  historical: StormPoint[];
}

// Mock data cho bão mẫu với nhiều điểm hơn để animation mượt hơn
export const mockStorms: Storm[] = [
  {
    id: 'yagi-2024',
    name: 'Yagi',
    nameVi: 'Bão Yagi',
    status: 'active',
    currentPosition: {
      lat: 18.5,
      lng: 108.2,
      timestamp: '2024-09-15T12:00:00Z',
      windSpeed: 150,
      pressure: 950,
      category: 4
    },
    historical: [
      { lat: 14.8, lng: 118.2, timestamp: '2024-09-11T00:00:00Z', windSpeed: 65, pressure: 995, category: 0 },
      { lat: 15.0, lng: 117.1, timestamp: '2024-09-11T06:00:00Z', windSpeed: 75, pressure: 990, category: 1 },
      { lat: 15.2, lng: 115.8, timestamp: '2024-09-12T00:00:00Z', windSpeed: 85, pressure: 985, category: 1 },
      { lat: 15.5, lng: 114.9, timestamp: '2024-09-12T06:00:00Z', windSpeed: 95, pressure: 980, category: 1 },
      { lat: 15.8, lng: 114.1, timestamp: '2024-09-12T12:00:00Z', windSpeed: 105, pressure: 975, category: 2 },
      { lat: 16.1, lng: 113.4, timestamp: '2024-09-13T00:00:00Z', windSpeed: 120, pressure: 970, category: 2 },
      { lat: 16.5, lng: 112.5, timestamp: '2024-09-13T06:00:00Z', windSpeed: 130, pressure: 965, category: 3 },
      { lat: 16.9, lng: 111.7, timestamp: '2024-09-13T12:00:00Z', windSpeed: 135, pressure: 962, category: 3 },
      { lat: 17.3, lng: 110.8, timestamp: '2024-09-14T00:00:00Z', windSpeed: 140, pressure: 960, category: 3 },
      { lat: 17.7, lng: 109.9, timestamp: '2024-09-14T06:00:00Z', windSpeed: 145, pressure: 955, category: 4 },
      { lat: 18.1, lng: 109.1, timestamp: '2024-09-14T12:00:00Z', windSpeed: 148, pressure: 952, category: 4 }
    ],
    forecast: [
      { lat: 18.8, lng: 107.5, timestamp: '2024-09-15T18:00:00Z', windSpeed: 145, pressure: 955, category: 4 },
      { lat: 19.2, lng: 106.5, timestamp: '2024-09-16T00:00:00Z', windSpeed: 140, pressure: 960, category: 3 },
      { lat: 19.6, lng: 105.8, timestamp: '2024-09-16T06:00:00Z', windSpeed: 135, pressure: 965, category: 3 },
      { lat: 20.0, lng: 105.4, timestamp: '2024-09-16T12:00:00Z', windSpeed: 130, pressure: 970, category: 3 },
      { lat: 20.1, lng: 105.2, timestamp: '2024-09-17T00:00:00Z', windSpeed: 120, pressure: 975, category: 2 },
      { lat: 20.4, lng: 105.0, timestamp: '2024-09-17T06:00:00Z', windSpeed: 110, pressure: 980, category: 2 },
      { lat: 20.7, lng: 104.9, timestamp: '2024-09-17T12:00:00Z', windSpeed: 95, pressure: 985, category: 1 },
      { lat: 21.0, lng: 104.8, timestamp: '2024-09-18T00:00:00Z', windSpeed: 85, pressure: 990, category: 1 },
      { lat: 21.3, lng: 104.7, timestamp: '2024-09-18T06:00:00Z', windSpeed: 70, pressure: 995, category: 0 },
      { lat: 21.5, lng: 104.5, timestamp: '2024-09-19T00:00:00Z', windSpeed: 60, pressure: 1000, category: 0 }
    ]
  },
  {
    id: 'soulik-2024',
    name: 'Soulik',
    nameVi: 'Bão Soulik',
    status: 'weakening',
    currentPosition: {
      lat: 12.8,
      lng: 118.5,
      timestamp: '2024-09-15T12:00:00Z',
      windSpeed: 95,
      pressure: 980,
      category: 1
    },
    historical: [
      { lat: 10.2, lng: 126.8, timestamp: '2024-09-12T00:00:00Z', windSpeed: 85, pressure: 985, category: 1 },
      { lat: 10.5, lng: 125.2, timestamp: '2024-09-13T00:00:00Z', windSpeed: 110, pressure: 975, category: 2 },
      { lat: 11.0, lng: 123.8, timestamp: '2024-09-13T12:00:00Z', windSpeed: 108, pressure: 976, category: 2 },
      { lat: 11.5, lng: 122.5, timestamp: '2024-09-14T00:00:00Z', windSpeed: 107, pressure: 977, category: 2 },
      { lat: 11.8, lng: 121.8, timestamp: '2024-09-14T12:00:00Z', windSpeed: 105, pressure: 978, category: 1 },
      { lat: 12.2, lng: 120.5, timestamp: '2024-09-15T00:00:00Z', windSpeed: 100, pressure: 979, category: 1 }
    ],
    forecast: [
      { lat: 13.0, lng: 117.2, timestamp: '2024-09-15T18:00:00Z', windSpeed: 90, pressure: 982, category: 1 },
      { lat: 13.5, lng: 116.2, timestamp: '2024-09-16T00:00:00Z', windSpeed: 85, pressure: 985, category: 1 },
      { lat: 13.8, lng: 115.5, timestamp: '2024-09-16T06:00:00Z', windSpeed: 80, pressure: 988, category: 1 },
      { lat: 14.0, lng: 115.0, timestamp: '2024-09-16T12:00:00Z', windSpeed: 75, pressure: 992, category: 0 },
      { lat: 14.2, lng: 114.8, timestamp: '2024-09-17T00:00:00Z', windSpeed: 70, pressure: 995, category: 0 }
    ]
  }
];

export const getCategoryColor = (category: number): string => {
  switch (category) {
    case 0: return '#00ff00'; // Áp thấp nhiệt đới
    case 1: return '#ffff00'; // Bão cấp 1
    case 2: return '#ffa500'; // Bão cấp 2  
    case 3: return '#ff4500'; // Bão cấp 3
    case 4: return '#ff0000'; // Bão cấp 4
    case 5: return '#8b0000'; // Bão cấp 5
    default: return '#808080';
  }
};

export const getCategoryName = (category: number): string => {
  switch (category) {
    case 0: return 'Áp thấp nhiệt đới';
    case 1: return 'Bão cấp 1';
    case 2: return 'Bão cấp 2';
    case 3: return 'Bão cấp 3';
    case 4: return 'Bão cấp 4';
    case 5: return 'Bão cấp 5';
    default: return 'Không xác định';
  }
};