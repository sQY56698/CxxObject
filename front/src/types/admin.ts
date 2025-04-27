export interface AdminUser {
  id: number;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
}

export interface AdminAuthUser {
  id: number;
  username: string;
}

export interface FileReviewDTO {
  taskId: number;
  status: number;
  comment: string;
} 