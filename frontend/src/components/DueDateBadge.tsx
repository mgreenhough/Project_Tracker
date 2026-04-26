import { urgencyLevel, urgencyColor } from '../store/selectors'

interface DueDateBadgeProps {
  dueDate: string | null
  label?: string
}

export function DueDateBadge({ dueDate, label = 'Due' }: DueDateBadgeProps) {
  if (!dueDate) {
    return <span className="text-xs text-gray-500">{label}: —</span>
  }

  const level = urgencyLevel(dueDate)
  const colorClass = urgencyColor(level)

  return (
    <span className={`text-xs font-medium ${colorClass}`}>
      {label}: {dueDate}
    </span>
  )
}
