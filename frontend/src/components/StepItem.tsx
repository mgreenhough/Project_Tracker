import { memo, useState, useRef, useEffect, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useProjectStore } from '../store/useProjectStore'
import { DueDateBadge } from './DueDateBadge'
import type { Step } from '../types'

interface StepItemProps {
  step: Step
  isAdmin: boolean
  isProjectFront?: boolean
  onBringToFront?: () => void
}

const statusConfig = {
  CLEAR: {
    icon: '☐',
    className: 'text-gray-500',
    label: 'Clear',
  },
  HOLD_POINT: {
    icon: '◐',
    className: 'text-neon-orange',
    label: 'Hold point',
  },
  DECISION_POINT: {
    icon: '◈',
    className: 'text-neon-red',
    label: 'Decision point',
  },
  COMPLETE: {
    icon: '☑',
    className: 'text-neon-green',
    label: 'Complete',
  },
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

export const StepItem = memo(function StepItem({ step, isAdmin, isProjectFront = true, onBringToFront }: StepItemProps) {
  const cycleStepStatus = useProjectStore((s) => s.cycleStepStatus)
  const updateStep = useProjectStore((s) => s.updateStep)
  const deleteStep = useProjectStore((s) => s.deleteStep)
  const config = statusConfig[step.status]

  const [editingContent, setEditingContent] = useState(false)
  const [contentValue, setContentValue] = useState(step.content)
  const contentInputRef = useRef<HTMLInputElement>(null)
  const hasAutoEnteredEdit = useRef(false)

  const [editingDate, setEditingDate] = useState(false)
  const [dateValue, setDateValue] = useState(step.dueDate || '')

  const debouncedUpdateDate = useDebounce((projectId: string, stepId: string, dueDate: string | null) => {
    updateStep(projectId, stepId, { dueDate })
  }, 800)

  useEffect(() => {
    setContentValue(step.content)
  }, [step.content])

  useEffect(() => {
    // Only update from prop when not actively editing
    if (!editingDate) {
      setDateValue(step.dueDate || '')
    }
  }, [step.dueDate, editingDate])

  useEffect(() => {
    if (editingContent && contentInputRef.current) {
      contentInputRef.current.focus()
      // Only select text for new empty steps, not when re-entering edit mode
      if (contentValue === '') {
        contentInputRef.current.select()
      }
    }
  }, [editingContent, contentValue])

  // Auto-enter edit mode for new empty steps (only once)
  useEffect(() => {
    if (isAdmin && step.content === '' && !editingContent && !hasAutoEnteredEdit.current) {
      hasAutoEnteredEdit.current = true
      setEditingContent(true)
    }
    // Reset flag when step gets content
    if (step.content !== '') {
      hasAutoEnteredEdit.current = false
    }
  }, [isAdmin, step.content, editingContent])

  const handleContentConfirm = useCallback(() => {
    const trimmed = contentValue.trim()
    if (trimmed === '' && step.content === '') {
      // If both current and new content are empty, delete the step
      deleteStep(step.projectId, step.id)
    } else {
      setEditingContent(false)
      // Only update if content actually changed
      if (trimmed !== step.content) {
        updateStep(step.projectId, step.id, { content: trimmed })
      }
    }
  }, [step.projectId, step.id, step.content, contentValue, updateStep, deleteStep])

  const handleContentCancel = useCallback(() => {
    setEditingContent(false)
    setContentValue(step.content)
  }, [step.content])

  const handleContentKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleContentConfirm()
    } else if (e.key === 'Escape') {
      handleContentCancel()
    }
  }, [handleContentConfirm, handleContentCancel])

  const handleDateConfirm = useCallback(() => {
    setEditingDate(false)
    const trimmed = dateValue.trim()
    const ddmmyy = /^\d{2}\/\d{2}\/\d{2}$/
    if (trimmed === '' || ddmmyy.test(trimmed)) {
      updateStep(step.projectId, step.id, { dueDate: trimmed || null })
    } else {
      setDateValue(step.dueDate || '')
    }
  }, [step.projectId, step.id, step.dueDate, dateValue, updateStep])

  const handleDateCancel = useCallback(() => {
    setEditingDate(false)
    setDateValue(step.dueDate || '')
  }, [step.dueDate])

  const handleDateKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleDateConfirm()
    } else if (e.key === 'Escape') {
      handleDateCancel()
    }
  }, [handleDateConfirm, handleDateCancel])

  const handleStatusClick = useCallback(() => {
    if (!isAdmin) return
    if (!isProjectFront && onBringToFront) {
      onBringToFront()
      return
    }
    cycleStepStatus(step.projectId, step.id)
  }, [isAdmin, isProjectFront, onBringToFront, cycleStepStatus, step.projectId, step.id])

  const handleContentInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const capitalized = value.length === 1 ? value.toUpperCase() : value
    setContentValue(capitalized)
  }, [])

  const handleContentSpanClick = useCallback(() => {
    if (!isAdmin) return
    if (!isProjectFront && onBringToFront) {
      onBringToFront()
      return
    }
    setEditingContent(true)
  }, [isAdmin, isProjectFront, onBringToFront])

  const handleDateInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDateValue(e.target.value)
    const trimmed = e.target.value.trim()
    const ddmmyy = /^\d{2}\/\d{2}\/\d{2}$/
    if (trimmed === '' || ddmmyy.test(trimmed)) {
      debouncedUpdateDate(step.projectId, step.id, trimmed || null)
    }
  }, [step.projectId, step.id, debouncedUpdateDate])

  const handleDateSpanClick = useCallback(() => {
    if (!isAdmin) return
    if (!isProjectFront && onBringToFront) {
      onBringToFront()
      return
    }
    setEditingDate(true)
  }, [isAdmin, isProjectFront, onBringToFront])

  const handleDeleteClick = useCallback(() => {
    if (!isProjectFront && onBringToFront) {
      onBringToFront()
      return
    }
    deleteStep(step.projectId, step.id)
  }, [isProjectFront, onBringToFront, deleteStep, step.projectId, step.id])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id, disabled: !isAdmin })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 text-sm group animate-fade-in"
    >
      {isAdmin && (
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-gray-600 active:text-gray-400 text-xs select-none w-8 h-10 flex items-center justify-center rounded active:bg-white/5 transition-colors touch-manipulation"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder step"
        >
          ≡
        </button>
      )}
      <button
        className="w-10 h-10 flex items-center justify-center text-lg select-none rounded active:bg-white/5 transition-colors shrink-0"
        onClick={handleStatusClick}
        disabled={!isAdmin}
        title={config.label}
        aria-label={`Step status: ${config.label}`}
      >
        <span className={config.className}>{config.icon}</span>
      </button>

      {editingContent && isAdmin ? (
        <input
          ref={contentInputRef}
          type="text"
          autoCapitalize="sentences"
          value={contentValue}
          onChange={handleContentInputChange}
          onBlur={handleContentConfirm}
          onKeyDown={handleContentKeyDown}
          className="flex-1 bg-transparent border-b border-neon-blue text-gray-200 outline-none min-w-0"
        />
      ) : (
        <span
          className={`flex-1 break-words cursor-pointer ${
            step.status === 'COMPLETE' ? 'line-through opacity-40' : step.status === 'DECISION_POINT' ? 'text-neon-red' : 'text-gray-200'
          } ${isAdmin ? 'active:text-neon-blue' : ''}`}
          onClick={handleContentSpanClick}
        >
          {step.content}
        </span>
      )}

      {editingDate && isAdmin ? (
        <input
          type="text"
          value={dateValue}
          onChange={handleDateInputChange}
          onBlur={handleDateConfirm}
          onKeyDown={handleDateKeyDown}
          placeholder="dd/mm/yy"
          className="bg-transparent border-b border-neon-blue text-xs font-medium outline-none w-20 text-white"
        />
      ) : (
        <span
          className={`cursor-pointer ${isAdmin ? 'active:text-neon-blue' : ''}`}
          onClick={handleDateSpanClick}
        >
          <DueDateBadge dueDate={step.dueDate} label="" />
        </span>
      )}

      {isAdmin && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className="transition-colors w-8 h-8 flex items-center justify-center rounded active:bg-white/5 tap-active text-gray-600 active:text-neon-red"
          title="Delete step"
          aria-label="Delete step"
        >
          ×
        </button>
      )}
    </div>
  )
})