const BASE = '';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  return { res, data };
}

export function get(url) {
  return request(url);
}

export function post(url, body) {
  return request(url, { method: 'POST', body: JSON.stringify(body) });
}

export function put(url, body) {
  return request(url, { method: 'PUT', body: JSON.stringify(body) });
}

export function patch(url, body) {
  return request(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
}

export function del(url) {
  return request(url, { method: 'DELETE' });
}
