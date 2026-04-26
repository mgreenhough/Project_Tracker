export type StepStatus = 'CLEAR' | 'HOLD_POINT' | 'COMPLETE'

export interface Step {
  id: string
  projectId: string
  content: string
  status: StepStatus
  stepOrder: number
  dueDate: string | null
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
  createdAt: string
  updatedAt: string
  steps: Step[]
}
