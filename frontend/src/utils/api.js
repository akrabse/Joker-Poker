import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Auth API
export const authAPI = {
  register: (username, password) =>
    api.post('/api/auth/register', { username, password }),
  
  login: (username, password) =>
    api.post('/api/auth/login', { username, password }),
  
  guest: () =>
    api.post('/api/auth/guest'),
  
  adminLogin: (username, password) =>
    api.post('/api/auth/admin/login', { username, password }),
}

// Games API
export const gamesAPI = {
  create: () =>
    api.post('/api/games/create'),
  
  join: (roomId) =>
    api.post(`/api/games/join/${roomId}`),
  
  getRoom: (roomId) =>
    api.get(`/api/games/${roomId}`),
  
  buyIn: (roomId, amount) =>
    api.post(`/api/games/${roomId}/buyin`, { amount }),
  
  leave: (roomId) =>
    api.post(`/api/games/${roomId}/leave`),
  
  getAll: () =>
    api.get('/api/games'),
}

// Stats API
export const statsAPI = {
  getMyStats: () =>
    api.get('/api/stats/me'),
  
  getUserStats: (userId) =>
    api.get(`/api/stats/user/${userId}`),
  
  getLeaderboard: (limit = 10, sortBy = 'totalWinnings') =>
    api.get('/api/stats/leaderboard', { params: { limit, sortBy } }),
  
  addChips: (username, amount) =>
    api.put('/api/stats/admin/add-chips', { username, amount }),
  
  getAllUsers: () =>
    api.get('/api/stats/admin/users'),
}

export default api
