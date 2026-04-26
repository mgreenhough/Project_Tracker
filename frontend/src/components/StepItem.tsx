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

export function StepItem({ step, isAdmin }: StepItemProps) {
  const cycleStepStatus = useProjectStore((s) => s.cycleStepStatus)
  const config = statusConfig[step.status]

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
          className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 text-xs select-none w-6 h-8 flex items-center justify-center rounded hover:bg-white/5 transition-colors touch-manipulation"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder step"
        >
          ≡
        </button>
      )}
      <button
        className="w-8 h-8 flex items-center justify-center text-lg select-none rounded hover:bg-white/5 transition-colors shrink-0"
        onClick={() => isAdmin && cycleStepStatus(step.projectId, step.id)}
        disabled={!isAdmin}
        title={config.label}
        aria-label={`Step status: ${config.label}`}
      >
        <span className={config.className}>{config.icon}</span>
      </button>
      <span
        className={`flex-1 truncate ${
          step.status === 'COMPLETE' ? 'line-through opacity-40' : 'text-gray-200'
        }`}
      >
        {step.content}
      </span>
      <DueDateBadge dueDate={step.dueDate} label="" />
    </div>
  )
}
