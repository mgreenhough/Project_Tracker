const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function getAccessToken(): string | null {
  return localStorage.getItem('accessToken')
}

async function fetchWithAuth(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${input}`, {
    ...init,
    headers,
  })

  if (res.status === 401) {
    const refresh = localStorage.getItem('refreshToken')
    if (refresh) {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      })
      if (refreshRes.ok) {
        const data = await refreshRes.json()
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        headers['Authorization'] = `Bearer ${data.accessToken}`
        return fetch(`${API_URL}${input}`, { ...init, headers })
      }
    }
  }

  return res
}

// Public
export async function fetchProjects(): Promise<{ projects: any[] }> {
  const res = await fetch(`${API_URL}/projects`)
  if (!res.ok) throw new Error('Failed to fetch projects')
  return res.json()
}

// Projects (admin)
export async function createProject(project: any) {
  const res = await fetchWithAuth('/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  })
  if (!res.ok) throw new Error('Failed to create project')
  return res.json()
}

export async function updateProjectApi(id: string, updates: any) {
  const res = await fetchWithAuth(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update project')
  return res.json()
}

export async function deleteProjectApi(id: string) {
  const res = await fetchWithAuth(`/projects/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete project')
}

// Steps (admin)
export async function createStep(step: any) {
  const res = await fetchWithAuth('/steps', {
    method: 'POST',
    body: JSON.stringify(step),
  })
  if (!res.ok) throw new Error('Failed to create step')
  return res.json()
}

export async function updateStepApi(id: string, updates: any) {
  const res = await fetchWithAuth(`/steps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update step')
  return res.json()
}

export async function deleteStepApi(id: string) {
  const res = await fetchWithAuth(`/steps/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete step')
}
