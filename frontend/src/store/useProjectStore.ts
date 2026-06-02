import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Project, Step, StepStatus } from '../types'
import {
  fetchProjects,
  createProject,
  updateProjectApi,
  deleteProjectApi,
  createStepApi,
  updateStep,
  deleteStep,
} from '../api'

interface ProjectStoreState {
  projects: Project[]
  isAdmin: boolean
  isLoading: boolean
  error: string | null
  pendingStepCreates: Map<string, Promise<string>>
  _pendingCreateResolvers: Map<string, (id: string) => void>
  _clientStepIds: Set<string> // Track client-side step IDs that haven't been created on server yet
  _stepIdMap: Map<string, string> // Maps client IDs → server IDs after creation
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
  dearchiveProject: (id: string) => void
  reorderProjects: (orderedIds: string[]) => Promise<void>

  // Step actions
  addStep: (projectId: string, step: Omit<Step, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => Promise<Step>
  updateStep: (projectId: string, stepId: string, updates: Partial<Omit<Step, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>) => void
  deleteStep: (projectId: string, stepId: string) => void
  reorderSteps: (projectId: string, orderedIds: string[]) => Promise<void>
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
      // Map of client temporary step id -> promise that resolves to server step id
      pendingStepCreates: new Map<string, Promise<string>>(),
      _pendingCreateResolvers: new Map<string, (id: string) => void>(),
      _clientStepIds: new Set<string>(),
      _stepIdMap: new Map<string, string>(),
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
          console.error('[useProjectStore] loadProjects failed', err)
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
              tabId: newProject.tabId,
            })
            // Replace temp id with server id
            set((state) => ({
              projects: state.projects.map((p) =>
                p.id === newProject.id ? { ...p, id: data.project.id, createdAt: data.project.createdAt, updatedAt: data.project.updatedAt } : p
              ),
            }))
            return { ...newProject, id: data.project.id }
          } catch (err: any) {
            console.error('[useProjectStore] addProject failed', err)
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
            console.error('[useProjectStore] updateProject failed', err)
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
            console.error('[useProjectStore] deleteProject failed', err)
            set({ error: err.message || 'Failed to delete project' })
          })
        }
      },

      archiveProject: (id) => {
        const archivedProjects = get().projects.filter((p) => p.isArchived && !p.isDeleted)
        const minPriority = archivedProjects.length > 0
          ? Math.min(...archivedProjects.map((p) => p.priorityIndex))
          : 0
        const newPriority = minPriority - 1

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, isArchived: true, priorityIndex: newPriority, updatedAt: now() } : p
          ),
        }))

        if (get().isAdmin) {
          updateProjectApi(id, { isArchived: true, priorityIndex: newPriority }).catch((err: any) => {
            console.error('[useProjectStore] archiveProject failed', err)
            set({ error: err.message || 'Failed to archive project' })
          })
        }
      },

      dearchiveProject: (id) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, isArchived: false, updatedAt: now() } : p
          ),
        }))

        if (get().isAdmin) {
          updateProjectApi(id, { isArchived: false }).catch((err: any) => {
            console.error('[useProjectStore] dearchiveProject failed', err)
            set({ error: err.message || 'Failed to de-archive project' })
          })
        }
      },

      reorderProjects: async (orderedIds) => {
        console.log('[reorderProjects] called with', orderedIds.length, 'ids, isAdmin=', get().isAdmin)
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
          console.log('[reorderProjects] isAdmin=true, sending API calls...')
          try {
            await Promise.all(
              orderedIds.map((id, index) =>
                updateProjectApi(id, { priorityIndex: index })
              )
            )
            console.log('[reorderProjects] API calls succeeded')
          } catch (err: any) {
            console.error('[reorderProjects] API calls failed:', err)
            set({ error: err.message || 'Failed to save project order' })
            throw err
          }
        } else {
          console.log('[reorderProjects] isAdmin=false, SKIPPING API calls')
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
        
        // Track this as a client-side ID
        get()._clientStepIds.add(newStep.id)
        
        // Add step to local state immediately
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, steps: [...p.steps, newStep], updatedAt: now() }
              : p
          ),
        }))

        // Only send to server if content is not empty (to avoid validation errors)
        // Empty steps will be created on first update
        if (get().isAdmin && newStep.content.trim() !== '') {
          const pendingPromise = new Promise<string>((resolve) => {
            get()._pendingCreateResolvers.set(newStep.id, resolve)
          })
          get().pendingStepCreates.set(newStep.id, pendingPromise)
          
          try {
            const data = await createStepApi({
              projectId,
              content: newStep.content,
              stepOrder: newStep.stepOrder,
              status: newStep.status,
              dueDate: newStep.dueDate,
              clientId: newStep.id,
            })
            console.debug('[useProjectStore] addStep: created server step', { clientId: data.clientId, serverId: data.step.id })
            set((state) => ({
              projects: state.projects.map((p) =>
                p.id === projectId
                  ? {
                      ...p,
                      steps: p.steps.map((s) =>
                        s.id === (data.clientId ?? newStep.id)
                          ? { ...s, id: data.step.id, createdAt: data.step.createdAt, updatedAt: data.step.updatedAt }
                          : s
                      ),
                    }
                  : p
              ),
            }))
            const resolver = get()._pendingCreateResolvers.get(newStep.id)
            if (resolver) {
              console.debug('[useProjectStore] addStep: resolving pending', newStep.id, '->', data.step.id)
              resolver(data.step.id)
            }
            get()._pendingCreateResolvers.delete(newStep.id)
            get().pendingStepCreates.delete(newStep.id)
            get()._clientStepIds.delete(newStep.id) // Remove from client IDs since it's now on server
            get()._stepIdMap.set(newStep.id, data.step.id) // Map client ID → server ID for drag resolution
            return { ...newStep, id: data.step.id }
          } catch (err: any) {
            console.error('[useProjectStore] addStep failed', err)
            get()._pendingCreateResolvers.delete(newStep.id)
            get().pendingStepCreates.delete(newStep.id)
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
          ;(async () => {
            try {
              // Check if this step exists on the server
              const project = get().projects.find((p) => p.id === projectId)
              const step = project?.steps.find((s) => s.id === stepId)
              
              // Check if this is a client-side ID that hasn't been created on server yet
              const isClientId = get()._clientStepIds.has(stepId)
              const hasPendingCreate = get().pendingStepCreates.has(stepId)
              
              if (isClientId && !hasPendingCreate && step) {
                // This is an empty step that was never sent to server - create it now
                console.debug('[useProjectStore] updateStep: creating step on server first', stepId)
                const pendingPromise = new Promise<string>((resolve) => {
                  get()._pendingCreateResolvers.set(stepId, resolve)
                })
                get().pendingStepCreates.set(stepId, pendingPromise)
                
                const mergedStep = { ...step, ...updates }
                const data = await createStepApi({
                  projectId,
                  content: mergedStep.content,
                  stepOrder: mergedStep.stepOrder,
                  status: mergedStep.status,
                  dueDate: mergedStep.dueDate,
                  clientId: stepId,
                })
                
                console.debug('[useProjectStore] updateStep: created server step', { clientId: data.clientId, serverId: data.step.id })
                
                // Update state with server ID and all current data (including updates)
                set((state) => ({
                  projects: state.projects.map((p) =>
                    p.id === projectId
                      ? {
                          ...p,
                          steps: p.steps.map((s) =>
                            s.id === (data.clientId ?? stepId)
                              ? { 
                                  ...s, 
                                  ...updates,
                                  id: data.step.id, 
                                  createdAt: data.step.createdAt, 
                                  updatedAt: data.step.updatedAt 
                                }
                              : s
                          ),
                        }
                      : p
                  ),
                }))
                
                const resolver = get()._pendingCreateResolvers.get(stepId)
                if (resolver) {
                  resolver(data.step.id)
                }
                get()._pendingCreateResolvers.delete(stepId)
                get().pendingStepCreates.delete(stepId)
                get()._clientStepIds.delete(stepId) // Remove from client IDs since it's now on server
                get()._stepIdMap.set(stepId, data.step.id) // Map client ID → server ID for drag resolution
                // Step is now created with all updates applied - no need to call update API
                return
              }
              
              // Normal update flow
              let targetId = stepId
              if (hasPendingCreate) {
                console.debug('[useProjectStore] updateStep: waiting for pending create', stepId)
                targetId = await get().pendingStepCreates.get(stepId)!
                console.debug('[useProjectStore] updateStep: resolved pending create', stepId, '->', targetId)
              }
              
              // Double-check: if the step doesn't exist in current state, it might have been updated
              // This handles race condition where component has old ID but state has new ID
              const currentProject = get().projects.find((p) => p.id === projectId)
              const stepExists = currentProject?.steps.some((s) => s.id === targetId)
              
              if (!stepExists) {
                console.debug('[useProjectStore] updateStep: step not found with ID', targetId, '- skipping API call (likely race condition)')
                return
              }
              
              await updateStep(projectId, targetId, updates)
            } catch (err: any) {
              console.error('[useProjectStore] updateStep failed', err)
              set({ error: err.message || 'Failed to update step' })
            }
          })()
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
          deleteStep(projectId, stepId).catch((err: any) => {
            console.error('[useProjectStore] deleteStep failed', err)
            set({ error: err.message || 'Failed to delete step' })
          })
        }
      },

      reorderSteps: async (projectId, orderedIds) => {
        // Resolve any stale client IDs in orderedIds to their server IDs
        // This fixes a race condition where dnd-kit captured a client ID
        // but the store has already updated to the server ID
        const stepIdMap = get()._stepIdMap
        const resolvedIds = orderedIds.map((id) => stepIdMap.get(id) ?? id)

        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p
            const map = new Map(p.steps.map((s) => [s.id, s]))
            const reordered = resolvedIds
              .map((id) => map.get(id))
              .filter((s): s is Step => !!s)
              .map((s, index) => ({ ...s, stepOrder: index, updatedAt: now() }))
            const reorderedIds = new Set(resolvedIds)
            const untouched = p.steps.filter((s) => !reorderedIds.has(s.id))
            return { ...p, steps: [...reordered, ...untouched], updatedAt: now() }
          }),
        }))

        if (get().isAdmin) {
          await Promise.all(
            resolvedIds.map(async (id, index) => {
              try {
                let targetId = id
                if (get().pendingStepCreates.has(id)) {
                  console.debug('[useProjectStore] reorderSteps: waiting for pending create', id)
                  targetId = await get().pendingStepCreates.get(id)!
                  console.debug('[useProjectStore] reorderSteps: resolved pending create', id, '->', targetId)
                }
                // Verify step still exists in current state before calling API
                const project = get().projects.find((p) => p.id === projectId)
                const stepExists = project?.steps.some((s) => s.id === targetId)
                if (!stepExists) {
                  console.debug('[useProjectStore] reorderSteps: step not found in current state, skipping API call', targetId)
                  return
                }
                await updateStep(projectId, targetId, { stepOrder: index })
              } catch (err: any) {
                console.error('[useProjectStore] reorderSteps failed', { stepId: id, err })
              }
            })
          )
        }
      },

      cycleStepStatus: (projectId, stepId) => {
        const cycle: Record<StepStatus, StepStatus> = {
          CLEAR: 'HOLD_POINT',
          HOLD_POINT: 'DECISION_POINT',
          DECISION_POINT: 'COMPLETE',
          COMPLETE: 'CLEAR',
        }
        
        // Calculate next status BEFORE state update
        const project = get().projects.find((p) => p.id === projectId)
        const step = project?.steps.find((s) => s.id === stepId)
        const nextStatus = step ? cycle[step.status] : 'CLEAR'
        
        set((state) => ({
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
        }))

        if (get().isAdmin && step) {
          ;(async () => {
            try {
              let targetId = stepId
              if (get().pendingStepCreates.has(stepId)) {
                console.debug('[useProjectStore] cycleStepStatus: waiting for pending create', stepId)
                targetId = await get().pendingStepCreates.get(stepId)!
                console.debug('[useProjectStore] cycleStepStatus: resolved pending create', stepId, '->', targetId)
              }
              // FIX: Use nextStatus instead of step.status
              await updateStep(projectId, targetId, { status: nextStatus })
            } catch (err: any) {
              console.error('[useProjectStore] cycleStepStatus failed', err)
            }
          })()
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
