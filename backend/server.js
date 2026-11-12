const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Lecturer = require('./models/Lecturer');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/QLHocPhan';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error('Vui lòng cấu hình ADMIN_USERNAME và ADMIN_PASSWORD');
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

function parseLecturerPayload(body, partial = false) {
  const data = {};
  const fields = ['IDGV', 'Fullname', 'Image'];

  for (const field of fields) {
    if (partial && body[field] === undefined) continue;
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      return { error: `${field} là trường bắt buộc và phải là chuỗi` };
    }
    data[field] = body[field].trim();
  }

  if (!partial || body.SumClass !== undefined) {
    const sumClass = Number(body.SumClass);
    if (body.SumClass === '' || !Number.isInteger(sumClass) || sumClass < 0) {
      return { error: 'SumClass phải là số nguyên >= 0' };
    }
    data.SumClass = sumClass;
  }

  if (partial && Object.keys(data).length === 0) {
    return { error: 'Vui lòng cung cấp ít nhất một trường để cập nhật' };
  }

  return { data };
}

function handleDatabaseError(res, error, action) {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'IDGV đã tồn tại'
    });
  }

  return res.status(500).json({
    success: false,
    message: action,
    error: error.message
  });
}

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend API Quản lý học phần đang hoạt động',
    database: 'QLHocPhan',
    collection: 'GiangVien',
    endpoints: {
      auth: 'POST /api/auth/login',
      getLecturers: 'GET /api/lecturers',
      getLecturerById: 'GET /api/lecturers/:IDGV',
      createLecturer: 'POST /api/lecturers',
      updateLecturer: 'PUT /api/lecturers/:IDGV',
      deleteLecturer: 'DELETE /api/lecturers/:IDGV'
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập tài khoản và mật khẩu'
    });
  }

  if (
    username.trim() === ADMIN_USERNAME &&
    password === ADMIN_PASSWORD
  ) {
    return res.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        username: ADMIN_USERNAME,
        role: 'admin'
      }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Tài khoản hoặc mật khẩu không chính xác'
  });
});

app.get('/api/lecturers', async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const query = search
      ? {
          $or: [
            { IDGV: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
            { Fullname: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
          ]
        }
      : {};

    const lecturers = await Lecturer.find(query).sort({ _id: -1 });
    res.json({
      success: true,
      total: lecturers.length,
      data: lecturers
    });
  } catch (error) {
    handleDatabaseError(res, error, 'Lỗi khi lấy danh sách giảng viên');
  }
});

app.get('/api/lecturers/:IDGV', async (req, res) => {
  try {
    const lecturer = await Lecturer.findOne({ IDGV: req.params.IDGV });
    if (!lecturer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giảng viên'
      });
    }
    res.json({ success: true, data: lecturer });
  } catch (error) {
    handleDatabaseError(res, error, 'Lỗi khi lấy thông tin giảng viên');
  }
});

app.post('/api/lecturers', async (req, res) => {
  const { data, error: validationError } = parseLecturerPayload(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const lecturer = await Lecturer.create(data);
    res.status(201).json({
      success: true,
      message: 'Thêm giảng viên thành công',
      data: lecturer
    });
  } catch (error) {
    handleDatabaseError(res, error, 'Lỗi khi thêm giảng viên');
  }
});

app.put('/api/lecturers/:IDGV', async (req, res) => {
  const { data, error: validationError } = parseLecturerPayload(req.body, true);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const lecturer = await Lecturer.findOneAndUpdate(
      { IDGV: req.params.IDGV },
      data,
      { new: true, runValidators: true }
    );
    if (!lecturer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giảng viên để cập nhật'
      });
    }
    res.json({
      success: true,
      message: 'Cập nhật giảng viên thành công',
      data: lecturer
    });
  } catch (error) {
    handleDatabaseError(res, error, 'Lỗi khi cập nhật giảng viên');
  }
});

app.delete('/api/lecturers/:IDGV', async (req, res) => {
  try {
    const lecturer = await Lecturer.findOneAndDelete({ IDGV: req.params.IDGV });
    if (!lecturer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giảng viên để xóa'
      });
    }
    res.json({
      success: true,
      message: 'Xóa giảng viên thành công',
      data: lecturer
    });
  } catch (error) {
    handleDatabaseError(res, error, 'Lỗi khi xóa giảng viên');
  }
});

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`[MongoDB] Kết nối thành công tới: ${MONGO_URI}`);
    app.listen(PORT, () => {
      console.log(`[Backend Server] Đang chạy tại http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[MongoDB] Không thể kết nối, backend chưa khởi chạy:', error.message);
    process.exitCode = 1;
  }
}

startServer();
