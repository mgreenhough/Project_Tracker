import { useState, useRef, useEffect, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useProjectStore } from '../store/useProjectStore'
import { DueDateBadge } from './DueDateBadge'
import type { Step } from '../types'

interface StepItemProps {
  step: Step
  isAdmin: boolean
}

const statusConfig = {
  CLEAR: {
    icon: '',
    className: 'text-gray-500',
    label: 'Clear',
  },
  HOLD_POINT: {
    icon: '◐',
    className: 'text-neon-orange',
    label: 'Hold point',
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

export function StepItem({ step, isAdmin }: StepItemProps) {
  const cycleStepStatus = useProjectStore((s) => s.cycleStepStatus)
  const updateStep = useProjectStore((s) => s.updateStep)
  const deleteStep = useProjectStore((s) => s.deleteStep)
  const config = statusConfig[step.status]

  const [editingContent, setEditingContent] = useState(false)
  const [contentValue, setContentValue] = useState(step.content)
  const contentInputRef = useRef<HTMLInputElement>(null)

  const [editingDate, setEditingDate] = useState(false)
  const [dateValue, setDateValue] = useState(step.dueDate || '')

  const debouncedUpdateContent = useDebounce((projectId: string, stepId: string, content: string) => {
    updateStep(projectId, stepId, { content })
  }, 500)

  const debouncedUpdateDate = useDebounce((projectId: string, stepId: string, dueDate: string | null) => {
    updateStep(projectId, stepId, { dueDate })
  }, 500)

  useEffect(() => {
    setContentValue(step.content)
  }, [step.content])

  useEffect(() => {
    setDateValue(step.dueDate || '')
  }, [step.dueDate])

  useEffect(() => {
    if (editingContent && contentInputRef.current) {
      contentInputRef.current.focus()
      contentInputRef.current.select()
    }
  }, [editingContent])

  const handleContentConfirm = () => {
    setEditingContent(false)
    updateStep(step.projectId, step.id, { content: contentValue.trim() || step.content })
  }

  const handleContentCancel = () => {
    setEditingContent(false)
    setContentValue(step.content)
  }

  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleContentConfirm()
    } else if (e.key === 'Escape') {
      handleContentCancel()
    }
  }

  const handleDateConfirm = () => {
    setEditingDate(false)
    const trimmed = dateValue.trim()
    const ddmmyy = /^\d{2}\/\d{2}\/\d{2}$/
    if (trimmed === '' || ddmmyy.test(trimmed)) {
      updateStep(step.projectId, step.id, { dueDate: trimmed || null })
    } else {
      setDateValue(step.dueDate || '')
    }
  }

  const handleDateCancel = () => {
    setEditingDate(false)
    setDateValue(step.dueDate || '')
  }

  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleDateConfirm()
    } else if (e.key === 'Escape') {
      handleDateCancel()
    }
  }

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
      className="flex items-center gap-2 text-sm group"
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
        onClick={() => isAdmin && cycleStepStatus(step.projectId, step.id)}
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
          value={contentValue}
          onChange={(e) => {
            setContentValue(e.target.value)
            debouncedUpdateContent(step.projectId, step.id, e.target.value)
          }}
          onBlur={handleContentConfirm}
          onKeyDown={handleContentKeyDown}
          className="flex-1 bg-transparent border-b border-neon-blue text-gray-200 outline-none min-w-0"
        />
      ) : (
        <span
          className={`flex-1 truncate cursor-pointer ${
            step.status === 'COMPLETE' ? 'line-through opacity-40' : 'text-gray-200'
          } ${isAdmin ? 'active:text-neon-blue' : ''}`}
          onClick={() => isAdmin && setEditingContent(true)}
        >
          {step.content}
        </span>
      )}

      {editingDate && isAdmin ? (
        <input
          type="text"
          value={dateValue}
          onChange={(e) => {
            setDateValue(e.target.value)
            const trimmed = e.target.value.trim()
            const ddmmyy = /^\d{2}\/\d{2}\/\d{2}$/
            if (trimmed === '' || ddmmyy.test(trimmed)) {
              debouncedUpdateDate(step.projectId, step.id, trimmed || null)
            }
          }}
          onBlur={handleDateConfirm}
          onKeyDown={handleDateKeyDown}
          placeholder="dd/mm/yy"
          className="bg-transparent border-b border-neon-blue text-xs font-medium outline-none w-20 text-white"
        />
      ) : (
        <span
          className={`cursor-pointer ${isAdmin ? 'active:text-neon-blue' : ''}`}
          onClick={() => isAdmin && setEditingDate(true)}
        >
          <DueDateBadge dueDate={step.dueDate} label="" />
        </span>
      )}

      {isAdmin && (
        <button
          type="button"
          onClick={() => deleteStep(step.projectId, step.id)}
          className="text-gray-600 active:text-neon-red transition-colors w-8 h-8 flex items-center justify-center rounded active:bg-white/5 tap-active"
          title="Delete step"
          aria-label="Delete step"
        >
          ×
        </button>
      )}
    </div>
  )
}