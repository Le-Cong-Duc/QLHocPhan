# Quản lý học phần

Ứng dụng React Native (Expo) chạy trên Web và Android/iOS, dùng Node.js/Express làm API và MongoDB làm cơ sở dữ liệu. Chức năng gồm đăng nhập Admin, thêm/hiển thị/sửa/xóa giảng viên, tìm kiếm theo mã hoặc họ tên, sắp xếp theo tổng số lớp và chọn ảnh từ thiết bị.

## Đối chiếu đề thi

- Database MongoDB: `QLHocPhan`
- Collection: `GiangVien`
- Các trường nghiệp vụ: `IDGV` (mã giảng viên), `Fullname` (họ tên), `Image` (URL hoặc base64), `SumClass` (tổng số lớp).
- MongoDB tự cấp `_id` để định danh document; schema không thêm trường nghiệp vụ nào khác và tắt `__v`.
- Mã nguồn không chứa file export `product_db.product.json`. Export JSON là đầu ra nộp bài, tạo riêng sau khi nhập dữ liệu.

## Cấu trúc chính

```text
backend/
  models/Lecturer.js
  server.js
frontend/
  App.tsx
  src/app/
  src/components/LecturerFormModal.tsx
  src/types/lecturer.ts
```

## Chạy dự án

1. Khởi động MongoDB local trên cổng `27017`.
2. Chạy backend:

   ```powershell
   cd backend
   npm install
   npm start
   ```

   Mặc định dùng `mongodb://127.0.0.1:27017/QLHocPhan`. Cấu hình MongoDB và tài khoản Admin trong `backend/.env` (tham khảo `.env.example`). Không commit file `.env` lên Git.

3. Chạy frontend trong terminal khác:

   ```powershell
   cd frontend
   npm install
   npx expo start
   ```

   Chạy Web bằng `npm run web`; Android emulator bằng phím `a` trong Expo CLI. URL API được chọn theo nền tảng: Web dùng `localhost`, Android emulator dùng `10.0.2.2`, thiết bị thật dùng host của Expo dev server trên LAN. Có thể đặt `EXPO_PUBLIC_API_URL` nếu cần chỉ định URL khác. Thiết bị thật và máy chạy backend phải truy cập được nhau qua mạng, cổng `5000`.

## Export JSON để nộp

Không thêm file export vào mã nguồn. Sau khi nhập dữ liệu, dùng MongoDB Compass để export collection `QLHocPhan.GiangVien` thành JSON vào thư mục nộp bài bên ngoài repository. Chỉ chọn các trường `IDGV`, `Fullname`, `Image`, `SumClass` nếu đề yêu cầu file chỉ gồm bốn trường nghiệp vụ.
