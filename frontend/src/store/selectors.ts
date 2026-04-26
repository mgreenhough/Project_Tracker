import type { Project } from '../types'
import { differenceInCalendarDays, parseISO } from 'date-fns'

export const activeProjectsSorted = (projects: Project[]): Project[] =>
  projects
    .filter((p) => !p.isArchived && !p.isDeleted && p.isPublic)
    .sort((a, b) => a.priorityIndex - b.priorityIndex)

export const archivedProjectsSorted = (projects: Project[]): Project[] =>
  projects
    .filter((p) => p.isArchived && !p.isDeleted)
    .sort((a, b) => a.priorityIndex - b.priorityIndex)

export type UrgencyLevel = 'high' | 'medium' | 'low'

export const urgencyLevel = (dueDate: string | null): UrgencyLevel | null => {
  if (!dueDate) return null
  const days = differenceInCalendarDays(parseISO(dueDate), new Date())
  if (days <= 7) return 'high'
  if (days <= 14) return 'medium'
  return 'low'
}

export const urgencyColor = (level: UrgencyLevel | null): string => {
  switch (level) {
    case 'high':
      return 'text-red-400'
    case 'medium':
      return 'text-orange-400'
    case 'low':
    default:
      return 'text-white'
  }
}
