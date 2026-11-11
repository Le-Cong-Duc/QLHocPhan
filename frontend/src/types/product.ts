// Kiểu dữ liệu đúng theo yêu cầu đề bài: name, price, soluong, image
export interface Product {
  _id?: string;
  name: string;
  price: number;
  soluong: number;
  image: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  user?: User;
  total?: number;
  error?: string;
}

export interface User {
  username: string;
  role: string;
}
