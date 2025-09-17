const SEARCH_HISTORY_KEY = 'gemini_search_history';
const MAX_HISTORY_SIZE = 100;

export const getSearchHistory = (): string[] => {
  try {
    const historyJson = localStorage.getItem(SEARCH_HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Error loading search history from localStorage:', error);
    return [];
  }
};

export const saveSearchHistory = (history: string[]) => {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving search history to localStorage:', error);
  }
};

export const addSearchHistoryEntry = (query: string) => {
    if (!query) return;
    let history = getSearchHistory();
    // Remove existing entry to move it to the top (most recent)
    history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
    // Add the new query to the beginning of the array
    history.unshift(query);
    // Enforce the maximum history size
    if (history.length > MAX_HISTORY_SIZE) {
        history = history.slice(0, MAX_HISTORY_SIZE);
    }
    saveSearchHistory(history);
};

export const deleteSearchHistoryEntry = (query: string): string[] => {
    let history = getSearchHistory();
    history = history.filter(item => item !== query);
    saveSearchHistory(history);
    return history;
};

export const clearSearchHistory = () => {
    saveSearchHistory([]);
};
