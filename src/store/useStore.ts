
import { create } from 'zustand';
import { AppStore, DocumentFile, ChatMessage } from '../types';

export const useStore = create<AppStore>((set, get) => ({
  // State
  documents: [],
  currentDocument: null,
  messages: [],
  isLoading: false,

  // Actions
  addDocument: (document: DocumentFile) => {
    set((state) => ({
      documents: [...state.documents, document],
    }));
  },

  setCurrentDocument: (document: DocumentFile | null) => {
    set({ currentDocument: document });
  },

  addMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));
