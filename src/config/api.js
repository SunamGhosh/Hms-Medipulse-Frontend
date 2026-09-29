// Centralized API Base URL configuration for HMS MediPulse Frontend
const cleanBaseUrl = (url) => {
  if (!url) return 'http://localhost:5000';
  let cleaned = url.trim().replace(/\/+$/, '');
  if (cleaned.endsWith('/api')) {
    cleaned = cleaned.substring(0, cleaned.length - 4);
  }
  return cleaned;
};

export const API_BASE_URL = cleanBaseUrl(import.meta.env.VITE_URL);
export default API_BASE_URL;
