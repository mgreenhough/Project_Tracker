const API_URL = import.meta.env.VITE_API_URL || 'https://api.khortech.com.au/api'

function getAccessToken(): string | null {
  return localStorage.getItem('accessToken')
}

async function parseJsonBody<T = any>(res: Response): Promise<T | null | string> {
  if (res.status === 204) return null
  const text = await res.text().catch(() => '')
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function parseErrorBody(res: Response, defaultMessage: string): Promise<Error> {
  const body = await parseJsonBody(res)
  let message = defaultMessage
  if (body) {
    if (typeof body === 'string') {
      message = body
    } else if (typeof body === 'object' && body !== null) {
      if ('error' in body && typeof (body as any).error === 'string') {
        message = (body as any).error
      } else if ('message' in body && typeof (body as any).message === 'string') {
        message = (body as any).message
      }
    }
  }
  console.error('[api] response error', res.status, message, body)
  return new Error(message)
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
      const refreshText = await refreshRes.text().catch(() => '')
      console.error('[api] refresh failed', refreshRes.status, refreshText)
    }
  }

  return res
}

// Public
export async function fetchProjects(tabId?: string): Promise<{ projects: any[] }> {
  const url = new URL(`${API_URL}/projects`)
  if (tabId) url.searchParams.set('tabId', tabId)
  const res = await fetch(url.toString())
  if (!res.ok) throw await parseErrorBody(res, 'Failed to fetch projects')
  return (await parseJsonBody(res)) as { projects: any[] }
}

// Public tabs — returns all tabs for authenticated users, only public tabs for unauthenticated
export async function fetchTabs(): Promise<{ tabs: any[] }> {
  const res = await fetchWithAuth('/tabs')
  if (!res.ok) throw await parseErrorBody(res, 'Failed to fetch tabs')
  return (await parseJsonBody(res)) as { tabs: any[] }
}

export async function createTab(tab: any) {
  const res = await fetchWithAuth('/tabs', {
    method: 'POST',
    body: JSON.stringify(tab),
  })
  if (!res.ok) throw await parseErrorBody(res, 'Failed to create tab')
  return parseJsonBody(res)
}

export async function updateTab(id: string, tab: any) {
  const res = await fetchWithAuth(`/tabs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(tab),
  })
  if (!res.ok) throw await parseErrorBody(res, 'Failed to update tab')
  return parseJsonBody(res)
}

export async function deleteTab(id: string) {
  const res = await fetchWithAuth(`/tabs/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw await parseErrorBody(res, 'Failed to delete tab')
  return res.status === 204 ? null : parseJsonBody(res)
}

// Projects (admin)
export async function createProject(project: any) {
  const res = await fetchWithAuth('/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  })
  if (!res.ok) throw await parseErrorBody(res, 'Failed to create project')
  return parseJsonBody(res)
}

export async function updateProject(id: string, project: any) {
  const res = await fetchWithAuth(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(project),
  })
  if (!res.ok) throw await parseErrorBody(res, 'Failed to update project')
  return parseJsonBody(res)
}

export async function deleteProject(id: string) {
  const res = await fetchWithAuth(`/projects/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw await parseErrorBody(res, 'Failed to delete project')
  return res.status === 204 ? null : parseJsonBody(res)
}

// Steps
export async function createStep(projectId: string, step: any) {
  const res = await fetchWithAuth(`/projects/${projectId}/steps`, {
    method: 'POST',
    body: JSON.stringify(step),
  })
  if (!res.ok) throw await parseErrorBody(res, 'Failed to create step')
  return parseJsonBody(res)
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
  if (!res.ok) throw await parseErrorBody(res, 'Failed to update step')
  return parseJsonBody(res)
}

export async function deleteStep(projectId: string, stepId: string) {
  const res = await fetchWithAuth(`/projects/${projectId}/steps/${stepId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw await parseErrorBody(res, 'Failed to delete step')
  return res.status === 204 ? null : parseJsonBody(res)
}

export async function updateProjectApi(id: string, project: any) {
  return updateProject(id, project)
}

export async function deleteProjectApi(id: string) {
  return deleteProject(id)
}

export async function updateStepApi(stepId: string, updates: any) {
  const res = await fetchWithAuth(`/steps/${stepId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw await parseErrorBody(res, 'Failed to update step')
  return parseJsonBody(res)
}

export async function deleteStepApi(stepId: string) {
  const res = await fetchWithAuth(`/steps/${stepId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw await parseErrorBody(res, 'Failed to delete step')
  return res.status === 204 ? null : parseJsonBody(res)
}

// Auth
export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw await parseErrorBody(res, 'Login failed')
  return parseJsonBody(res)
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) throw await parseErrorBody(res, 'Refresh failed')
  return parseJsonBody(res)
}

// Timers
export async function fetchTimers(stepId: string): Promise<{ timers: any[] }> {
  const res = await fetchWithAuth(`/timers?stepId=${encodeURIComponent(stepId)}`)
  if (!res.ok) throw await parseErrorBody(res, 'Failed to fetch timers')
  return (await parseJsonBody(res)) as { timers: any[] }
}

export async function createTimer(stepId: string, projectId: string, description: string = '') {
  const res = await fetchWithAuth('/timers', {
    method: 'POST',
    body: JSON.stringify({ stepId, projectId, description }),
  })
  if (!res.ok) throw await parseErrorBody(res, 'Failed to create timer')
  return parseJsonBody(res)
}

export async function updateTimer(id: string, updates: { description?: string; elapsedSeconds?: number }) {
  const res = await fetchWithAuth(`/timers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw await parseErrorBody(res, 'Failed to update timer')
  return parseJsonBody(res)
}

export async function deleteTimer(id: string) {
  const res = await fetchWithAuth(`/timers/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw await parseErrorBody(res, 'Failed to delete timer')
  return res.status === 204 ? null : parseJsonBody(res)
}

export async function startTimer(id: string) {
  const res = await fetchWithAuth(`/timers/${id}/start`, {
    method: 'POST',
  })
  if (!res.ok) throw await parseErrorBody(res, 'Failed to start timer')
  return parseJsonBody(res)
}

export async function stopTimer(id: string) {
  const res = await fetchWithAuth(`/timers/${id}/stop`, {
    method: 'POST',
  })
  if (!res.ok) throw await parseErrorBody(res, 'Failed to stop timer')
  return parseJsonBody(res)
}

export async function resetTimer(id: string) {
  const res = await fetchWithAuth(`/timers/${id}/reset`, {
    method: 'POST',
  })
  if (!res.ok) throw await parseErrorBody(res, 'Failed to reset timer')
  return parseJsonBody(res)
}

export async function fetchProjectTotalTime(projectId: string): Promise<{ totalSeconds: number }> {
  const res = await fetchWithAuth(`/projects/${projectId}/total-time`)
  if (!res.ok) throw await parseErrorBody(res, 'Failed to fetch project total time')
  return (await parseJsonBody(res)) as { totalSeconds: number }
}

export async function fetchTabTotalTime(tabId: string): Promise<{ totalSeconds: number }> {
  const res = await fetchWithAuth(`/tabs/${tabId}/total-time`)
  if (!res.ok) throw await parseErrorBody(res, 'Failed to fetch tab total time')
  return (await parseJsonBody(res)) as { totalSeconds: number }
}
