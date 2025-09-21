import { CloudRain, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { Card, CardContent } from '../components/ui/card';
import WeeklyForecast from '../components/WeeklyForecast';

export default function ForecastPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-[100] dark:bg-gray-950/80 dark:border-gray-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <CloudRain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Dự báo thời tiết 7 ngày
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Thông tin dự báo chi tiết
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg">
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Quay lại bản đồ</span>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <WeeklyForecast />
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 relative z-10 dark:bg-gray-950/80 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            © 2024 Dự báo Bão Việt Nam. Dữ liệu mô phỏng cho mục đích demo.
          </p>
        </div>
      </footer>
    </div>
  );
}