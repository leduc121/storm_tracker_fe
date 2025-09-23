// Đây là dữ liệu gió vector giả lập, được tạo để mô phỏng hiệu ứng chuyển động
// Dữ liệu này sẽ làm cho các luồng khí chuyển động từ trái sang phải trên bản đồ
export const mockWindData = [
  {
    "header": {
      "discipline": 0,
      "grib_edition": 2,
      "grib_length": 651664,
      "refTime": "2024-09-17T09:00:00.000Z",
      "forecastTime": 0,
      "surface1Value": 10,
      "parameterCategory": 2,
      "parameterNumber": 2,
      "parameterUnit": "m.s-1",
      "parameterDescription": "u-component of wind",
      "numberPoints": 16400,
      "la1": 90,
      "lo1": 0,
      "la2": -90,
      "lo2": 359.5,
      "dx": 0.5,
      "dy": 0.5,
      "ni": 720,
      "nj": 361
    },
    "data": Array(16400).fill(10).map(() => 5 + Math.random() * 5)
  },
  {
    "header": {
      "discipline": 0,
      "grib_edition": 2,
      "grib_length": 651664,
      "refTime": "2024-09-17T09:00:00.000Z",
      "forecastTime": 0,
      "surface1Value": 10,
      "parameterCategory": 2,
      "parameterNumber": 3,
      "parameterUnit": "m.s-1",
      "parameterDescription": "v-component of wind",
      "numberPoints": 16400,
      "la1": 90,
      "lo1": 0,
      "la2": -90,
      "lo2": 359.5,
      "dx": 0.5,
      "dy": 0.5,
      "ni": 720,
      "nj": 361
    },
    "data": Array(16400).fill(0).map(() => 0 + Math.random() * 0)
  }
];