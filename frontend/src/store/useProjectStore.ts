import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Project, Step, StepStatus } from '../types'

interface ProjectStoreState {
  projects: Project[]
  isAdmin: boolean
}

type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'steps' | 'priorityIndex'>

interface ProjectStoreActions {
  // Admin flag
  setIsAdmin: (value: boolean) => void

  // Project actions
  addProject: (project: ProjectInput) => Project
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => void
  deleteProject: (id: string) => void
  archiveProject: (id: string) => void
  reorderProjects: (orderedIds: string[]) => void

  // Step actions
  addStep: (projectId: string, step: Omit<Step, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => Step
  updateStep: (projectId: string, stepId: string, updates: Partial<Omit<Step, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>) => void
  deleteStep: (projectId: string, stepId: string) => void
  reorderSteps: (projectId: string, orderedIds: string[]) => void
  cycleStepStatus: (projectId: string, stepId: string) => void
}

type ProjectStore = ProjectStoreState & ProjectStoreActions

const now = () => new Date().toISOString()

const nextPriorityIndex = (projects: Project[]): number => {
  if (projects.length === 0) return 0
  return Math.max(...projects.map((p) => p.priorityIndex)) + 1
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      isAdmin: false,

      setIsAdmin: (value) => set({ isAdmin: value }),

      addProject: (project: ProjectInput) => {
        const newProject: Project = {
          ...project,
          id: uuidv4(),
          steps: [],
          priorityIndex: nextPriorityIndex(get().projects),
          createdAt: now(),
          updatedAt: now(),
        }
        set((state) => ({ projects: [...state.projects, newProject] }))
        return newProject
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: now() } : p
          ),
        }))
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, isDeleted: true, updatedAt: now() } : p
          ),
        }))
      },

      archiveProject: (id) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, isArchived: true, updatedAt: now() } : p
          ),
        }))
      },

      reorderProjects: (orderedIds) => {
        set((state) => {
          const map = new Map(state.projects.map((p) => [p.id, p]))
          const reordered = orderedIds
            .map((id) => map.get(id))
            .filter((p): p is Project => !!p)
            .map((p, index) => ({ ...p, priorityIndex: index, updatedAt: now() }))
          // merge back any projects not in the ordered list (shouldn't happen)
          const reorderedIds = new Set(orderedIds)
          const untouched = state.projects.filter((p) => !reorderedIds.has(p.id))
          return { projects: [...reordered, ...untouched] }
        })
      },

      addStep: (projectId, step) => {
        const newStep: Step = {
          ...step,
          id: uuidv4(),
          projectId,
          createdAt: now(),
          updatedAt: now(),
        }
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, steps: [...p.steps, newStep], updatedAt: now() }
              : p
          ),
        }))
        return newStep
      },

      updateStep: (projectId, stepId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  steps: p.steps.map((s) =>
                    s.id === stepId ? { ...s, ...updates, updatedAt: now() } : s
                  ),
                  updatedAt: now(),
                }
              : p
          ),
        }))
      },

      deleteStep: (projectId, stepId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  steps: p.steps.filter((s) => s.id !== stepId),
                  updatedAt: now(),
                }
              : p
          ),
        }))
      },

      reorderSteps: (projectId, orderedIds) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p
            const map = new Map(p.steps.map((s) => [s.id, s]))
            const reordered = orderedIds
              .map((id) => map.get(id))
              .filter((s): s is Step => !!s)
              .map((s, index) => ({ ...s, stepOrder: index, updatedAt: now() }))
            const reorderedIds = new Set(orderedIds)
            const untouched = p.steps.filter((s) => !reorderedIds.has(s.id))
            return { ...p, steps: [...reordered, ...untouched], updatedAt: now() }
          }),
        }))
      },

      cycleStepStatus: (projectId, stepId) => {
        const cycle: Record<StepStatus, StepStatus> = {
          CLEAR: 'HOLD_POINT',
          HOLD_POINT: 'COMPLETE',
          COMPLETE: 'CLEAR',
        }
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  steps: p.steps.map((s) =>
                    s.id === stepId
                      ? { ...s, status: cycle[s.status], updatedAt: now() }
                      : s
                  ),
                  updatedAt: now(),
                }
              : p
          ),
        }))
      },
    }),
    {
      name: 'project-tracker-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ projects: state.projects }),
    }
  )
)
