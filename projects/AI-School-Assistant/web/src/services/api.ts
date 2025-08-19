import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Chat API with streaming support
export const chatApi = {
  sendMessage: async (chatId: string, content: string, model: string = 'gpt-4o-mini') => {
    const response = await fetch(`/api/chats/${chatId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content, model }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.body;
  },
};

export default api;
