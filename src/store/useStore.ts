
import { create } from 'zustand';
import { AppStore, PDFDocument, ChatMessage } from '../types';

export const useStore = create<AppStore>((set, get) => ({
  // State
  documents: [],
  currentDocument: null,
  messages: [],
  isLoading: false,

  // Actions
  addDocument: (document: PDFDocument) => {
    set((state) => ({
      documents: [...state.documents, document],
    }));
  },

  setCurrentDocument: (document: PDFDocument | null) => {
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
