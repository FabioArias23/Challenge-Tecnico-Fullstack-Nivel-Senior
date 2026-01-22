import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000', // MI API NestJS
});

// Interceptor para inyectar el token si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});