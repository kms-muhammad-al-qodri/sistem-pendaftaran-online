const API_BASE_URL = '/api/v1';

export async function apiFetch(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // Ensure credentials (cookies) are sent for session authentication
    credentials: 'include',
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error?.message || 'Terjadi kesalahan pada server.';
    const errorDetails = data.error?.details || null;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.code = data.error?.code || 'UNKNOWN_ERROR';
    error.details = errorDetails;
    throw error;
  }

  return data;
}
