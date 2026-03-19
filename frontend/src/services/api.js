import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://songkrandev.pythonanywhere.com/api';


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  adminLogin: (email, password) =>
    apiClient.post('/auth/admin-login', { email, password }),

  seniorLogin: (user_id, password) =>
    apiClient.post('/auth/senior-login', { user_id, password }),

  verifyToken: (token) =>
    apiClient.post('/auth/verify-token', { token }),
};

export const adminAPI = {
  getAllUsers: () =>
    apiClient.get('/admin/users'),

  getUserById: (user_id) =>
    apiClient.get(`/admin/users/${user_id}`),

  createUser: (userData) =>
    apiClient.post('/admin/users', userData),

  updateUser: (user_id, userData) =>
    apiClient.put(`/admin/users/${user_id}`, userData),

  deleteUser: (user_id) =>
    apiClient.delete(`/admin/users/${user_id}`),

  getStats: () =>
    apiClient.get('/admin/stats'),

  getAllScores: () =>
    apiClient.get('/admin/scores'),

  getScoreSummary: (start, end) => {
    const params = {};
    if (start) params.start = start;
    if (end) params.end = end;
    return apiClient.get('/admin/scores/summary', { params });
  },

  getUserScoreDetails: (user_id, start, end) => {
    const params = {};
    if (start) params.start = start;
    if (end) params.end = end;
    return apiClient.get(`/admin/scores/user/${user_id}`, { params });
  },

  deleteScore: (score_id) =>
    apiClient.delete(`/admin/scores/${score_id}`),

  deleteAllScores: () =>
    apiClient.delete('/admin/scores/all'),
};

export const gameAPI = {
  // สำหรับเกม จราจรอัจฉริยะ (Traffic Game)
  startTrafficSession: () =>
    apiClient.post('/game/start-session', { game_type: 'traffic_game' }),

  endTrafficSession: (session_id) =>
    apiClient.post('/game/end-session', { session_id }),

  saveTrafficScore: (session_id, score, level) =>
    apiClient.post('/game/save-score', { session_id, game_type: 'traffic_game', score, level }),

  // สำหรับเกม จับให้ได้ไล่ให้ทัน (Catch Game)
  startCatchSession: () =>
    apiClient.post('/game/catch-me/start'),

  playCatchRound: (session_id, answer_card_image) =>
    apiClient.post('/game/catch-me/play', { session_id, answer_card_image }),

  // ฟังก์ชันกลางที่ยังอาจถูกเรียกใช้อยู่ (Fallback)
  startSession: (game_type) => {
    if (game_type === 'catch_game') return apiClient.post('/game/catch-me/start');
    return apiClient.post('/game/start-session', { game_type });
  },

  endSession: (session_id) =>
    apiClient.post('/game/end-session', { session_id }),

  saveScore: (session_id, game_type, score, level) => {
    return apiClient.post('/game/save-score', { session_id, game_type, score, level });
  },

  getUserScores: () =>
    apiClient.get('/game/user-scores'), 
};

export default apiClient;
