const API_URL = import.meta.env.VITE_API_URL || 'https://api.khortech.com.au/api'

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

export async function updateProject(id: string, project: any) {
  const res = await fetchWithAuth(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(project),
  })
  if (!res.ok) throw new Error('Failed to update project')
  return res.json()
}

export async function deleteProject(id: string) {
  const res = await fetchWithAuth(`/projects/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete project')
  return res.json()
}

// Steps
export async function createStep(projectId: string, step: any) {
  const res = await fetchWithAuth(`/projects/${projectId}/steps`, {
    method: 'POST',
    body: JSON.stringify(step),
  })
  if (!res.ok) throw new Error('Failed to create step')
  return res.json()
}

// Alias for store compatibility (expects object with projectId inside)
export async function createStepApi(step: any & { projectId: string }) {
  const { projectId, ...rest } = step
  return createStep(projectId, rest)
}

export async function updateStep(projectId: string, stepId: string, step: any) {
  const res = await fetchWithAuth(`/projects/${projectId}/steps/${stepId}`, {
    method: 'PUT',
    body: JSON.stringify(step),
  })
  if (!res.ok) throw new Error('Failed to update step')
  return res.json()
}

export async function deleteStep(projectId: string, stepId: string) {
  const res = await fetchWithAuth(`/projects/${projectId}/steps/${stepId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete step')
  return res.json()
}

export async function updateProjectApi(id: string, project: any) {
  return updateProject(id, project)
}

export async function deleteProjectApi(id: string) {
  return deleteProject(id)
}

export async function updateStepApi(stepId: string, updates: any) {
  const res = await fetchWithAuth(`/api/steps/${stepId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update step')
  return res.json()
}

export async function deleteStepApi(stepId: string) {
  const res = await fetchWithAuth(`/api/steps/${stepId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete step')
  return res.json()
}

// Auth
export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }))
    throw new Error(err.error || 'Login failed')
  }
  return res.json()
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) throw new Error('Refresh failed')
  return res.json()
}