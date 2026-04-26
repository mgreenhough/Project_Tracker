import { useState, useRef, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import type { Project } from '../types'

interface ProjectCardProps {
  project: Project
  isAdmin: boolean
  isArchived?: boolean
  dragHandleProps?: {
    attributes: DraggableAttributes
    listeners: SyntheticListenerMap | undefined
  }
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

export function ProjectCard({ project, isAdmin, isArchived = false, dragHandleProps }: ProjectCardProps) {
  const reorderSteps = useProjectStore((s) => s.reorderSteps)
  const updateProject = useProjectStore((s) => s.updateProject)
  const addStep = useProjectStore((s) => s.addStep)
  const archiveProject = useProjectStore((s) => s.archiveProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const steps = [...project.steps].sort((a, b) => a.stepOrder - b.stepOrder)

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
  }, 500)

  useEffect(() => {
    setTitleValue(project.title)
  }, [project.title])

  useEffect(() => {
    setDateValue(project.dueDate || '')
  }, [project.dueDate])

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitle])

  const handleTitleConfirm = () => {
    setEditingTitle(false)
    updateProject(project.id, { title: titleValue.trim() || project.title })
  }

  const handleTitleCancel = () => {
    setEditingTitle(false)
    setTitleValue(project.title)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleConfirm()
    } else if (e.key === 'Escape') {
      handleTitleCancel()
    }
  }

  const handleDateConfirm = () => {
    setEditingDate(false)
    const trimmed = dateValue.trim()
    const ddmmyy = /^\d{2}\/\d{2}\/\d{2}$/
    if (trimmed === '' || ddmmyy.test(trimmed)) {
      updateProject(project.id, { dueDate: trimmed || null })
    } else {
      setDateValue(project.dueDate || '')
    }
  }

  const handleDateCancel = () => {
    setEditingDate(false)
    setDateValue(project.dueDate || '')
  }

  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleDateConfirm()
    } else if (e.key === 'Escape') {
      handleDateCancel()
    }
  }

  const handleAddStep = () => {
    const nextOrder = steps.length > 0 ? Math.max(...steps.map((s) => s.stepOrder)) + 1 : 0
    addStep(project.id, {
      content: 'New step',
      status: 'CLEAR',
      stepOrder: nextOrder,
      dueDate: null,
    })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id)
      const newIndex = steps.findIndex((s) => s.id === over.id)
      const reordered = arrayMove(steps, oldIndex, newIndex)
      reorderSteps(project.id, reordered.map((s) => s.id))
    }
  }

  return (
    <div
      className={`
        relative w-[320px] rounded-xl p-4 flex flex-col gap-3
        border transition-all duration-200
        ${
          isArchived
            ? 'bg-gray-900/40 border-gray-800 opacity-60 grayscale-[0.3]'
            : 'bg-gray-900/80 border-gray-700 hover:border-gray-600'
        }
      `}
    >
      <div className="flex items-center gap-2">
        {isAdmin && dragHandleProps && (
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 text-lg select-none w-11 h-11 flex items-center justify-center rounded hover:bg-white/5 transition-colors touch-manipulation"
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
              debouncedUpdateTitle(project.id, e.target.value)
            }}
            onBlur={handleTitleConfirm}
            onKeyDown={handleTitleKeyDown}
            className="flex-1 bg-transparent border-b border-neon-blue text-white font-semibold outline-none min-w-0"
          />
        ) : (
          <h3
            className={`font-semibold truncate flex-1 cursor-pointer select-none ${
              isArchived ? 'text-gray-400' : 'text-white'
            } ${isAdmin ? 'hover:text-neon-blue' : ''}`}
            onClick={() => isAdmin && setEditingTitle(true)}
          >
            {project.title}
          </h3>
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
          className={`w-fit cursor-pointer ${isAdmin ? 'hover:text-neon-blue' : ''}`}
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
              <StepItem key={step.id} step={step} isAdmin={isAdmin} />
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
            onClick={handleAddStep}
            className="text-xs text-gray-500 hover:text-neon-green transition-colors px-2 py-1 rounded hover:bg-white/5"
            title="Add step"
          >
            + Step
          </button>
          <button
            type="button"
            onClick={() => archiveProject(project.id)}
            className="text-xs text-gray-500 hover:text-neon-orange transition-colors px-2 py-1 rounded hover:bg-white/5"
            title="Archive project"
          >
            Archive
          </button>
          <button
            type="button"
            onClick={() => deleteProject(project.id)}
            className="text-xs text-gray-500 hover:text-neon-red transition-colors px-2 py-1 rounded hover:bg-white/5 ml-auto"
            title="Delete project"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}