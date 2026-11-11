# BÁO CÁO BÀI TẬP LỚN / THI GIỮA KÌ
## MÔN HỌC: PHÁT TRIỂN ỨNG DỤNG ĐA NỀN TẢNG
### ĐỀ TÀI: XÂY DỰNG APP NHẬP VÀ HIỂN THỊ, SỬA, XÓA SẢN PHẨM Ở PHÂN HỆ ADMIN

- **Họ và tên sinh viên**: [Điền tên của bạn]
- **Mã số sinh viên**: [Điền MSSV]
- **Lớp / Khóa**: K20 / K21 - Sinh viên năm 3
- **Giảng viên hướng dẫn**: [Điền tên giảng viên]
- **Link GitHub Source Code**: [Dán link repository GitHub của bạn]
- **Link Video Demo**: [Dán link video Google Drive / YouTube demo]

---

## I. MÔ TẢ YÊU CẦU ĐỀ BÀI VÀ MÔ HÌNH HỆ THỐNG

### 1. Yêu cầu đề bài
1. Sử dụng React Native và MongoDB thực hiện thêm, hiển thị `name`, `price`, `soluong`, `image` chạy trên nền tảng **Web** (8.0 điểm).
2. Thực hiện đăng nhập admin, xóa, sửa, tìm kiếm sản phẩm (1.5 điểm).
3. Nhập được hình ảnh từ thiết bị và hiển thị thông tin sản phẩm trên nền tảng **Di động** (0.5 điểm).
4. **Quy định CSDL**: Chỉ chấp nhận đúng 4 trường: `name`, `price`, `soluong`, `image` (không tự ý thêm trường khác). Bắt buộc nộp kèm file CSDL JSON.

### 2. Kiến trúc giải pháp
Dự án được phân tách rõ ràng thành hai phân hệ độc lập:
- **Frontend (Client)**: React Native (Expo SDK 58, Expo Router, react-native-web) hoạt động đồng thời trên cả trình duyệt Web và thiết bị di động iOS/Android.
- **Backend (Server)**: Node.js (Express framework) cung cấp các chuẩn RESTful API (`GET`, `POST`, `PUT`, `DELETE`).
- **Database**: MongoDB chạy tại máy cục bộ `localhost:27017`, cơ sở dữ liệu tên `product_db`, collection `product`.

```
[ Giao diện Web / Mobile ]
         │
         ▼  (HTTP Fetch RESTful API)
[ Backend Node.js / Express :5000 ]
         │
         ▼  (Mongoose Driver)
[ MongoDB Local :27017 / product_db ]
         └─► Collection: product (name, price, soluong, image)
```

---

## II. DANH SÁCH LỆNH VÀ THƯ VIỆN ĐÃ SỬ DỤNG

### 1. Phân hệ Backend
- `express`: Framework tạo REST API nhẹ và ổn định.
- `mongoose`: Thư viện ODM kết nối và thao tác với MongoDB.
- `cors`: Cho phép frontend gọi API đa nguồn gốc không bị chặn CORS.
- `dotenv`: Quản lý biến môi trường cổng mạng và chuỗi kết nối CSDL.

**Lệnh cài đặt thư viện backend**:
```bash
cd backend
npm init -y
npm install express mongoose cors dotenv
```

### 2. Phân hệ Frontend (React Native Expo)
- `expo`: Nền tảng phát triển ứng dụng đa nền tảng React Native.
- `expo-router`: Hệ thống điều hướng màn hình dựa trên file.
- `react-native-web` & `react-dom`: Hỗ trợ biên dịch React Native chạy trực tiếp trên trình duyệt Web.
- `@expo/vector-icons`: Bộ biểu tượng giao diện người dùng.
- `expo-image-picker`: Thư viện chọn hình ảnh từ thư viện thiết bị hoặc tệp tin trên máy tính.

**Lệnh tạo và cài đặt thư viện frontend**:
```bash
npx create-expo-app frontend
cd frontend
npx expo install @expo/vector-icons expo-image-picker react-native-web react-dom
```

---

## III. THIẾT KẾ CƠ SỞ DỮ LIỆU (MONGODB)

### 1. Cấu trúc Schema (Mongoose Model)
Các trường được cài đặt đúng theo định dạng đề bài:
```javascript
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },     // Tên sản phẩm
    price: { type: Number, required: true },    // Giá bán (VNĐ)
    soluong: { type: Number, required: true },  // Số lượng tồn kho
    image: { type: String, required: true }     // Đường dẫn URL hoặc chuỗi Base64
  },
  {
    collection: 'product', // Đúng tên collection trong MongoDB Compass
    versionKey: false      // Không tự thêm trường __v
  }
);
```

### 2. Dữ liệu mẫu (Export JSON)
Dữ liệu mẫu nộp kèm được lưu tại file `database/product_db.product.json`:
```json
[
  {
    "name": "Bàn phím cơ DareU EK87",
    "price": 650000,
    "soluong": 15,
    "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500"
  },
  {
    "name": "Chuột không dây Logitech G304",
    "price": 790000,
    "soluong": 20,
    "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500"
  },
  {
    "name": "Tai nghe gaming Sony WH-1000XM4",
    "price": 5490000,
    "soluong": 8,
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
  }
]
```

---

## IV. CÁC BƯỚC TRIỂN KHAI VÀ HƯỚNG DẪN TEST CHỨC NĂNG

### Bước 1: Khởi động Backend
1. Mở MongoDB Compass, kết nối tới `mongodb://localhost:27017`.
2. Mở cửa sổ Terminal 1:
   ```bash
   cd backend
   npm start
   ```
3. Kết quả console hiển thị:
   ```
   [Backend Server] Đang chạy tại http://localhost:5000
   [MongoDB] Kết nối thành công tới: mongodb://127.0.0.1:27017/product_db
   ```

### Bước 2: Khởi động Frontend trên Web (8.0 Điểm)
1. Mở cửa sổ Terminal 2:
   ```bash
   cd frontend
   npm run web
   ```
2. Trình duyệt tự động mở `http://localhost:8081`.
3. Kiểm tra các chức năng:
   - Hiển thị danh sách sản phẩm gồm `name`, `price`, `soluong`, `image`.
   - Nhấn **"Thêm sản phẩm"**, nhập thông tin và lưu -> Sản phẩm cập nhật ngay lập tức vào MongoDB.
   - Nhập từ khóa vào ô tìm kiếm -> Bộ lọc tìm kiếm theo thời gian thực.

### Bước 3: Kiểm tra chức năng Đăng nhập, Sửa, Xóa (1.5 Điểm)
1. **Đăng nhập Admin**: Nhấn vào nút "Đăng nhập" ở góc phải màn hình, nhấn "Điền tài khoản mẫu (admin / admin)" -> Đăng nhập thành công, hiển thị badge Admin.
2. **Sửa sản phẩm**: Nhấn nút **"Sửa"** ở mỗi thẻ sản phẩm -> Hệ thống load thông tin cũ lên form -> Thay đổi giá/số lượng/ảnh -> Nhấn "Lưu cập nhật".
3. **Xóa sản phẩm**: Nhấn nút **"Xóa"** -> Hộp thoại xác nhận hiển thị -> Đồng ý xóa -> Dữ liệu biến mất khỏi giao diện và xóa khỏi MongoDB.
4. **Chức năng nâng cao**:
   - Sắp xếp sản phẩm theo giá tăng dần / giảm dần.
   - Lọc nhanh các mặt hàng sắp hết hàng (kho $\le$ 5).

### Bước 4: Kiểm tra trên nền tảng Di động & Image Picker (0.5 Điểm)
1. Trong Terminal 2, chạy `npx expo start`.
2. Mở ứng dụng **Expo Go** trên điện thoại, quét mã QR hiển thị trên màn hình.
3. Nhấn vào **"Thêm sản phẩm"** hoặc **"Sửa sản phẩm"** -> Chọn **"Chọn ảnh từ máy (Thiết bị/Web)"** -> Ứng dụng mở album ảnh trên điện thoại để chọn hình ảnh tải lên.

---

## V. KẾT LUẬN VÀ ĐÁNH GIÁ KẾT QUẢ
- Dự án đã hoàn thành đầy đủ 100% tất cả các yêu cầu trong đề bài thi giữa kì.
- Phân chia mã nguồn chuẩn mực giữa Frontend và Backend.
- Cơ sở dữ liệu tuân thủ tuyệt đối chỉ gồm 4 trường (`name`, `price`, `soluong`, `image`).
- Giao diện thân thiện, trực quan, dễ thao tác và trình bày trước hội đồng chấm thi.
