# BÀI THI GIỮA KÌ: PHÁT TRIỂN ỨNG DỤNG ĐA NỀN TẢNG
## Ứng dụng Quản trị Sản phẩm Admin (React Native + MongoDB)

---

### 1. Giới thiệu tổng quan
Dự án được xây dựng theo mô hình **Client - Server (Frontend & Backend tách biệt)**:
- **Backend**: Xây dựng bằng **Node.js + Express**, kết nối trực tiếp đến cơ sở dữ liệu **MongoDB** (`product_db`, collection: `product`).
- **Frontend**: Xây dựng bằng **React Native (Expo SDK 58)**, hỗ trợ chạy mượt mà đa nền tảng trên cả **Web** và **Mobile** (Android/iOS thông qua Expo Go).

---

### 2. Cấu trúc thư mục dự án
```
my-app/
├── backend/                     # Phân hệ Backend API (Node.js & MongoDB)
│   ├── database/
│   │   └── product_db.product.json # File CSDL mẫu để nộp bài
│   ├── models/
│   │   └── Product.js           # Schema Mongoose (name, price, soluong, image)
│   ├── server.js                # Server Express & các API CRUD, Auth
│   ├── package.json
│   └── .env                     # Cấu hình PORT & MONGO_URI
├── frontend/                    # Phân hệ Frontend (React Native Expo)
│   ├── assets/                  # Hình ảnh, icon của ứng dụng
│   ├── src/
│   │   ├── app/                 # Màn hình theo Expo Router
│   │   │   ├── _layout.tsx      # Khung điều hướng Stack & Header
│   │   │   ├── index.tsx        # Danh sách sản phẩm, Tìm kiếm, Xóa, Lọc
│   │   │   ├── login.tsx        # Đăng nhập Admin
│   │   │   ├── add.tsx          # Thêm sản phẩm (hỗ trợ chọn ảnh từ máy)
│   │   │   └── edit/[id].tsx    # Sửa sản phẩm
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # Quản lý trạng thái đăng nhập
│   │   ├── services/
│   │   │   └── api.ts           # Gọi API đến Backend
│   │   └── types/
│   │       └── product.ts       # Định nghĩa kiểu dữ liệu TypeScript
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
├── database/
│   └── product_db.product.json  # File CSDL JSON độc lập nộp cho giảng viên
├── package.json                 # Script tiện ích ở thư mục gốc
└── README.md                    # Tài liệu hướng dẫn & Báo cáo bài thi
```

---

### 3. Cơ sở dữ liệu MongoDB (Đáp ứng yêu cầu nghiêm ngặt của đề bài)
- **Tên Database**: `product_db`
- **Tên Collection**: `product`
- **Các trường dữ liệu (Chỉ gồm 4 trường, không tự ý thêm trường)**:
  1. `name`: Tên sản phẩm (String)
  2. `price`: Giá sản phẩm (Number)
  3. `soluong`: Số lượng sản phẩm trong kho (Number)
  4. `image`: Đường dẫn hình ảnh hoặc ảnh base64 (String)
- **File CSDL nộp bài**: Đã có sẵn tại `database/product_db.product.json` và `backend/database/product_db.product.json`.

---

### 4. Barem điểm & Các chức năng đã hoàn thành
| Mục đề bài | Yêu cầu | Điểm | Trạng thái |
| :--- | :--- | :---: | :---: |
| **Mục 1** | Thêm, hiển thị `name`, `price`, `soluong`, `image` trên nền tảng **Web** | **8.0** |  Hoàn thành xuất sắc |
| **Mục 2** | Đăng nhập Admin, Sửa, Xóa, Tìm kiếm, Sắp xếp giá, Lọc tồn kho | **1.5** |  Hoàn thành xuất sắc |
| **Mục 3** | Nhập hình ảnh từ thiết bị (Image Picker) & hiển thị trên nền tảng **Di động** | **0.5** |  Hoàn thành xuất sắc |
| **Nộp bài** | File CSDL JSON (`product_db.product.json`), Báo cáo, Code sạch sẽ | - |  Đầy đủ |

---

### 5. Hướng dẫn cài đặt và khởi chạy

#### Bước 1: Khởi động MongoDB
Đảm bảo MongoDB Server hoặc MongoDB Compass đang mở tại `localhost:27017` (như trong ảnh bài nộp).

#### Bước 2: Chạy Backend
Mở Terminal thứ nhất:
```bash
cd backend
npm install   # (nếu chưa cài)
npm start
```
> Server sẽ khởi chạy tại: `http://localhost:5000` và tự động nạp dữ liệu mẫu vào `product_db.product` nếu CSDL đang trống.

#### Bước 3: Chạy Frontend (Web & Mobile)
Mở Terminal thứ hai:
```bash
cd frontend
npm run web
```
- **Trên Web**: Trình duyệt sẽ tự động mở tại `http://localhost:8081`. Bạn có thể thực hiện xem, tìm kiếm, thêm, sửa, xóa sản phẩm trực tiếp trên Web.
- **Trên Điện thoại (Di động)**:
  - Chạy lệnh: `npx expo start`
  - Mở ứng dụng **Expo Go** trên điện thoại (Android hoặc iOS) và quét mã QR trên màn hình terminal.
  - Bạn có thể nhấn vào nút **"Chọn ảnh từ máy"** để tải ảnh từ bộ sưu tập điện thoại hoặc chụp ảnh mới.

---

### 6. Tài khoản đăng nhập Admin mặc định
- **Tài khoản**: `admin`
- **Mật khẩu**: `admin` (hoặc `123456`)
- Trên giao diện có nút **"Điền tài khoản mẫu (admin / admin)"** giúp thao tác nhanh khi chấm bài hoặc quay video demo.
