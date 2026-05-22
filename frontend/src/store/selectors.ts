import type { Project } from '../types'
import { differenceInCalendarDays, parse } from 'date-fns'

export const activeProjectsSorted = (projects: Project[], activeTabId?: string | null): Project[] =>
  projects
    .filter((p) => !p.isArchived && !p.isDeleted && p.isPublic && (!activeTabId || p.tabId === activeTabId || p.tabId === null))
    .sort((a, b) => a.priorityIndex - b.priorityIndex)

export const archivedProjectsSorted = (projects: Project[], activeTabId?: string | null): Project[] =>
  projects
    .filter((p) => p.isArchived && !p.isDeleted && (!activeTabId || p.tabId === activeTabId || p.tabId === null))
    .sort((a, b) => a.priorityIndex - b.priorityIndex)

export type UrgencyLevel = 'high' | 'medium' | 'low'

export const urgencyLevel = (dueDate: string | null): UrgencyLevel | null => {
  if (!dueDate) return null
  const parsed = parse(dueDate, 'dd/MM/yy', new Date())
  if (isNaN(parsed.getTime())) return null
  const days = differenceInCalendarDays(parsed, new Date())
  if (days <= 7) return 'high'
  if (days <= 14) return 'medium'
  return 'low'
}

export const urgencyColor = (level: UrgencyLevel | null): string => {
  switch (level) {
    case 'high':
      return 'text-neon-red'
    case 'medium':
      return 'text-neon-orange'
    case 'low':
    default:
      return 'text-neon-green'
  }
}

export const urgencyBorderColor = (level: UrgencyLevel | null): string => {
  switch (level) {
    case 'high':
      return 'border-neon-red'
    case 'medium':
      return 'border-neon-orange'
    case 'low':
    default:
      return 'border-gray-700'
  }
}

export const urgencyBgColor = (level: UrgencyLevel | null): string => {
  switch (level) {
    case 'high':
      return 'bg-red-950/30'
    case 'medium':
      return 'bg-orange-950/30'
    case 'low':
    default:
      return ''
  }
}