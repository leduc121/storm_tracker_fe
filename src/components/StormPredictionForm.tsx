import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
// Sử dụng đường dẫn tương đối (./) vì nó cùng nằm trong 'components'
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "./ui/use-toast"; // Import từ file của bạn
import { Trash2, Plus } from "lucide-react";

// Định nghĩa kiểu dữ liệu cho một dòng
interface StormDataRow {
  id: string;
  datetime: string;
  latitude: string;
  longitude: string;
  windspeed: string;
  pressure: string;
}

// Định nghĩa kiểu dữ liệu cho props
interface StormPredictionFormProps {
  onPredictionResult: (data: any) => void;
  // Chúng ta dùng chung state loading của trang Index
  setIsLoading: (isLoading: boolean) => void;
}

export const StormPredictionForm: React.FC<StormPredictionFormProps> = ({
  onPredictionResult,
  setIsLoading,
}) => {
  const { toast } = useToast(); // Khởi tạo hook toast
  const [rows, setRows] = useState<StormDataRow[]>([
    {
      id: uuidv4(),
      datetime: "",
      latitude: "",
      longitude: "",
      windspeed: "",
      pressure: "",
    },
  ]);

  const handleInputChange = (
    id: string,
    field: keyof Omit<StormDataRow, "id">,
    value: string,
  ) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        id: uuidv4(),
        datetime: "",
        latitude: "",
        longitude: "",
        windspeed: "",
        pressure: "",
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
  };

  // HÀM QUAN TRỌNG: GỌI API KAGGLE
  const handleSubmit = async () => {
    // 1. Kiểm tra điều kiện tối thiểu 9 dòng
    if (rows.length < 9) {
      toast({
        title: "Chưa đủ dữ liệu",
        description: "Bạn cần nhập ít nhất 9 dòng dữ liệu để dự đoán.",
        // ĐÃ XÓA 'variant: "destructive"'
      });
      return;
    }

    setIsLoading(true); // Bật loading
    console.log("Đang gửi dữ liệu đến backend Kaggle:", rows);

    try {
      // --- PHẦN KẾT NỐI API ĐÂY ---
      // 1. Dán URL Ngrok của bạn vào đây VÀ THÊM /predict
      const API_URL = "https://meadow-proexperiment-tobie.ngrok-free.dev/predict";

      // 2. Gửi request
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows), // Gửi 9+ dòng đi
      });

      if (!response.ok) {
        throw new Error("Lỗi từ server Kaggle (Ngrok)");
      }

      // 3. Nhận kết quả
      const predictionData = await response.json();
      // --- KẾT THÚC KẾT NỐI ---

      // 4. Gửi kết quả lên UI (trang Index) để vẽ
      onPredictionResult(predictionData);
      toast({
        title: "Dự đoán thành công!",
        description: "Đã nhận kết quả từ Kaggle.",
      });
    } catch (error) {
      console.error("Lỗi khi dự đoán:", error);
      toast({
        title: "Dự đoán thất bại",
        description: (error as Error).message,
        // ĐÃ XÓA 'variant: "destructive"'
      });
    } finally {
      setIsLoading(false); // Tắt loading
    }
  };

  return (
    // Chúng ta dùng padding p-4 để khớp với giao diện của StormInfo
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

      {/* Phần bảng nhập liệu */}
      <ScrollArea className="flex-grow h-[calc(100vh-450px)] pr-3">
        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="grid grid-cols-12 gap-2 items-center"
            >
              <span className="col-span-1 text-sm font-medium dark:text-gray-300">
                {index + 1}
              </span>
              <div className="col-span-10 space-y-2">
                <Input
                  placeholder="Datetime (VD: 2023-10-23T12:00:00)"
                  value={row.datetime}
                  onChange={(e) =>
                    handleInputChange(row.id, "datetime", e.target.value)
                  }
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Latitude (Vĩ độ)"
                    type="number"
                    value={row.latitude}
                    onChange={(e) =>
                      handleInputChange(row.id, "latitude", e.target.value)
                    }
                     className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                  />
                  <Input
                    placeholder="Longitude (Kinh độ)"
                    type="number"
                    value={row.longitude}
                    onChange={(e) =>
                      handleInputChange(row.id, "longitude", e.target.value)
                    }
                     className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Windspeed (km/h)"
                    type="number"
                    value={row.windspeed}
                    onChange={(e) =>
                      handleInputChange(row.id, "windspeed", e.target.value)
                    }
                     className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                  />
                  <Input
                    placeholder="Pressure (hPa)"
                    type="number"
                    value={row.pressure}
                    onChange={(e) =>
                      handleInputChange(row.id, "pressure", e.target.value)
                    }
                     className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                  />
                </div>
              </div>
              <div className="col-span-1 flex justify-end">
                {rows.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRow(row.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Nút dự đoán */}
      <div className="mt-auto pt-4">
        <Button onClick={handleSubmit} className="w-full">
          Chạy Dự Đoán
        </Button>
      </div>
    </div>
  );
};