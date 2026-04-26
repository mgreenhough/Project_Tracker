import { memo, useMemo } from 'react'
import { urgencyLevel, urgencyColor } from '../store/selectors'

interface DueDateBadgeProps {
  dueDate: string | null
  label?: string
}

export const DueDateBadge = memo(function DueDateBadge({ dueDate, label = 'Due' }: DueDateBadgeProps) {
  const colorClass = useMemo(() => {
    if (!dueDate) return ''
    const level = urgencyLevel(dueDate)
    return urgencyColor(level)
  }, [dueDate])

  if (!dueDate) {
    return <span className="text-xs text-gray-500">{label}: —</span>
  }

  return (
    <span className={`text-xs font-medium ${colorClass}`}>
      {label}: {dueDate}
    </span>
  )
})
