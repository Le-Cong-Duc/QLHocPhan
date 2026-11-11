const mongoose = require('mongoose');

// Schema đúng theo quy định đề bài: name, price, soluong, image
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên sản phẩm là bắt buộc'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Giá sản phẩm là bắt buộc'],
      min: [0, 'Giá không được âm']
    },
    soluong: {
      type: Number,
      required: [true, 'Số lượng là bắt buộc'],
      min: [0, 'Số lượng không được âm']
    },
    image: {
      type: String,
      required: [true, 'Hình ảnh là bắt buộc']
    }
  },
  {
    collection: 'product', // Đúng tên collection trong MongoDB Compass
    versionKey: false      // Không tự thêm trường __v theo yêu cầu đề bài
  }
);

module.exports = mongoose.model('Product', productSchema);
