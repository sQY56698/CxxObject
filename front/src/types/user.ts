// 用户类型
export interface User {
  userId: number;
  username: string;
  email: string;
  avatar?: string;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 登录表单数据
export interface UserLoginData {
  username: string;
  password: string;
}

// 注册表单数据
export interface UserRegisterData {
  username: string;
  password: string;
  email: string;
  captcha: string;
}

// 用户资料类型
export interface UserProfile {
  userId: number;
  username: string;
  gender?: number;
  birthDate?: string;
  bio?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
}

// 用户资料更新数据
export interface UserProfileData {
  gender?: number;
  birthDate?: string;
  bio?: string;
  website?: string;
  avatar?: string;
} 