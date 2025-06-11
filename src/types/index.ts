
export interface PDFDocument {
  id: string;
  name: string;
  file: File;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface AppState {
  documents: PDFDocument[];
  currentDocument: PDFDocument | null;
  messages: ChatMessage[];
  isLoading: boolean;
}

export interface AppActions {
  addDocument: (document: PDFDocument) => void;
  setCurrentDocument: (document: PDFDocument | null) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
}

export type AppStore = AppState & AppActions;
