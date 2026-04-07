import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Language = 'en' | 'uz';

export interface Artifact {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface UserProfile {
  name: string;
  avatar: string;
}

interface AppState {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  
  artifacts: Artifact[];
  addArtifact: (artifact: Omit<Artifact, 'id' | 'createdAt'>) => void;
  updateArtifact: (id: string, data: Partial<Artifact>) => void;
  deleteArtifact: (id: string) => void;

  chats: ChatSession[];
  currentChatId: string | null;
  createChat: () => void;
  setCurrentChat: (id: string) => void;
  updateChatTitle: (id: string, title: string) => void;
  deleteChat: (id: string) => void;
  addMessageToChat: (chatId: string, message: ChatMessage) => void;

  userProfile: UserProfile;
  updateProfile: (data: Partial<UserProfile>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'uz',
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { theme: newTheme };
        }),
      setLanguage: (language) => set({ language }),

      artifacts: [],
      addArtifact: (artifact) => set((state) => ({
        artifacts: [{ ...artifact, id: Date.now().toString(), createdAt: Date.now() }, ...state.artifacts]
      })),
      updateArtifact: (id, data) => set((state) => ({
        artifacts: state.artifacts.map(a => a.id === id ? { ...a, ...data } : a)
      })),
      deleteArtifact: (id) => set((state) => ({
        artifacts: state.artifacts.filter(a => a.id !== id)
      })),

      chats: [],
      currentChatId: null,
      createChat: () => {
        const newChat: ChatSession = {
          id: Date.now().toString(),
          title: 'New Chat',
          messages: [{ id: Date.now().toString(), role: 'model', text: 'Hello! I am your Virtual English Teacher. How can I help you today?' }],
          updatedAt: Date.now()
        };
        set((state) => ({
          chats: [newChat, ...state.chats],
          currentChatId: newChat.id
        }));
      },
      setCurrentChat: (id) => set({ currentChatId: id }),
      updateChatTitle: (id, title) => set((state) => ({
        chats: state.chats.map(c => c.id === id ? { ...c, title, updatedAt: Date.now() } : c)
      })),
      deleteChat: (id) => set((state) => {
        const newChats = state.chats.filter(c => c.id !== id);
        return {
          chats: newChats,
          currentChatId: state.currentChatId === id ? (newChats[0]?.id || null) : state.currentChatId
        };
      }),
      addMessageToChat: (chatId, message) => set((state) => ({
        chats: state.chats.map(c => c.id === chatId ? {
          ...c,
          messages: [...c.messages, message],
          updatedAt: Date.now()
        } : c)
      })),

      userProfile: {
        name: 'Sarvarbek Sanjarovich',
        avatar: 'https://picsum.photos/seed/user123/200/200'
      },
      updateProfile: (data) => set((state) => ({
        userProfile: { ...state.userProfile, ...data }
      }))
    }),
    {
      name: 'app-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
