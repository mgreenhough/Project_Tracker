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
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ProjectCard } from './ProjectCard'
import type { Project } from '../types'

interface ProjectStackProps {
  projects: Project[]
  isAdmin: boolean
  onReorder: (orderedIds: string[]) => void
}

function SortableProjectCard({
  project,
  isAdmin,
}: {
  project: Project
  isAdmin: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <ProjectCard
        project={project}
        isAdmin={isAdmin}
        isArchived={false}
        dragHandleProps={isAdmin ? { attributes, listeners } : undefined}
      />
    </div>
  )
}

export function ProjectStack({ projects, isAdmin, onReorder }: ProjectStackProps) {
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
      const oldIndex = projects.findIndex((p) => p.id === active.id)
      const newIndex = projects.findIndex((p) => p.id === over.id)
      const reordered = arrayMove(projects, oldIndex, newIndex)
      onReorder(reordered.map((p) => p.id))
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={projects.map((p) => p.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {projects.map((project) => (
            <SortableProjectCard
              key={project.id}
              project={project}
              isAdmin={isAdmin}
            />
          ))}
          {projects.length === 0 && (
            <div className="text-gray-500 italic py-8">No active projects.</div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  )
}
