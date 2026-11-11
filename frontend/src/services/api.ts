import { Platform } from 'react-native';
import { ApiResponse, Product, User } from '../types/product';

// Cấu hình URL API Backend:
// - Trên Web: Dùng localhost:5000
// - Trên Android Emulator: Thường là 10.0.2.2:5000
// - Trên Thiết bị di động thật (Expo Go): Dùng IP máy tính (ví dụ: 192.168.10.156:5000)
export const DEFAULT_API_URL =
  Platform.OS === 'web'
    ? 'http://localhost:5000/api'
    : 'http://192.168.10.156:5000/api';

let currentApiUrl = DEFAULT_API_URL;

export const setApiUrl = (url: string) => {
  currentApiUrl = url;
};

export const getApiUrl = () => currentApiUrl;

export const apiService = {
  // 1. Đăng nhập
  async login(username: string, password: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${currentApiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ Backend: ' + err.message
      };
    }
  },

  // 2. Lấy danh sách sản phẩm (có tìm kiếm)
  async getProducts(search?: string): Promise<ApiResponse<Product[]>> {
    try {
      const url = search
        ? `${currentApiUrl}/products?search=${encodeURIComponent(search)}`
        : `${currentApiUrl}/products`;
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: 'Lỗi tải danh sách sản phẩm: ' + err.message,
        data: []
      };
    }
  },

  // 3. Lấy chi tiết 1 sản phẩm
  async getProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      const response = await fetch(`${currentApiUrl}/products/${id}`);
      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: 'Lỗi tải chi tiết sản phẩm: ' + err.message
      };
    }
  },

  // 4. Thêm mới sản phẩm (name, price, soluong, image)
  async createProduct(product: Omit<Product, '_id'>): Promise<ApiResponse<Product>> {
    try {
      const response = await fetch(`${currentApiUrl}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: 'Lỗi khi thêm sản phẩm: ' + err.message
      };
    }
  },

  // 5. Cập nhật sản phẩm
  async updateProduct(id: string, product: Partial<Product>): Promise<ApiResponse<Product>> {
    try {
      const response = await fetch(`${currentApiUrl}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: 'Lỗi khi cập nhật sản phẩm: ' + err.message
      };
    }
  },

  // 6. Xóa sản phẩm
  async deleteProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      const response = await fetch(`${currentApiUrl}/products/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: 'Lỗi khi xóa sản phẩm: ' + err.message
      };
    }
  },

  // 7. Seed lại dữ liệu mẫu
  async seedProducts(): Promise<ApiResponse<Product[]>> {
    try {
      const response = await fetch(`${currentApiUrl}/products/seed`, {
        method: 'POST'
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: 'Lỗi nạp dữ liệu mẫu: ' + err.message
      };
    }
  }
};
