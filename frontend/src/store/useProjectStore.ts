import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Project, Step, StepStatus } from '../types'
import {
  fetchProjects,
  createProject,
  updateProjectApi,
  deleteProjectApi,
  createStep,
  updateStepApi,
  deleteStepApi,
} from '../api'

interface ProjectStoreState {
  projects: Project[]
  isAdmin: boolean
  isLoading: boolean
  error: string | null
}

type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'steps' | 'priorityIndex' | 'isDeleted'>

interface ProjectStoreActions {
  // Admin flag
  setIsAdmin: (value: boolean) => void

  // Loading / error
  setError: (error: string | null) => void

  // Fetch
  loadProjects: () => Promise<void>

  // Project actions
  addProject: (project: ProjectInput) => Promise<Project>
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => void
  deleteProject: (id: string) => void
  archiveProject: (id: string) => void
  reorderProjects: (orderedIds: string[]) => void

  // Step actions
  addStep: (projectId: string, step: Omit<Step, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => Promise<Step>
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
      isLoading: false,
      error: null,

      setIsAdmin: (value) => set({ isAdmin: value }),
      setError: (error) => set({ error }),

      loadProjects: async () => {
        set({ isLoading: true, error: null })
        try {
          const data = await fetchProjects()
          set({ projects: data.projects, isLoading: false })
        } catch (err: any) {
          set({ error: err.message || 'Failed to load projects', isLoading: false })
        }
      },

      addProject: async (project: ProjectInput) => {
        const newProject: Project = {
          ...project,
          id: uuidv4(),
          steps: [],
          isDeleted: false,
          priorityIndex: nextPriorityIndex(get().projects),
          createdAt: now(),
          updatedAt: now(),
        }
        set((state) => ({ projects: [...state.projects, newProject] }))

        if (get().isAdmin) {
          try {
            const data = await createProject({
              title: newProject.title,
              description: newProject.description,
              priorityIndex: newProject.priorityIndex,
              isPublic: newProject.isPublic,
              isArchived: newProject.isArchived,
              dueDate: newProject.dueDate,
            })
            // Replace temp id with server id
            set((state) => ({
              projects: state.projects.map((p) =>
                p.id === newProject.id ? { ...p, id: data.project.id, createdAt: data.project.createdAt, updatedAt: data.project.updatedAt } : p
              ),
            }))
            return { ...newProject, id: data.project.id }
          } catch (err: any) {
            set({ error: err.message || 'Failed to create project' })
          }
        }
        return newProject
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: now() } : p
          ),
        }))

        if (get().isAdmin) {
          updateProjectApi(id, updates).catch((err: any) => {
            set({ error: err.message || 'Failed to update project' })
          })
        }
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, isDeleted: true, updatedAt: now() } : p
          ),
        }))

        if (get().isAdmin) {
          deleteProjectApi(id).catch((err: any) => {
            set({ error: err.message || 'Failed to delete project' })
          })
        }
      },

      archiveProject: (id) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, isArchived: true, updatedAt: now() } : p
          ),
        }))

        if (get().isAdmin) {
          updateProjectApi(id, { isArchived: true }).catch((err: any) => {
            set({ error: err.message || 'Failed to archive project' })
          })
        }
      },

      reorderProjects: (orderedIds) => {
        set((state) => {
          const map = new Map(state.projects.map((p) => [p.id, p]))
          const reordered = orderedIds
            .map((id) => map.get(id))
            .filter((p): p is Project => !!p)
            .map((p, index) => ({ ...p, priorityIndex: index, updatedAt: now() }))
          const reorderedIds = new Set(orderedIds)
          const untouched = state.projects.filter((p) => !reorderedIds.has(p.id))
          return { projects: [...reordered, ...untouched] }
        })

        if (get().isAdmin) {
          orderedIds.forEach((id, index) => {
            updateProjectApi(id, { priorityIndex: index }).catch(() => {})
          })
        }
      },

      addStep: async (projectId, step) => {
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

        if (get().isAdmin) {
          try {
            const data = await createStep({
              projectId,
              content: newStep.content,
              stepOrder: newStep.stepOrder,
              status: newStep.status,
              dueDate: newStep.dueDate,
            })
            set((state) => ({
              projects: state.projects.map((p) =>
                p.id === projectId
                  ? {
                      ...p,
                      steps: p.steps.map((s) =>
                        s.id === newStep.id
                          ? { ...s, id: data.step.id, createdAt: data.step.createdAt, updatedAt: data.step.updatedAt }
                          : s
                      ),
                    }
                  : p
              ),
            }))
            return { ...newStep, id: data.step.id }
          } catch (err: any) {
            set({ error: err.message || 'Failed to create step' })
          }
        }
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

        if (get().isAdmin) {
          updateStepApi(stepId, updates).catch((err: any) => {
            set({ error: err.message || 'Failed to update step' })
          })
        }
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

        if (get().isAdmin) {
          deleteStepApi(stepId).catch((err: any) => {
            set({ error: err.message || 'Failed to delete step' })
          })
        }
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

        if (get().isAdmin) {
          orderedIds.forEach((id, index) => {
            updateStepApi(id, { stepOrder: index }).catch(() => {})
          })
        }
      },

      cycleStepStatus: (projectId, stepId) => {
        const cycle: Record<StepStatus, StepStatus> = {
          CLEAR: 'HOLD_POINT',
          HOLD_POINT: 'COMPLETE',
          COMPLETE: 'CLEAR',
        }
        set((state) => {
          const project = state.projects.find((p) => p.id === projectId)
          const step = project?.steps.find((s) => s.id === stepId)
          const nextStatus = step ? cycle[step.status] : 'CLEAR'
          return {
            projects: state.projects.map((p) =>
              p.id === projectId
                ? {
                    ...p,
                    steps: p.steps.map((s) =>
                      s.id === stepId
                        ? { ...s, status: nextStatus, updatedAt: now() }
                        : s
                    ),
                    updatedAt: now(),
                  }
                : p
            ),
          }
        })

        if (get().isAdmin) {
          const project = get().projects.find((p) => p.id === projectId)
          const step = project?.steps.find((s) => s.id === stepId)
          if (step) {
            updateStepApi(stepId, { status: step.status }).catch(() => {})
          }
        }
      },
    }),
    {
      name: 'project-tracker-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ projects: state.projects }),
    }
  )
)
