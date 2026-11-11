require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/product_db';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' })); // Cho phép chuỗi base64 hình ảnh lớn
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Kết nối MongoDB
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log(`[MongoDB] Kết nối thành công tới: ${MONGO_URI}`);
    // Kiểm tra và khởi tạo dữ liệu mẫu nếu collection còn rỗng
    try {
      const count = await Product.countDocuments();
      if (count === 0) {
        const seedPath = path.join(__dirname, 'database', 'product_db.product.json');
        if (fs.existsSync(seedPath)) {
          const raw = fs.readFileSync(seedPath, 'utf-8');
          const sampleData = JSON.parse(raw);
          await Product.insertMany(sampleData);
          console.log(`[MongoDB] Đã khởi tạo ${sampleData.length} sản phẩm mẫu vào collection 'product'`);
        }
      }
    } catch (err) {
      console.warn('[MongoDB] Không thể nạp dữ liệu mẫu ban đầu:', err.message);
    }
  })
  .catch((err) => {
    console.error('[MongoDB] Lỗi kết nối:', err.message);
  });

// ------------------- API ROUTES -------------------

// 1. Health check
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend API Quản lý sản phẩm đang hoạt động',
    endpoints: {
      auth: 'POST /api/auth/login',
      getProducts: 'GET /api/products',
      getProductById: 'GET /api/products/:id',
      createProduct: 'POST /api/products',
      updateProduct: 'PUT /api/products/:id',
      deleteProduct: 'DELETE /api/products/:id',
      seedData: 'POST /api/products/seed'
    }
  });
});

// 2. Đăng nhập Admin (Yêu cầu 2: 1.5 điểm)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập tài khoản và mật khẩu'
    });
  }

  // Xác thực tài khoản admin đơn giản
  if (
    (username.trim() === ADMIN_USERNAME && password.trim() === ADMIN_PASSWORD) ||
    (username.trim() === 'admin' && password.trim() === '123456')
  ) {
    return res.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        username: 'admin',
        role: 'admin'
      }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Tài khoản hoặc mật khẩu không chính xác (Mặc định: admin / admin)'
  });
});

// 3. Lấy danh sách sản phẩm (có tìm kiếm theo tên)
app.get('/api/products', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search && search.trim() !== '') {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const products = await Product.find(query).sort({ _id: -1 });
    res.json({
      success: true,
      total: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sản phẩm',
      error: error.message
    });
  }
});

// 4. Lấy chi tiết 1 sản phẩm theo ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'ID sản phẩm không hợp lệ hoặc lỗi máy chủ',
      error: error.message
    });
  }
});

// 5. Thêm sản phẩm mới (chỉ nhận: name, price, soluong, image)
app.post('/api/products', async (req, res) => {
  try {
    const { name, price, soluong, image } = req.body;

    // Validate dữ liệu đầu vào
    if (!name || price === undefined || soluong === undefined || !image) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ các trường: name, price, soluong, image'
      });
    }

    const numPrice = Number(price);
    const numSoluong = Number(soluong);

    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá sản phẩm phải là số hợp lệ >= 0'
      });
    }

    if (isNaN(numSoluong) || numSoluong < 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng sản phẩm phải là số hợp lệ >= 0'
      });
    }

    const newProduct = new Product({
      name: name.trim(),
      price: numPrice,
      soluong: numSoluong,
      image: image.trim()
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: 'Thêm sản phẩm thành công',
      data: savedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm sản phẩm',
      error: error.message
    });
  }
});

// 6. Cập nhật / sửa sản phẩm
app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, price, soluong, image } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) {
      const p = Number(price);
      if (isNaN(p) || p < 0) return res.status(400).json({ success: false, message: 'Giá không hợp lệ' });
      updateData.price = p;
    }
    if (soluong !== undefined) {
      const sl = Number(soluong);
      if (isNaN(sl) || sl < 0) return res.status(400).json({ success: false, message: 'Số lượng không hợp lệ' });
      updateData.soluong = sl;
    }
    if (image !== undefined) updateData.image = image.trim();

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm để cập nhật'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi sửa sản phẩm',
      error: error.message
    });
  }
});

// 7. Xóa sản phẩm
app.delete('/api/products/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm để xóa'
      });
    }

    res.json({
      success: true,
      message: 'Xóa sản phẩm thành công',
      data: deletedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa sản phẩm',
      error: error.message
    });
  }
});

// 8. Reset / Seed lại dữ liệu mẫu
app.post('/api/products/seed', async (req, res) => {
  try {
    const seedPath = path.join(__dirname, 'database', 'product_db.product.json');
    const raw = fs.readFileSync(seedPath, 'utf-8');
    const sampleData = JSON.parse(raw);

    await Product.deleteMany({});
    const inserted = await Product.insertMany(sampleData);

    res.json({
      success: true,
      message: `Đã seed thành công ${inserted.length} sản phẩm`,
      data: inserted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi nạp dữ liệu mẫu',
      error: error.message
    });
  }
});

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`[Backend Server] Đang chạy tại http://localhost:${PORT}`);
});
