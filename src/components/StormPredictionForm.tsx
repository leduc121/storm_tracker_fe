import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "./ui/use-toast";
import { Trash2, Plus } from "lucide-react";

// ✅ Export interface
export interface StormDataRow {
  id: string;
  datetime: string;
  latitude: string;
  longitude: string;
  windspeed: string;
  pressure: string;
}

interface StormPredictionFormProps {
  onPredictionResult: (data: any[]) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const StormPredictionForm: React.FC<StormPredictionFormProps> = ({
  onPredictionResult,
  setIsLoading,
}) => {
  const { error: showError, success: showSuccess } = useToast();
  const [rows, setRows] = useState<StormDataRow[]>([
    { id: uuidv4(), datetime: "", latitude: "", longitude: "", windspeed: "", pressure: "" },
  ]);

  const handleInputChange = (id: string, field: keyof Omit<StormDataRow, "id">, value: string) => {
    setRows((prevRows) => prevRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const handleAddRow = () => {
    setRows([...rows, { id: uuidv4(), datetime: "", latitude: "", longitude: "", windspeed: "", pressure: "" }]);
  };

  const handleRemoveRow = (id: string) => {
    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
  };

  // ✅ ĐÃ SỬA LỖI
  const handleSubmit = async () => {
    if (rows.length < 9) {
      showError("Cần ít nhất 9 dòng dữ liệu");
      return;
    }

    setIsLoading(true);
    console.log("Đang gửi dữ liệu đến backend Kaggle:", rows);

    try {
      const API_URL = "https://meadow-proexperiment-tobie.ngrok-free.dev/predict";
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true" // ✅ Bypass Ngrok
        },
        body: JSON.stringify(rows),
      });

      console.log("📡 Predict response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server error:", errorText);
        throw new Error(`Lỗi ${response.status}: ${response.statusText}`);
      }

      const predictionData = await response.json();
      console.log("✅ Kết quả dự đoán:", predictionData);
      
      onPredictionResult(predictionData);
      showSuccess("Dự đoán thành công! Đã nhận kết quả từ Kaggle.");

    } catch (error) {
      console.error("❌ Lỗi khi dự đoán:", error);
      showError(`Dự đoán thất bại: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col gap-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Nhập ít nhất 9 điểm dữ liệu lịch sử của bão để mô hình dự đoán.
      </p>
      <div className="flex justify-between items-center">
        <Label className="dark:text-gray-300">Dữ liệu bão (Tối thiểu 9)</Label>
        <Button size="sm" onClick={handleAddRow}>
          <Plus className="h-4 w-4 mr-2" /> Thêm
        </Button>
      </div>
      <ScrollArea className="flex-grow h-[calc(100vh-450px)] pr-3">
        <div className="space-y-4">
          {rows.map((row, index) => (
            <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
              <span className="col-span-1 text-sm font-medium dark:text-gray-300">{index + 1}</span>
              <div className="col-span-10 space-y-2">
                <Input
                  placeholder="Datetime (VD: 2025-10-01T00:00)"
                  value={row.datetime}
                  onChange={(e) => handleInputChange(row.id, "datetime", e.target.value)}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Latitude (Vĩ độ)"
                    type="number"
                    value={row.latitude}
                    onChange={(e) => handleInputChange(row.id, "latitude", e.target.value)}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                  />
                  <Input
                    placeholder="Longitude (Kinh độ)"
                    type="number"
                    value={row.longitude}
                    onChange={(e) => handleInputChange(row.id, "longitude", e.target.value)}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Windspeed (km/h)"
                    type="number"
                    value={row.windspeed}
                    onChange={(e) => handleInputChange(row.id, "windspeed", e.target.value)}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                  />
                  <Input
                    placeholder="Pressure (hPa)"
                    type="number"
                    value={row.pressure}
                    onChange={(e) => handleInputChange(row.id, "pressure", e.target.value)}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                  />
                </div>
              </div>
              <div className="col-span-1 flex justify-end">
                {rows.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveRow(row.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="mt-auto pt-4">
        <Button onClick={handleSubmit} className="w-full">
          Chạy Dự Đoán
        </Button>
      </div>
    </div>
  );
};