/* ─── Centralised API Fetch Wrapper ─── */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('lms_token')
}

function buildHeaders(contentType?: string): HeadersInit {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (contentType) {
    headers['Content-Type'] = contentType
  }
  return headers
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    // Token expired or invalid
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lms_token')
      localStorage.removeItem('lms_user')
      window.location.href = '/login'
    }
    throw new Error('Unauthorized')
  }

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`)
  }

  return data as T
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: buildHeaders(),
    })
    return handleResponse<T>(res)
  },

  async post<T>(path: string, body?: Record<string, unknown> | FormData): Promise<T> {
    const isFormData = body instanceof FormData
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: buildHeaders(isFormData ? undefined : 'application/json'),
      body: isFormData ? body : JSON.stringify(body),
    })
    return handleResponse<T>(res)
  },

  async patch<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: buildHeaders('application/json'),
      body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(res)
  },
}
