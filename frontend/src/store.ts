import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Language = 'en' | 'uz';
type Subscription = 'free' | 'premium' | 'ultra';

export interface User {
  id: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role: string;
  subscription: Subscription;
  subscription_expires_at?: string;
  ai_credits_used: number;
  ai_messages_today: number;
  grammar_checks_today: number;
  is_blocked: boolean;
  referral_code?: string;
}

interface AppState {
  theme: Theme;
  language: Language;
  user: User | null;
  isLoggedIn: boolean;
  
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  setUser: (user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'uz',
      user: null,
      isLoggedIn: false,
      
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        return { theme: newTheme };
      }),
      
      setLanguage: (language) => set({ language }),
      
      setUser: (user) => set({ user, isLoggedIn: true }),
      
      logout: () => set({ user: null, isLoggedIn: false }),
      
      updateUser: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null
      })),
    }),
    {
      name: 'english-platform-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
