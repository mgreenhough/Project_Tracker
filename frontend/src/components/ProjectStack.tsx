import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { memo, useState, useRef, useCallback, useEffect } from 'react'
import { ProjectCard } from './ProjectCard'
import type { Project } from '../types'

function computeAutoZoom(projectCount: number): number {
  const isMobile = window.innerWidth < 768
  const isPortrait = window.innerHeight > window.innerWidth
  if (isMobile && isPortrait && projectCount > 1) {
    const cardWidth = 320
    const availableWidth = window.innerWidth - 32 // padding
    const neededOverlap = (projectCount * cardWidth - availableWidth) / (projectCount - 1)
    return Math.min(1, Math.max(0, neededOverlap / cardWidth))
  }
  return 0
}



function mapDisplayToZoom(display: number, autoZoom: number): number {
  if (autoZoom <= 0) return display
  return Math.min(1, display / autoZoom)
}

interface ProjectStackProps {
  projects: Project[]
  isAdmin: boolean
  onReorder: (orderedIds: string[]) => void | Promise<void>
}

const SortableProjectCard = memo(function SortableProjectCard({
  project,
  isAdmin,
  overlap,
  index,
  total,
  frontProjectId,
  onBringToFront,
  style: extraStyle,
  isOverlay = false,
}: {
  project: Project
  isAdmin: boolean
  overlap: number
  index: number
  total: number
  frontProjectId: string | null
  onBringToFront: (id: string | null) => void
  style?: React.CSSProperties
  isOverlay?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const isFront = frontProjectId === project.id
  const baseZIndex = isDragging ? 100 : total - index
  const zIndex = isFront ? 200 : baseZIndex
  const hasFront = frontProjectId !== null
  const isBackCard = hasFront && !isFront

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: index === 0 ? 0 : -overlap,
    marginTop: index * -52,
    zIndex,
    opacity: isDragging && !isOverlay ? 0.3 : isBackCard ? 0.4 : 1,
    ...extraStyle,
  }

  const handleClick = useCallback(() => {
    if (frontProjectId !== project.id) {
      onBringToFront(project.id)
    }
  }, [onBringToFront, project.id, frontProjectId])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex-shrink-0 animate-fade-in-up"
      data-project-card="true"
      onClick={handleClick}
    >
      <ProjectCard
        project={project}
        isAdmin={isAdmin}
        isArchived={false}
        isFront={isFront}
        isLeftmost={index === 0}
        dragHandleProps={isAdmin ? { attributes, listeners } : undefined}
      />
    </div>
  )
})

export const ProjectStack = memo(function ProjectStack({ projects, isAdmin, onReorder }: ProjectStackProps) {
  const autoZoom = computeAutoZoom(projects.length)
  const [displayZoom, setDisplayZoom] = useState(1) // 0-1, user-facing
  const [activeId, setActiveId] = useState<string | null>(null)
  const [orderedProjects, setOrderedProjects] = useState<Project[]>(projects)
  const [frontProjectId, setFrontProjectId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastPinchDist = useRef<number | null>(null)

  // Sync local order with prop changes
  useEffect(() => {
    setOrderedProjects(projects)
  }, [projects])

  // Recompute auto-zoom when project count changes on mobile
  useEffect(() => {
    const auto = computeAutoZoom(projects.length)
    if (auto > 0) setDisplayZoom(1)
  }, [projects.length])

  // Click outside to reset front project
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      // Check if click is inside any project card
      const isInsideCard = target.closest('[data-project-card]') !== null
      if (!isInsideCard) {
        setFrontProjectId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const zoom = mapDisplayToZoom(displayZoom, autoZoom)
  const cardWidth = 320
  const maxOverlap = cardWidth
  const overlap = zoom * maxOverlap

  const activeProject = activeId ? orderedProjects.find((p) => p.id === activeId) : null
  const activeIndex = activeId ? orderedProjects.findIndex((p) => p.id === activeId) : -1

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setDisplayZoom((prev) => {
        const delta = e.deltaY > 0 ? 0.05 : -0.05
        return Math.min(1, Math.max(0, prev + delta))
      })
    }
    // Without Ctrl/Meta, let the browser handle native vertical scrolling
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
      setDisplayZoom((prev) => Math.min(1, Math.max(0, prev + delta)))
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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setOrderedProjects((items) => {
        const oldIndex = items.findIndex((p) => p.id === active.id)
        const newIndex = items.findIndex((p) => p.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return items
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      setOrderedProjects((items) => {
        const oldIndex = items.findIndex((p) => p.id === active.id)
        const newIndex = items.findIndex((p) => p.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return items
        const reordered = arrayMove(items, oldIndex, newIndex)
        onReorder(reordered.map((p) => p.id))
        return reordered
      })
    }
  }, [onReorder])

  return (
    <div className="relative">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-gray-500">Zoom</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={displayZoom}
          onChange={(e) => setDisplayZoom(parseFloat(e.target.value))}
          className="w-32 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
        />
        <span className="text-xs text-gray-500 w-8">{Math.round(displayZoom * 100)}%</span>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedProjects.map((p) => p.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div
            ref={containerRef}
            className={`flex overflow-y-visible pb-4 scrollbar-thin ${displayZoom >= 1 ? 'overflow-x-hidden' : 'overflow-x-auto'}`}
            style={{
              paddingLeft: 0,
              alignItems: 'flex-start',
              paddingTop: orderedProjects.length > 1 ? (orderedProjects.length - 1) * 52 : 0,
              minHeight: 420 + (orderedProjects.length > 1 ? (orderedProjects.length - 1) * 52 : 0),
            }}
          >
            {orderedProjects.map((project, index) => (
              <SortableProjectCard
                key={project.id}
                project={project}
                isAdmin={isAdmin}
                overlap={overlap}
                index={index}
                total={orderedProjects.length}
                frontProjectId={frontProjectId}
                onBringToFront={setFrontProjectId}
                style={{ animationDelay: `${index * 40}ms` }}
              />
            ))}
            {orderedProjects.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500 w-full">
                <svg className="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm italic">No active projects.</span>
                <span className="text-xs text-gray-600">Create a project to get started.</span>
              </div>
            )}
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {activeProject ? (
            <div
              className="flex-shrink-0"
              style={{
                marginLeft: activeIndex === 0 ? 0 : -overlap,
                marginTop: activeIndex * -52,
                zIndex: 100,
                transform: 'scale(1.05)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                cursor: 'grabbing',
              }}
            >
              <ProjectCard
                project={activeProject}
                isAdmin={isAdmin}
                isArchived={false}
                isFront={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
})