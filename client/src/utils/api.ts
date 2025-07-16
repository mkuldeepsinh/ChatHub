import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies!
});

// No redirect on 401! Let React Router handle it.
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

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
  },
  sendVerificationCode: async (email: string) => {
    const response = await api.post('/user/send-verification-code', { email });
    return response.data;
  },
  verifyEmailCode: async (email: string, code: string) => {
    const response = await api.post('/user/verify-code', { email, code });
    return response.data;
  }
};

// Chat API functions
export const chatAPI = {
  getChats: async () => {
    const response = await api.get('/chats/getChats');
    return response.data;
  },

  createChat: async (receiverId: string) => {
    const response = await api.post('/chats/create', { receiverId });
    return response.data;
  },

  createGroup: async (groupData: any) => {
    const response = await api.post('/chats/createGroup', groupData);
    return response.data;
  },

  searchChats: async (query: string) => {
    const response = await api.get(`/chats/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  deleteChat: async (chatId: string) => {
    const response = await api.delete(`/chats/delete/${chatId}`);
    return response.data;
  },

  updateGroup: async (chatId: string, groupData: any) => {
    const response = await api.put(`/chats/update/${chatId}`, groupData);
    return response.data;
  },

  getChatMessages: async (chatId: string) => {
    const response = await api.get(`/message/${chatId}`);
    return response.data;
  },

  sendMessage: async (chatId: string, content: string, messageType: string = 'text', mediaUrl?: string) => {
    const response = await api.post('/message/send', { chatId, content, messageType, mediaUrl });
    return response.data;
  },

  markAsRead: async (chatId: string) => {
    const response = await api.put('/message/read', { chatId });
    return response.data;
  },

  markMessagesAsRead: async (messageIds: string[]) => {
    const response = await api.put('/message/read', { messageIds });
    return response.data;
  }
};

export default api; 