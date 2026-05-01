const BASE = import.meta.env.VITE_API_URL ?? ''

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`)
  }

  return data
}

/* ── Menu ───────────────────────────────────────────────── */
export const menuApi = {
  getAll:  ()           => request('/api/menu'),
  getOne:  (id)         => request(`/api/menu/${id}`),
  create:  (body)       => request('/api/menu',       { method: 'POST',   body: JSON.stringify(body) }),
  update:  (id, body)   => request(`/api/menu/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  remove:  (id)         => request(`/api/menu/${id}`, { method: 'DELETE' }),
}

/* ── Orders ─────────────────────────────────────────────── */
export const ordersApi = {
  getAll:  ()           => request('/api/orders'),
  getOne:  (id)         => request(`/api/orders/${id}`),
  create:  (body)       => request('/api/orders',       { method: 'POST',   body: JSON.stringify(body) }),
  update:  (id, body)   => request(`/api/orders/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  remove:  (id)         => request(`/api/orders/${id}`, { method: 'DELETE' }),
}