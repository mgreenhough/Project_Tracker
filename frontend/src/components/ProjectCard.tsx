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

export function ProjectCard({ project, isAdmin, isArchived = false, dragHandleProps }: ProjectCardProps) {
  const reorderSteps = useProjectStore((s) => s.reorderSteps)
  const steps = [...project.steps].sort((a, b) => a.stepOrder - b.stepOrder)

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
        relative min-w-[280px] max-w-[320px] rounded-xl p-4 flex flex-col gap-3
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
        <h3
          className={`font-semibold truncate flex-1 ${
            isArchived ? 'text-gray-400' : 'text-white'
          }`}
        >
          {project.title}
        </h3>
      </div>

      <DueDateBadge dueDate={project.dueDate} />

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
    </div>
  )
}
