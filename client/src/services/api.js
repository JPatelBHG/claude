import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (email, password, company_name) =>
    api.post('/auth/register', { email, password, company_name }),
  login: (email, password) =>
    api.post('/auth/login', { email, password })
};

export const rfpAPI = {
  getSections: () => api.get('/rfp/sections'),
  getQuestions: (sectionId) => api.get(`/rfp/sections/${sectionId}/questions`),
  getAnswers: () => api.get('/rfp/answers'),
  getProgress: () => api.get('/rfp/progress'),
  saveAnswer: (questionId, answerText) =>
    api.post('/rfp/answers', { question_id: questionId, answer_text: answerText })
};

export const exportAPI = {
  exportPDF: () => api.post('/export/pdf', {}, { responseType: 'blob' }),
  exportExcel: () => api.post('/export/excel', {}, { responseType: 'blob' })
};

export default api;
