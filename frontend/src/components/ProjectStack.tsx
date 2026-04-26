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
import { useState, useRef, useCallback, useEffect } from 'react'
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
  overlap,
  index,
  total,
}: {
  project: Project
  isAdmin: boolean
  overlap: number
  index: number
  total: number
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
    marginLeft: index === 0 ? 0 : -overlap,
    marginTop: index * 24,
    zIndex: isDragging ? 100 : total - index,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative flex-shrink-0">
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
  const [zoom, setZoom] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastPinchDist = useRef<number | null>(null)

  const maxOverlap = 220
  const overlap = zoom * maxOverlap

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setZoom((prev) => {
        const delta = e.deltaY > 0 ? 0.05 : -0.05
        return Math.min(1, Math.max(0, prev + delta))
      })
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy)
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const delta = (dist - lastPinchDist.current) / 400
      lastPinchDist.current = dist
      setZoom((prev) => Math.min(1, Math.max(0, prev + delta)))
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = null
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

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
    <div className="relative">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-gray-500">Zoom</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-32 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
        />
        <span className="text-xs text-gray-500 w-8">{Math.round(zoom * 100)}%</span>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={projects.map((p) => p.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div
            ref={containerRef}
            className="flex overflow-x-auto pb-4 scrollbar-thin min-h-[300px] landscape:min-h-[420px]"
            style={{ paddingLeft: 0 }}
          >
            {projects.map((project, index) => (
              <SortableProjectCard
                key={project.id}
                project={project}
                isAdmin={isAdmin}
                overlap={overlap}
                index={index}
                total={projects.length}
              />
            ))}
            {projects.length === 0 && (
              <div className="text-gray-500 italic py-8">No active projects.</div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}