const mongoose = require('mongoose');

const lecturerSchema = new mongoose.Schema(
  {
    IDGV: {
      type: String,
      required: [true, 'Mã giảng viên là bắt buộc'],
      trim: true,
      unique: true
    },
    Fullname: {
      type: String,
      required: [true, 'Họ và tên là bắt buộc'],
      trim: true
    },
    Image: {
      type: String,
      required: [true, 'Hình ảnh là bắt buộc'],
      trim: true
    },
    SumClass: {
      type: Number,
      required: [true, 'Tổng số lớp là bắt buộc'],
      min: [0, 'Tổng số lớp không được âm'],
      validate: {
        validator: Number.isInteger,
        message: 'Tổng số lớp phải là số nguyên'
      }
    }
  },
  {
    collection: 'GiangVien',
    versionKey: false
  }
);

module.exports = mongoose.model('Lecturer', lecturerSchema);
