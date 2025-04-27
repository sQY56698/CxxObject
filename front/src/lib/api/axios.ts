import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加JWT
apiClient.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 处理401错误 - 未授权
    if (error.response && error.response.status === 401) {
      // 清除token和用户信息
      localStorage.removeItem('token');
      // 可以使用一个全局事件触发用户状态更新
      window.dispatchEvent(new Event('unauthorized'));
      // 如果不在登录页面，重定向到登录页
      if (window.location.pathname !== '/auth' && !error.config.url?.includes('/admin')) {
        window.location.href = '/auth?mode=login';
      } else if (window.location.pathname !== '/admin/login' && error.config.url?.includes('/admin')) {
        window.location.href = '/admin/login';
      }
    } else {
      // 处理其他错误
      console.error(error.response?.data);
    }
    return Promise.reject(error);
  }
);

export default apiClient; 