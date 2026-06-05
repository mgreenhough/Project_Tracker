import { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { StepItem } from './StepItem'
import { DueDateBadge } from './DueDateBadge'
import { useProjectStore } from '../store/useProjectStore'
import { useTimerStore } from '../store/useTimerStore'
import { urgencyLevel, urgencyBorderColor, urgencyBgColor } from '../store/selectors'
import type { Project } from '../types'

interface ProjectCardProps {
  project: Project
  isAdmin: boolean
  isArchived?: boolean
  isFront?: boolean
  isLeftmost?: boolean
  dragHandleProps?: {
    attributes: DraggableAttributes
    listeners: SyntheticListenerMap | undefined
  }
  onBringToFront?: () => void
}

function useDebounce<T extends (...args: never[]) => void>(fn: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => fn(...args), delay)
    },
    [fn, delay]
  )
}

export const ProjectCard = memo(function ProjectCard({ project, isAdmin, isArchived = false, isFront = false, isLeftmost = false, dragHandleProps, onBringToFront }: ProjectCardProps) {
  const reorderSteps = useProjectStore((s) => s.reorderSteps)
  const updateProject = useProjectStore((s) => s.updateProject)
  const addStep = useProjectStore((s) => s.addStep)
  const archiveProject = useProjectStore((s) => s.archiveProject)
  const dearchiveProject = useProjectStore((s) => s.dearchiveProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const steps = useMemo(() => [...project.steps].sort((a, b) => a.stepOrder - b.stepOrder), [project.steps])

  const projectTotal = useTimerStore((s) => s.projectTotals.get(project.id) || 0)
  const loadProjectTotal = useTimerStore((s) => s.loadProjectTotal)

  // Load project total when component mounts
  useEffect(() => {
    loadProjectTotal(project.id)
  }, [project.id, loadProjectTotal])

  const projectUrgency = useMemo(() => urgencyLevel(project.dueDate), [project.dueDate])
  const stepUrgencies = useMemo(
    () => steps
      .filter((s) => s.status !== 'COMPLETE')
      .map((s) => urgencyLevel(s.dueDate)),
    [steps]
  )
  const highestUrgency = useMemo(() => {
    const all = [projectUrgency, ...stepUrgencies].filter(Boolean) as Array<'high' | 'medium' | 'low'>
    if (all.includes('high')) return 'high'
    if (all.includes('medium')) return 'medium'
    if (all.includes('low')) return 'low'
    return null
  }, [projectUrgency, stepUrgencies])

  // Format project total time
  const formattedProjectTotal = useMemo(() => {
    if (projectTotal === 0) return null
    const hours = Math.floor(projectTotal / 3600)
    const minutes = Math.floor((projectTotal % 3600) / 60)
    if (hours > 0) {
      return `⏱ ${hours}h ${minutes}m`
    }
    return `⏱ ${minutes}m`
  }, [projectTotal])

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(project.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const [editingDate, setEditingDate] = useState(false)
  const [dateValue, setDateValue] = useState(project.dueDate || '')

  const debouncedUpdateTitle = useDebounce((id: string, title: string) => {
    updateProject(id, { title })
  }, 500)

  const debouncedUpdateDate = useDebounce((id: string, dueDate: string | null) => {
    updateProject(id, { dueDate })
  }, 800)

  useEffect(() => {
    setTitleValue(project.title)
  }, [project.title])

  useEffect(() => {
    // Only update from prop when not actively editing
    if (!editingDate) {
      setDateValue(project.dueDate || '')
    }
  }, [project.dueDate, editingDate])

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitle])

  const handleTitleConfirm = useCallback(() => {
    setEditingTitle(false)
    updateProject(project.id, { title: titleValue.trim() || project.title })
  }, [project.id, project.title, titleValue, updateProject])

  const handleTitleCancel = useCallback(() => {
    setEditingTitle(false)
    setTitleValue(project.title)
  }, [project.title])

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleConfirm()
    } else if (e.key === 'Escape') {
      handleTitleCancel()
    }
  }, [handleTitleConfirm, handleTitleCancel])

  const handleDateConfirm = useCallback(() => {
    setEditingDate(false)
    const trimmed = dateValue.trim()
    const ddmmyy = /^\d{2}\/\d{2}\/\d{2}$/
    if (trimmed === '' || ddmmyy.test(trimmed)) {
      updateProject(project.id, { dueDate: trimmed || null })
    } else {
      setDateValue(project.dueDate || '')
    }
  }, [project.id, project.dueDate, dateValue, updateProject])

  const handleDateCancel = useCallback(() => {
    setEditingDate(false)
    setDateValue(project.dueDate || '')
  }, [project.dueDate])

  const handleDateKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleDateConfirm()
    } else if (e.key === 'Escape') {
      handleDateCancel()
    }
  }, [handleDateConfirm, handleDateCancel])

  // Wrapper for actions that require project to be at front
  const requireFront = useCallback((action: () => void) => {
    return () => {
      if (!isFront && onBringToFront) {
        onBringToFront()
        return
      }
      action()
    }
  }, [isFront, onBringToFront])

  const handleAddStep = useCallback(() => {
    const nextOrder = steps.length > 0 ? Math.max(...steps.map((s) => s.stepOrder)) + 1 : 0
    addStep(project.id, {
      content: '',
      status: 'CLEAR',
      stepOrder: nextOrder,
      dueDate: null,
    })
  }, [project.id, steps, addStep])

  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleDeleteClick = useCallback(() => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      deleteTimeoutRef.current = setTimeout(() => {
        setConfirmDelete(false)
      }, 3000)
    } else {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current)
      }
      deleteProject(project.id)
      setConfirmDelete(false)
    }
  }, [confirmDelete, deleteProject, project.id])

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current)
      }
    }
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id)
      const newIndex = steps.findIndex((s) => s.id === over.id)
      const reordered = arrayMove(steps, oldIndex, newIndex)
      reorderSteps(project.id, reordered.map((s) => s.id)).catch((err) => {
        console.error('[ProjectCard] reorderSteps failed:', err)
      })
    }
  }, [steps, project.id, reorderSteps])

  return (
    <div
      className={`
        relative w-[320px] rounded-xl pt-1 pr-4 pb-4 pl-4 flex flex-col gap-3
        border-2 transition-all duration-200 animate-fade-in
        ${
          isArchived
            ? 'bg-gray-900/40 border-neon-green/60 opacity-60 grayscale-[0.3]'
            : isFront || isLeftmost
              ? `bg-gray-950 ${urgencyBorderColor(highestUrgency)}`
              : `bg-gray-900/80 ${urgencyBorderColor(highestUrgency)} ${urgencyBgColor(highestUrgency)}`
        }
      `}
    >
      <div className="flex items-center gap-2">
        {isAdmin && dragHandleProps && (
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-gray-500 active:text-gray-300 text-lg select-none w-11 h-11 flex items-center justify-center rounded active:bg-white/5 transition-colors touch-manipulation"
            style={{ touchAction: 'none' }}
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
            aria-label="Drag to reorder project"
          >
            ≡
          </button>
        )}
        {editingTitle && isAdmin ? (
          <input
            ref={titleInputRef}
            type="text"
            value={titleValue}
            onChange={(e) => {
              setTitleValue(e.target.value)
              if (e.target.value.trim()) {
                debouncedUpdateTitle(project.id, e.target.value)
              }
            }}
            onBlur={handleTitleConfirm}
            onKeyDown={handleTitleKeyDown}
            className="flex-1 bg-transparent border-b border-neon-blue text-white font-semibold outline-none min-w-0"
          />
        ) : (
          <h3
            className={`font-semibold truncate flex-1 cursor-pointer select-none ${
              isArchived ? 'text-gray-400' : 'text-white'
            } ${isAdmin ? 'active:text-neon-blue' : ''}`}
            onClick={() => isAdmin && setEditingTitle(true)}
          >
            {project.title}
          </h3>
        )}
        {/* Project total time display */}
        {formattedProjectTotal && (
          <span className="text-xs text-neon-blue font-mono whitespace-nowrap" title="Total time tracked">
            {formattedProjectTotal}
          </span>
        )}
      </div>

      {editingDate && isAdmin ? (
        <input
          type="text"
          value={dateValue}
          onChange={(e) => {
            setDateValue(e.target.value)
            const trimmed = e.target.value.trim()
            const ddmmyy = /^\d{2}\/\d{2}\/\d{2}$/
            if (trimmed === '' || ddmmyy.test(trimmed)) {
              debouncedUpdateDate(project.id, trimmed || null)
            }
          }}
          onBlur={handleDateConfirm}
          onKeyDown={handleDateKeyDown}
          placeholder="dd/mm/yy"
          className="bg-transparent border-b border-neon-blue text-xs font-medium outline-none w-fit text-white"
        />
      ) : (
        <span
          className={`w-fit cursor-pointer ${isAdmin ? 'active:text-neon-blue' : ''}`}
          onClick={() => isAdmin && setEditingDate(true)}
        >
          <DueDateBadge dueDate={project.dueDate} />
        </span>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={steps.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-1 mt-1">
            {steps.map((step) => (
              <StepItem key={step.id} step={step} isAdmin={isAdmin} isProjectFront={isFront} onBringToFront={onBringToFront} />
            ))}
            {steps.length === 0 && (
              <span className="text-xs text-gray-600 italic py-1">No steps</span>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {isAdmin && !isArchived && (
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={requireFront(handleAddStep)}
            className="text-xs text-gray-500 active:text-neon-green transition-colors px-3 py-2 rounded active:bg-white/5 tap-active"
            title="Add step"
          >
            + Step
          </button>
          <button
            type="button"
            onClick={requireFront(() => archiveProject(project.id))}
            className="text-xs text-gray-500 active:text-neon-orange transition-colors px-3 py-2 rounded active:bg-white/5 tap-active"
            title="Archive project"
          >
            Archive
          </button>
          <button
            type="button"
            onClick={requireFront(handleDeleteClick)}
            className={`text-xs transition-colors px-3 py-2 rounded active:bg-white/5 ml-auto tap-active ${
              confirmDelete ? 'text-neon-red bg-neon-red/10 animate-pulse' : 'text-gray-500 active:text-neon-red'
            }`}
            title={confirmDelete ? 'Click again to confirm delete' : 'Delete project'}
          >
            {confirmDelete ? '!' : '×'}
          </button>
        </div>
      )}
      {isAdmin && isArchived && (
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={requireFront(() => dearchiveProject(project.id))}
            className="text-xs text-gray-500 active:text-neon-green transition-colors px-3 py-2 rounded active:bg-white/5 tap-active"
            title="De-archive project"
          >
            De-archive
          </button>
          <button
            type="button"
            onClick={requireFront(handleDeleteClick)}
            className={`text-xs transition-colors px-3 py-2 rounded active:bg-white/5 ml-auto tap-active ${
              confirmDelete ? 'text-neon-red bg-neon-red/10 animate-pulse' : 'text-gray-500 active:text-neon-red'
            }`}
            title={confirmDelete ? 'Click again to confirm delete' : 'Delete project'}
          >
            {confirmDelete ? '!' : '×'}
          </button>
        </div>
      )}
    </div>
  )
})