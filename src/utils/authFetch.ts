export const authFetch = (url: string, options: RequestInit = {}) => {
  const token = sessionStorage.getItem('accessToken');
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};