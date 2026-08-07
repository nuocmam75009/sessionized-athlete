const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',           // envoie le cookie httpOnly
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = '/login'
    }
    throw new Error(`API error ${res.status}`)
  }

  return res.json()
}
