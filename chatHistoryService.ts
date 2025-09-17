
import { ChatSession } from '../types';

const CHAT_HISTORY_KEY = 'gemini_chat_history_v2';

export const getChatHistory = (): ChatSession[] => {
  try {
    const historyJson = localStorage.getItem(CHAT_HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Error loading chat history from localStorage:', error);
    return [];
  }
};

export const saveChatHistory = (history: ChatSession[]) => {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving chat history to localStorage:', error);
  }
};

export const createNewSession = (): ChatSession => {
    const newSession: ChatSession = {
        id: new Date().toISOString(),
        title: 'Novo Chat',
        messages: [],
    };
    const history = getChatHistory();
    history.unshift(newSession);
    saveChatHistory(history);
    return newSession;
}

export const updateSessionTitle = (sessionId: string, title: string): ChatSession[] => {
    const history = getChatHistory();
    const session = history.find(s => s.id === sessionId);
    if (session) {
        session.title = title;
        saveChatHistory(history);
    }
    return history;
}

export const deleteSession = (sessionId: string): ChatSession[] => {
    let history = getChatHistory();
    history = history.filter(s => s.id !== sessionId);
    saveChatHistory(history);
    return history;
}
