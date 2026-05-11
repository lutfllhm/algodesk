import axios from 'axios';

// Dynamically use the current host so it works from any device on the same network.
// If REACT_APP_API_URL is set (e.g. in .env), that takes priority.
// Otherwise, use the same hostname the browser is currently on, port 5000.
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  `http://${window.location.hostname}:5000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
