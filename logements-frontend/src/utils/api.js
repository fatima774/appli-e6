// Utility wrappers around fetch for your frontend-backend communication
// Exports:
// - fetchWithTimeout(url, opts, timeout)
// - getLogements()
// - registerUser(userObj)

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export async function fetchWithTimeout(url, opts = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') throw new Error('Requête annulée (timeout)');
    throw err;
  }
}

export async function getLogements(timeout = 8000) {
  const url = `${API_URL}/logements`;
  try {
    const res = await fetchWithTimeout(url, { method: 'GET', headers: { Accept: 'application/json' } }, timeout);
    if (!res.ok) {
      // try read JSON body for error message
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Erreur HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    // rethrow so caller can handle
    throw err;
  }
}

export async function registerUser(userObj, timeout = 10000) {
  const url = `${API_URL}/register`;
  try {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(userObj)
    }, timeout);

    // If backend returns non-2xx, try to parse body and surface message
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(body?.message || `Erreur HTTP ${res.status}`);
    }
    return body;
  } catch (err) {
    throw err;
  }
}