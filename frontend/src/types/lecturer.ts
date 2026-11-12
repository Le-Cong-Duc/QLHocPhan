export interface Lecturer {
  _id?: string;
  IDGV: string;
  Fullname: string;
  Image: string;
  SumClass: number;
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
