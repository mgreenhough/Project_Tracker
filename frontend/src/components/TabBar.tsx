import { memo, useState, useCallback, useRef, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import { useTabStore } from '../store/useTabStore'
import type { Tab } from '../types'

interface SortableTabItemProps {
  tab: Tab
  isActive: boolean
  isAdmin: boolean
  onSelect: (id: string) => void
  onToggleVisibility: (id: string, visibility: 'public' | 'private') => void
  onDelete: (id: string) => void
}

const SortableTabItem = memo(function SortableTabItem({
  tab, isActive, isAdmin, onSelect, onToggleVisibility, onDelete
}: SortableTabItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [nameValue, setNameValue] = useState(tab.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id })

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleConfirm = useCallback(() => {
    setIsEditing(false)
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== tab.name) {
      useTabStore.getState().updateTabById(tab.id, { name: trimmed })
    }
  }, [nameValue, tab.id, tab.name])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleConfirm()
    else if (e.key === 'Escape') {
      setIsEditing(false)
      setNameValue(tab.name)
    }
  }, [handleConfirm, tab.name])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium cursor-pointer
        transition-colors select-none
        ${isActive
          ? 'bg-gray-800 text-white border-t border-l border-r border-gray-700'
          : 'bg-gray-900/60 text-gray-400 hover:bg-gray-800/80 hover:text-gray-200'
        }
      `}
      onClick={() => onSelect(tab.id)}
    >
      {isAdmin && (
        <span
          className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 mr-1"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </span>
      )}

      {isEditing && isAdmin ? (
        <input
          ref={inputRef}
          type="text"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          onBlur={handleConfirm}
          onKeyDown={handleKeyDown}
          className="w-24 bg-transparent border-b border-neon-blue text-white text-sm outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="truncate max-w-[120px]"
          onClick={() => isAdmin && setIsEditing(true)}
        >
          {tab.name}
        </span>
      )}

      <span
        className={`
          text-[10px] px-1.5 py-0.5 rounded border
          ${tab.visibility === 'public'
            ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
            : 'text-gray-500 border-gray-600/30 bg-gray-600/10'
          }
        `}
        onClick={(e) => {
          e.stopPropagation()
          if (isAdmin) {
            onToggleVisibility(tab.id, tab.visibility === 'public' ? 'private' : 'public')
          }
        }}
        title={isAdmin ? 'Click to toggle visibility' : tab.visibility}
      >
        {tab.visibility === 'public' ? 'Pub' : 'Prv'}
      </span>

      {isAdmin && (
        <button
          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity text-xs ml-1"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(tab.id)
          }}
          title="Delete tab"
        >
          ×
        </button>
      )}
    </div>
  )
})

interface TabBarProps {
  isAdmin: boolean
}

export const TabBar = memo(function TabBar({ isAdmin }: TabBarProps) {
  const tabs = useTabStore((s) => s.tabs)
  const activeTabId = useTabStore((s) => s.activeTabId)
  const addTab = useTabStore((s) => s.addTab)
  const removeTab = useTabStore((s) => s.removeTab)
  const setActiveTabId = useTabStore((s) => s.setActiveTabId)
  const updateTabById = useTabStore((s) => s.updateTabById)
  const reorderTabs = useTabStore((s) => s.reorderTabs)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [orderedTabs, setOrderedTabs] = useState<Tab[]>(tabs)

  useEffect(() => {
    setOrderedTabs(tabs)
  }, [tabs])

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

  const handleAddTab = useCallback(() => {
    addTab({ name: 'New Tab', visibility: 'private' })
  }, [addTab])

  const handleSelect = useCallback((id: string) => {
    setActiveTabId(id)
  }, [setActiveTabId])

  const handleToggleVisibility = useCallback((id: string, visibility: 'public' | 'private') => {
    updateTabById(id, { visibility })
  }, [updateTabById])

  const handleDelete = useCallback((id: string) => {
    if (tabs.length <= 1) return
    removeTab(id)
  }, [removeTab, tabs.length])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setOrderedTabs((items) => {
        const oldIndex = items.findIndex((t) => t.id === active.id)
        const newIndex = items.findIndex((t) => t.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return items
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = orderedTabs.findIndex((t) => t.id === active.id)
      const newIndex = orderedTabs.findIndex((t) => t.id === over.id)
      const reordered = arrayMove(orderedTabs, oldIndex, newIndex)
      setOrderedTabs(reordered)
      reorderTabs(reordered.map((t) => t.id))
    }
  }, [orderedTabs, reorderTabs])

  const activeTab = activeId ? orderedTabs.find((t) => t.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-end gap-1 border-b border-gray-700 mb-4 overflow-x-auto scrollbar-thin">
        <SortableContext
          items={orderedTabs.map((t) => t.id)}
          strategy={horizontalListSortingStrategy}
        >
          {orderedTabs.map((tab) => (
            <SortableTabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              isAdmin={isAdmin}
              onSelect={handleSelect}
              onToggleVisibility={handleToggleVisibility}
              onDelete={handleDelete}
            />
          ))}
        </SortableContext>
        {isAdmin && (
          <button
            className="px-3 py-2 text-sm text-gray-500 hover:text-neon-blue hover:bg-gray-800/60 rounded-t-lg transition-colors mb-0.5"
            onClick={handleAddTab}
            title="Add new tab"
          >
            + Tab
          </button>
        )}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTab ? (
          <div
            className="group relative flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium cursor-pointer bg-gray-800 text-white border-t border-l border-r border-gray-700 select-none"
            style={{ transform: 'scale(1.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
          >
            <span className="truncate max-w-[120px]">{activeTab.name}</span>
            <span
              className={`
                text-[10px] px-1.5 py-0.5 rounded border
                ${activeTab.visibility === 'public'
                  ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
                  : 'text-gray-500 border-gray-600/30 bg-gray-600/10'
                }
              `}
            >
              {activeTab.visibility === 'public' ? 'Pub' : 'Prv'}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
})