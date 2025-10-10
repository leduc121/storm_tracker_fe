import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { CloudRain, Satellite, AlertTriangle, X, Eye, ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { type Storm, type StormPoint } from '../lib/stormData';
import StormTracker from '../components/StormTracker';
import { Card, CardContent } from '../components/ui/card';
import WeatherMap from '../components/WeatherMap';
import StormInfo from '../components/StormInfo';
import { ThemeToggle } from '../components/ThemeToggle';

// Khởi tạo Web Worker
// Sử dụng new URL và import.meta.url để trỏ đến file Worker (môi trường React hiện đại sẽ tự động biên dịch .ts này)
const dataWorker = new Worker(new URL('../lib/dataWorker.ts', import.meta.url));

export default function Index() {
  const [selectedStorm, setSelectedStorm] = useState<Storm | undefined>(undefined);
  const [storms, setStorms] = useState<Storm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  useEffect(() => {
    // Thiết lập lắng nghe kết quả từ Web Worker
    dataWorker.onmessage = (event) => {
      const { status, data, message } = event.data;
      if (status === 'success') {
        setStorms(data);
        setLoading(false);
      } else {
        console.error("Worker Error:", message);
        setError("Lỗi xử lý dữ liệu bão ở nền.");
        setLoading(false);
      }
    };

    // 1. Dùng PapaParse để tải và phân tích cú pháp CSV
    Papa.parse("/storm_data_cleaned.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      // KHÔNG dùng worker: true ở đây vì worker không thể gọi worker khác.
      complete: (results: any) => { 
        // 2. Gửi dữ liệu thô (sau khi parse) đến Worker để xử lý logic nặng
        dataWorker.postMessage(results.data);
      },
      error: (e) => { 
        setError("Không thể tải file dữ liệu. Đảm bảo file nằm trong thư mục public.");
        setLoading(false);
      },
    });

    return () => {
      // Dọn dẹp Worker khi component bị hủy
      dataWorker.terminate();
    };
  }, []);

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
    if (showSidebar) {
        setSelectedStorm(undefined);
    }
  };
  
  const handleBackToList = () => {
      setSelectedStorm(undefined);
  };

  const handlePlayAll = () => {
    setIsPlayingAll(true);    
    setSelectedStorm(undefined);
    setShowSidebar(false);
  };

  const handleReset = () => {
    setIsPlayingAll(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-xl font-semibold">Đang tải và xử lý dữ liệu bão ở nền...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-[100] dark:bg-gray-950/80 dark:border-gray-800">
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
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg"
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

      <div className="relative h-[calc(100vh-120px)] overflow-hidden">
        <div className="absolute inset-0 z-10">
          <Card className="h-full border-0 rounded-none dark:bg-gray-900">
            <CardContent className="p-0 h-full relative">
              <WeatherMap
                storms={storms}
                selectedStorm={selectedStorm}
                isPlayingAll={isPlayingAll}
              />
              
              <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm rounded-lg p-3 dark:bg-gray-900/90">
                <div className="flex items-center gap-2 text-sm dark:text-gray-100">
                  <Satellite className="h-4 w-4 text-blue-600" />
                  <span>Khu vực Việt Nam và Biển Đông</span>
                </div>
              </div>

              <div className="absolute top-4 right-4 z-[1000]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlayAll}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors shadow-lg ${isPlayingAll ? 'bg-blue-800 hover:bg-blue-900' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                  >
                    <Play className="h-4 w-4" />
                    Phát
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors shadow-lg"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </button>
                </div>
              </div>
              
            </CardContent>
          </Card>
        </div>

        <div className={`absolute top-0 right-0 h-full w-96 z-40 transform transition-transform duration-300 ease-in-out ${
          showSidebar ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="h-full bg-white/95 backdrop-blur-md border-l border-gray-200 dark:bg-gray-900/95 dark:border-gray-700 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                {selectedStorm ? (
                    <button 
                        onClick={handleBackToList} 
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors mr-2"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                ) : (
                    <div className="w-9" />
                )}
                <h3 className="flex-1 text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {selectedStorm ? (
                        <>
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            Thông tin chi tiết bão
                        </>
                    ) : (
                        <>
                            <Eye className="h-5 w-5 text-blue-600" />
                            Theo dõi bão
                        </>
                    )}
                </h3>
                <button 
                    onClick={closeSidebar}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <div 
                className={`absolute inset-0 transition-transform duration-300 ease-in-out flex flex-col ${
                  selectedStorm ? '-translate-x-full' : 'translate-x-0'
                }`}
              >
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <StormTracker
                    storms={storms}
                    selectedStorm={selectedStorm}
                    onStormSelect={handleStormSelect}
                  />
                </div>
              </div>
              <div 
                className={`absolute inset-0 transition-transform duration-300 ease-in-out flex flex-col ${
                  selectedStorm ? 'translate-x-0' : 'translate-x-full'
                }`}
              >
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {selectedStorm && (
                    <div className="p-4">
                      <StormInfo storm={selectedStorm} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={toggleSidebar}
          className="absolute top-1/2 right-4 -translate-y-1/2 z-30 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 group"
        >
          <Eye className="h-5 w-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>
      
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 relative z-10 dark:bg-gray-950/80 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              <p>© 2025 Dự báo Bão Việt Nam. Dữ liệu mô phỏng cho mục đích demo.</p>
            </div>
            <div className="flex items-center gap-4">
              <span>Nguồn dữ liệu: Mô phỏng</span>
              <span>Cập nhật: 15 phút/lần</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}