import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // This allows cookies to be sent with requests
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  signup: async (userData: { username: string; email: string; phone: string; password: string }) => {
    const response = await api.post('/user/signup', userData);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/user/login', credentials);
    return response.data;
  },

  logout: async () => {
    // Clear the HTTP-only cookie by setting it to expire
    await api.post('/user/logout');
  },

  getCurrentUser: async () => {
    const response = await api.get('/user/me');
    return response.data;
  },

  searchUsers: async (username: string) => {
    const response = await api.get(`/user/search?username=${username}`);
    return response.data;
  },

  updateUser: async (userData: any) => {
    const response = await api.put('/user/update', userData);
    return response.data;
  }
};

// Chat API functions
export const chatAPI = {
  getChats: async () => {
    const response = await api.get('/chats');
    return response.data;
  },

  createChat: async (userId: string) => {
    const response = await api.post('/chats', { userId });
    return response.data;
  },

  getChatMessages: async (chatId: string) => {
    const response = await api.get(`/message/${chatId}`);
    return response.data;
  },

  sendMessage: async (chatId: string, content: string) => {
    const response = await api.post('/message', { chatId, content });
    return response.data;
  }
};

export default api; 