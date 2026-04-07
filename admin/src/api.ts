const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class AdminApi {
  private token: string = '';
  setToken(t: string) { this.token = t; localStorage.setItem('admin_token', t); }
  getToken() { return this.token || localStorage.getItem('admin_token') || ''; }
  
  private async req(path: string, opts: RequestInit = {}) {
    const headers: any = { 'Content-Type': 'application/json', Authorization: `Bearer ${this.getToken()}`, ...opts.headers };
    const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `HTTP ${res.status}`); }
    return res.json();
  }
  get(p: string) { return this.req(p); }
  post(p: string, b?: any) { return this.req(p, { method: 'POST', body: JSON.stringify(b) }); }
  put(p: string, b?: any) { return this.req(p, { method: 'PUT', body: JSON.stringify(b) }); }
  del(p: string) { return this.req(p, { method: 'DELETE' }); }

  login(password: string) { return this.post('/api/auth/admin/login', { password }); }
  
  // Carousel
  getCarousel() { return this.get('/api/carousel/admin'); }
  addCarouselImage(d: any) { return this.post('/api/carousel', d); }
  updateCarouselImage(id: string, d: any) { return this.put(`/api/carousel/${id}`, d); }
  deleteCarouselImage(id: string) { return this.del(`/api/carousel/${id}`); }
  
  // Categories
  getCategories() { return this.get('/api/categories'); }
  updateCategory(id: string, d: any) { return this.put(`/api/categories/${id}`, d); }
  
  // Levels
  getLevels(catId: string) { return this.get(`/api/levels/${catId}`); }
  initLevels(catId: string) { return this.post(`/api/levels/init/${catId}`); }
  updateLevel(id: string, d: any) { return this.put(`/api/levels/${id}`, d); }
  
  // Topics
  getTopics(levelId: string) { return this.get(`/api/topics/${levelId}`); }
  addTopic(d: any) { return this.post('/api/topics', d); }
  updateTopic(id: string, d: any) { return this.put(`/api/topics/${id}`, d); }
  deleteTopic(id: string) { return this.del(`/api/topics/${id}`); }
  
  // Lessons
  getLessonElements(topicId: string) { return this.get(`/api/lessons/${topicId}`); }
  addElement(d: any) { return this.post('/api/lessons', d); }
  updateElement(id: string, d: any) { return this.put(`/api/lessons/${id}`, d); }
  deleteElement(id: string) { return this.del(`/api/lessons/${id}`); }
  reorderElements(items: any[]) { return this.put('/api/lessons/reorder/batch', { items }); }
  
  // Movies
  getMovies() { return this.get('/api/movies/admin/all'); }
  addMovie(d: any) { return this.post('/api/movies', d); }
  updateMovie(id: string, d: any) { return this.put(`/api/movies/${id}`, d); }
  deleteMovie(id: string) { return this.del(`/api/movies/${id}`); }
  getMovieCategories() { return this.get('/api/movies/categories'); }
  addMovieCategory(d: any) { return this.post('/api/movies/categories', d); }
  
  // Comics
  getComics() { return this.get('/api/comics/admin/all'); }
  addComic(d: any) { return this.post('/api/comics', d); }
  updateComic(id: string, d: any) { return this.put(`/api/comics/${id}`, d); }
  deleteComic(id: string) { return this.del(`/api/comics/${id}`); }
  
  // Tips
  getTips() { return this.get('/api/tips/admin/all'); }
  addTip(d: any) { return this.post('/api/tips', d); }
  updateTip(id: string, d: any) { return this.put(`/api/tips/${id}`, d); }
  deleteTip(id: string) { return this.del(`/api/tips/${id}`); }
  
  // Apps
  getApps() { return this.get('/api/apps/admin/all'); }
  addApp(d: any) { return this.post('/api/apps', d); }
  updateApp(id: string, d: any) { return this.put(`/api/apps/${id}`, d); }
  deleteApp(id: string) { return this.del(`/api/apps/${id}`); }
  
  // Reels
  getReels() { return this.get('/api/reels/admin/all'); }
  addReelCategory(d: any) { return this.post('/api/reels/categories', d); }
  deleteReelCategory(id: string) { return this.del(`/api/reels/categories/${id}`); }
  addReelWord(data: any) { return this.post('/api/reels/words', data); }
  generateReelWords(data: { category_id: string, words_string: string }) { return this.post('/api/reels/generate-words', data); }
  deleteReelWord(id: string) { return this.del(`/api/reels/words/${id}`); }
  
  // Users
  getUsers(page?: number, search?: string) { return this.get(`/api/users/admin/all?page=${page || 1}&search=${search || ''}`); }
  getUser(id: string) { return this.get(`/api/users/admin/${id}`); }
  updateUser(id: string, d: any) { return this.put(`/api/users/admin/${id}`, d); }
  blockUser(id: string) { return this.post(`/api/users/admin/block/${id}`); }
  unblockUser(id: string) { return this.post(`/api/users/admin/unblock/${id}`); }
  setSubscription(id: string, sub: string) { return this.post(`/api/users/admin/subscription/${id}`, { subscription: sub }); }
  getUserStats() { return this.get('/api/users/admin/stats/overview'); }
  
  // Payments
  getPendingPayments() { return this.get('/api/payments/admin/pending'); }
  getAllPayments() { return this.get('/api/payments/admin/all'); }
  approvePayment(id: string, note?: string) { return this.post(`/api/payments/admin/approve/${id}`, { note }); }
  rejectPayment(id: string, note?: string) { return this.post(`/api/payments/admin/reject/${id}`, { note }); }
  getPaymentCards() { return this.get('/api/payments/admin/cards'); }
  addPaymentCard(d: any) { return this.post('/api/payments/admin/cards', d); }
  updatePaymentCard(id: string, d: any) { return this.put(`/api/payments/admin/cards/${id}`, d); }
  deletePaymentCard(id: string) { return this.del(`/api/payments/admin/cards/${id}`); }
  getPaymentStats() { return this.get('/api/payments/admin/stats'); }
  
  // Referrals
  getReferrals() { return this.get('/api/referrals/admin/all'); }
  addReferral(name: string) { return this.post('/api/referrals', { name }); }
  deleteReferral(id: string) { return this.del(`/api/referrals/${id}`); }
  getReferralStats(code: string) { return this.get(`/api/referrals/stats/${code}`); }
  
  // Upload
  uploadImage(base64: string, filename: string) { return this.post('/api/upload/image', { base64, filename }); }
}

export const adminApi = new AdminApi();
export default adminApi;
