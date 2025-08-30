const getApiBaseUrl = () => {
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!rawBaseUrl) {
    return 'http://localhost:3001';
  }
  // On Render, the host does not include the protocol, so we need to add it.
  // We are assuming https for production environments.
  if (rawBaseUrl.startsWith('localhost')) {
    return `http://${rawBaseUrl}`;
  }
  return `https://${rawBaseUrl}`;
};

export const API_BASE_URL = getApiBaseUrl();