import { useState } from 'react';

import { CloudRain, Satellite, AlertTriangle } from 'lucide-react';
import { mockStorms, type Storm } from '../lib/stormData';
import StormTracker from '../components/StormTracker';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import WeatherMap from '../components/WeatherMap';
import StormInfo from '../components/StormInfo';
import { ThemeToggle } from '../components/ThemeToggle';

export default function Index() {
  const [selectedStorm, setSelectedStorm] = useState<Storm | undefined>(mockStorms[0]);
  const [storms] = useState<Storm[]>(mockStorms);

  const handleStormSelect = (storm: Storm) => {
    setSelectedStorm(storm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 dark:bg-gray-950/80 dark:border-gray-800">
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
          {/* Sidebar trái - Danh sách bão */}
          <div className="lg:col-span-1">
            <StormTracker
              storms={storms}
              selectedStorm={selectedStorm}
              onStormSelect={handleStormSelect}
            />
          </div>

          {/* Main Map */}
          <div className="lg:col-span-2">
            <Card className="h-full dark:bg-gray-900 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                  <Satellite className="h-5 w-5 text-blue-600" />
                  Bản đồ theo dõi bão
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Khu vực Việt Nam và Biển Đông
                </p>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-80px)]">
                <WeatherMap 
                  storms={storms} 
                  selectedStorm={selectedStorm}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar phải - Thông tin chi tiết */}
          <div className="lg:col-span-1">
            {selectedStorm ? (
              <StormInfo storm={selectedStorm} />
            ) : (
              <Card className="h-full dark:bg-gray-900 dark:border-gray-700">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <CloudRain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Chọn một cơn bão để xem thông tin chi tiết</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-8 dark:bg-gray-950/80 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              <p>© 2024 Dự báo Bão Việt Nam. Dữ liệu mô phỏng cho mục đích demo.</p>
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