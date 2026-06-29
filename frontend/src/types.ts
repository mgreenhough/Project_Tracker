export type StepStatus = 'CLEAR' | 'HOLD_POINT' | 'DECISION_POINT' | 'COMPLETE'

export interface Tab {
  id: string
  name: string
  visibility: 'public' | 'private'
  sortOrder: number
  createdAt: string
}

export interface Step {
  id: string
  projectId: string
  content: string
  status: StepStatus
  stepOrder: number
  dueDate: string | null
  timerCount: number
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  title: string
  description: string | null
  priorityIndex: number
  isPublic: boolean
  isArchived: boolean
  isDeleted: boolean
  dueDate: string | null
  tabId: string | null
  createdAt: string
  updatedAt: string
  steps: Step[]
}

export interface Timer {
  id: string
  stepId: string
  projectId: string
  description: string
  elapsedSeconds: number
  isRunning: boolean
  startedAt: string | null
  checkInDisabled: boolean
  createdAt: string
  updatedAt: string
}
