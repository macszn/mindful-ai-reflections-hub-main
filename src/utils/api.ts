const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function getApiBase() {
  return API_BASE.replace(/\/$/, '');
}

export function getStoredUser(): { id?: string; name?: string; email?: string } | null {
  try {
    const raw = localStorage.getItem('Mindful_users');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
