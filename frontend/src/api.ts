const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class ApiClient {
  private token: string = '';
  private telegramId: string = '';
  private userId: string = '';

  setToken(token: string) { this.token = token; }
  setTelegramId(id: string) { this.telegramId = id; }
  setUserId(id: string) { this.userId = id; }
  getUserId() { return this.userId; }

  private async request(path: string, options: RequestInit = {}) {
    const headers: any = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (this.telegramId) headers['x-telegram-id'] = this.telegramId;
    if (this.userId) headers['x-user-id'] = this.userId;

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  get(path: string) { return this.request(path); }
  post(path: string, body?: any) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); }
  put(path: string, body?: any) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }); }
  del(path: string, body?: any) { return this.request(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }); }

  // Auth
  loginTelegram(data: any) { return this.post('/api/auth/telegram', data); }
  getMe() { return this.get('/api/auth/me'); }

  // Carousel
  getCarousel() { return this.get('/api/carousel'); }
  
  // Categories
  getCategories() { return this.get('/api/categories'); }
  
  // Levels
  getLevels(categoryId: string) { return this.get(`/api/levels/${categoryId}`); }
  
  // Topics
  getTopics(levelId: string) { return this.get(`/api/topics/${levelId}`); }
  
  // Lessons
  getLessonElements(topicId: string) { return this.get(`/api/lessons/${topicId}`); }
  
  // Movies
  getMovies() { return this.get('/api/movies'); }
  getMovieCategories() { return this.get('/api/movies/categories'); }
  getMoviesByCategory(catId: string) { return this.get(`/api/movies/category/${catId}`); }
  getMovie(id: string) { return this.get(`/api/movies/${id}`); }
  getMovieCarousel() { return this.get('/api/movies/carousel/all'); }
  searchMovies(q: string) { return this.get(`/api/movies/search/${q}`); }
  
  // Comics
  getComics() { return this.get('/api/comics'); }
  getComic(id: string) { return this.get(`/api/comics/${id}`); }
  
  // Tips
  getTips() { return this.get('/api/tips'); }
  getTip(id: string) { return this.get(`/api/tips/${id}`); }
  
  // Apps
  getApps() { return this.get('/api/apps'); }
  
  // Reels
  getReelCategories() { return this.get('/api/reels/categories'); }
  getReelWords(catId: string) { return this.get(`/api/reels/words/${catId}`); }
  markWord(userId: string, wordId: string, isKnown: boolean) { return this.post('/api/reels/mark', { user_id: userId, word_id: wordId, is_known: isKnown }); }
  getUserWords(userId: string) { return this.get(`/api/reels/user-words/${userId}`); }
  
  // Chat
  getChatSessions(userId: string) { return this.get(`/api/chat/sessions/${userId}`); }
  getChatMessages(sessionId: string) { return this.get(`/api/chat/messages/${sessionId}`); }
  createChatSession(userId: string) { return this.post('/api/chat/sessions', { user_id: userId }); }
  sendMessage(data: any) { return this.post('/api/chat/send', data); }
  deleteChatSession(id: string) { return this.del(`/api/chat/sessions/${id}`); }
  updateChatSession(id: string, data: any) { return this.put(`/api/chat/sessions/${id}`, data); }
  
  // Grammar Checker
  checkGrammar(data: any) { return this.post('/api/grammar-checker/check', data); }
  
  // Payments
  getPaymentCards() { return this.get('/api/payments/cards'); }
  submitPayment(data: any) { return this.post('/api/payments', data); }
  getUserPayments(userId: string) { return this.get(`/api/payments/user/${userId}`); }
  
  // Profile
  updateProfile(data: any) { return this.put('/api/users/profile', data); }
  
  // Referrals
  trackReferralClick(code: string) { return this.post(`/api/referrals/click/${code}`); }
}

export const api = new ApiClient();
export default api;
