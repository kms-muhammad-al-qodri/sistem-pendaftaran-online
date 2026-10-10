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

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } catch (netErr) {
    const error = new Error('Tidak dapat terhubung ke server backend. Pastikan server telah dijalankan.');
    error.status = 0;
    error.code = 'NETWORK_ERROR';
    error.original = netErr;
    throw error;
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = { error: { message: text || response.statusText } };
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let errorMsg = data?.error?.message;
    if (!errorMsg && data?.error?.details) {
      const firstDetail = Object.values(data.error.details)[0];
      if (firstDetail) errorMsg = String(firstDetail);
    }
    if (!errorMsg) {
      errorMsg = `Permintaan gagal (${response.status} ${response.statusText})`;
    }

    const error = new Error(errorMsg);
    error.status = response.status;
    error.code = data?.error?.code || 'UNKNOWN_ERROR';
    error.details = data?.error?.details || null;
    throw error;
  }

  return data;
}
