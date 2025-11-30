import { useEffect, useState } from 'react';
import { CloudRain, Satellite, AlertTriangle, X, Eye, ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { type Storm } from '../lib/stormData';
import StormTracker from '../components/StormTracker';
import { Card, CardContent } from '../components/ui/card';
import WeatherMap from '../components/WeatherMap';
import StormInfo from '../components/StormInfo';
import { ThemeToggle } from '../components/ThemeToggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { StormPredictionForm } from "../components/StormPredictionForm";
import { latLngBounds, type LatLngBounds } from 'leaflet';
import TimelineSlider from '../components/timeline/TimelineSlider';
import { useTimelineState } from '../hooks/useTimelineState';
import { useTimelineSync } from '../hooks/useWindyStateSync';

export default function Index() {
  const [selectedStorm, setSelectedStorm] = useState<Storm | undefined>(undefined);
  const [storms, setStorms] = useState<Storm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  const [customPrediction, setCustomPrediction] = useState<[number, number][] | null>(null);
  const [mapFocusBounds, setMapFocusBounds] = useState<LatLngBounds | null>(null);

  // Timeline state management with global state sync
  // Requirements: 2.3 - Ensure timeline and storm positions stay in sync
  const timelineSync = useTimelineSync();
  const {
    filteredStorms,
  } = useTimelineState(storms);
  
  // Use synchronized state from global context
  const currentTime = timelineSync.currentTime;
  const setCurrentTime = timelineSync.setCurrentTime;
  const isPlaying = timelineSync.isPlaying;
  const setIsPlaying = timelineSync.setIsPlaying;
  const playbackSpeed = timelineSync.playbackSpeed;
  const setPlaybackSpeed = timelineSync.setPlaybackSpeed;

  // ✅ TẢI DỮ LIỆU - ĐÃ SỬA LỖI
  useEffect(() => {
    setLoading(true);
    setError(null);

    const GET_STORMS_API_URL = "https://meadow-proexperiment-tobie.ngrok-free.dev/get-recent-storms";

    fetch(GET_STORMS_API_URL, {
      headers: {
        'ngrok-skip-browser-warning': 'true', // ✅ Bypass cảnh báo Ngrok
      }
    })
      .then((res: Response) => {
        console.log("📡 Response status:", res.status);
        console.log("📡 Content-Type:", res.headers.get('content-type'));
        
        if (!res.ok) {
          throw new Error(`Lỗi ${res.status}: ${res.statusText}`);
        }
        
        // ✅ Kiểm tra Content-Type
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return res.text().then(text => {
            console.error("❌ Server trả về HTML:", text.substring(0, 500));
            throw new Error('Server trả về HTML thay vì JSON. Kiểm tra Ngrok hoặc backend!');
          });
        }
        
        return res.json();
      })
      .then((data: Storm[]) => {
        console.log("✅ Đã tải thành công các cơn bão từ Kaggle:", data);
        console.log("✅ Số lượng bão:", data?.length);
        
        // ✅ Validation
        if (!Array.isArray(data)) {
          console.error("❌ Dữ liệu không phải array:", data);
          setStorms([]);
        } else {
          setStorms(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("❌ Lỗi khi fetch /get-recent-storms:", err);
        setError(err.message || "Không thể tải danh sách bão từ server.");
        setLoading(false);
      });
  }, []);

  // DỰ ĐOÁN
  const handlePredictionResult = (predictionData: any[]) => {
    const newPath: [number, number][] = predictionData.map((p) => [
      parseFloat(p.lat),
      parseFloat(p.lng),
    ] as [number, number]);

    setCustomPrediction(newPath);

    if (newPath.length > 0) {
      const bounds = latLngBounds(newPath);
      setMapFocusBounds(bounds);
    }

    setShowSidebar(false);
  };

  // GIAO DIỆN
  const handleStormSelect = (storm: Storm) => {
    setSelectedStorm(storm);
    setIsPlayingAll(false);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
    setSelectedStorm(undefined);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
    if (showSidebar) setSelectedStorm(undefined);
  };

  const handleBackToList = () => setSelectedStorm(undefined);
  const handlePlayAll = () => {
    setIsPlayingAll(true);
    setSelectedStorm(undefined);
    setShowSidebar(false);
  };
  const handleReset = () => setIsPlayingAll(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-xl font-semibold">Đang tải dữ liệu bão từ server...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Skip Links for Keyboard Navigation - WCAG 2.1 Level AA */}
      <a 
        href="#main-content"
        className="absolute left-[-9999px] top-0 z-[2000] bg-blue-600 text-white px-4 py-2 rounded shadow-lg focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      <a 
        href="#storm-tracker-section"
        className="absolute left-[-9999px] top-0 z-[2000] bg-blue-600 text-white px-4 py-2 rounded shadow-lg focus:left-48 focus:top-4"
      >
        Skip to storm tracker
      </a>
      <a 
        href="#timeline-controls"
        className="absolute left-[-9999px] top-0 z-[2000] bg-blue-600 text-white px-4 py-2 rounded shadow-lg focus:left-96 focus:top-4"
      >
        Skip to timeline controls
      </a>

      {/* HEADER */}
      <header 
        id="main-header"
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-[100] dark:bg-gray-950/80 dark:border-gray-800"
        role="banner"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <CloudRain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Dự báo Bão Việt Nam
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Theo dõi và dự báo hướng đi của bão tại Việt Nam và Biển Đông
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                aria-label={showSidebar ? "Close storm tracker sidebar" : "Open storm tracker sidebar"}
                aria-expanded={showSidebar}
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Theo dõi bão</span>
              </button>
              <ThemeToggle />
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Satellite className="h-4 w-4" />
                <span>Cập nhật: {new Date().toLocaleString('vi-VN')}</span>
              </div>
              {storms.some(s => s.status === 'active') && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm dark:bg-red-900 dark:text-red-300">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Cảnh báo bão</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* BẢN ĐỒ */}
      <main 
        id="main-content"
        className="relative h-[calc(100vh-120px)] overflow-hidden"
        role="main"
        aria-label="Storm tracking map"
      >
        <div className="absolute inset-0 z-10">
          <Card className="h-full border-0 rounded-none dark:bg-gray-900">
            <CardContent className="p-0 h-full relative">
              <WeatherMap
                storms={storms}
                selectedStorm={selectedStorm}
                isPlayingAll={false}
                customPredictionPath={customPrediction}
                mapFocusBounds={mapFocusBounds}
                onMapFocusComplete={() => setMapFocusBounds(null)}
              />


            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR */}
        {showSidebar && (
          <div 
            id="storm-tracker-section"
            className="absolute top-0 right-0 w-96 h-full bg-white dark:bg-gray-900 shadow-2xl z-[1001] overflow-hidden flex flex-col"
            role="complementary"
            aria-label="Storm tracker sidebar"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-bold dark:text-gray-100" id="sidebar-heading">
                {selectedStorm ? 'Chi tiết bão' : 'Danh sách bão'}
              </h2>
              <button
                onClick={closeSidebar}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                aria-label="Close storm tracker sidebar"
              >
                <X className="h-5 w-5 dark:text-gray-400" />
              </button>
            </div>

            <Tabs defaultValue="storms" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mx-4 mt-2">
                <TabsTrigger value="storms">Bão hiện tại</TabsTrigger>
                <TabsTrigger value="predict">Dự đoán</TabsTrigger>
              </TabsList>

              <TabsContent value="storms" className="flex-1 overflow-hidden mt-2">
                {selectedStorm ? (
                  <div className="h-full flex flex-col">
                    <button
                      onClick={handleBackToList}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                      aria-label="Back to storm list"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Quay lại danh sách
                    </button>
                    <div className="flex-1 overflow-auto">
                      <StormInfo storm={selectedStorm} />
                    </div>
                  </div>
                ) : (
                  <div className="h-full overflow-auto">
                    <StormTracker
                      storms={storms}
                      onStormSelect={handleStormSelect}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="predict" className="flex-1 overflow-hidden mt-2">
                <StormPredictionForm
                  onPredictionResult={handlePredictionResult}
                  setIsLoading={setLoading}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer 
        className="bg-white/80 backdrop-blur-sm border-t border-gray-200 relative z-10 dark:bg-gray-950/80 dark:border-gray-800"
        role="contentinfo"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div><p>© 2025 Dự báo Bão Việt Nam. Dữ liệu mô phỏng cho mục đích demo.</p></div>
            <div className="flex items-center gap-4">
              <span>Nguồn dữ liệu: NCICS (Live)</span>
              <span>Cập nhật: Tải lại trang</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}