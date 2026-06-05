import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parse } from 'date-fns'
import 'react-day-picker/dist/style.css'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  onConfirm: () => void
  onCancel: () => void
  placeholder?: string
}

export function DatePicker({ value, onChange, onConfirm, onCancel, placeholder = 'dd/mm/yy' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Parse dd/mm/yy to Date
  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined
    const regex = /^\d{2}\/\d{2}\/\d{2}$/
    if (!regex.test(dateStr)) return undefined
    try {
      const parsed = parse(dateStr, 'dd/MM/yy', new Date())
      return isNaN(parsed.getTime()) ? undefined : parsed
    } catch {
      return undefined
    }
  }
  
  // Format Date to dd/mm/yy
  const formatDate = (date: Date): string => {
    return format(date, 'dd/MM/yy')
  }
  
  const selectedDate = parseDate(value)
  
  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        onConfirm()
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onConfirm])
  
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(formatDate(date))
      setIsOpen(false)
      onConfirm()
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Auto-confirm if valid date entered manually
    const regex = /^\d{2}\/\d{2}\/\d{2}$/
    if (regex.test(newValue)) {
      const parsed = parseDate(newValue)
      if (parsed) {
        onConfirm()
      }
    }
  }
  
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsOpen(false)
      onConfirm()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      onCancel()
    }
  }
  
  const handleInputBlur = () => {
    // Delay to allow calendar clicks to register
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsOpen(false)
        onConfirm()
      }
    }, 150)
  }
  
  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        className="bg-transparent border-b border-neon-blue text-xs font-medium outline-none w-20 text-white"
      />
      
      {isOpen && (
        <div className="absolute z-50 mt-1 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
          <style>{`
            .rdp {
              --rdp-cell-size: 36px;
              --rdp-accent-color: #3b82f6;
              --rdp-background-color: #1f2937;
              margin: 0;
            }
            .rdp-day_selected {
              background-color: #3b82f6 !important;
              color: #111827 !important;
            }
            .rdp-day_today {
              color: #22c55e;
              font-weight: bold;
            }
            .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
              background-color: #374151;
              color: white;
            }
            .rdp-caption_label {
              color: #e5e7eb;
            }
            .rdp-head_cell {
              color: #6b7280;
            }
            .rdp-day {
              color: #d1d5db;
            }
            .rdp-day_outside {
              color: #4b5563;
            }
            .rdp-nav_button {
              color: #9ca3af;
            }
            .rdp-nav_button:hover {
              color: white;
              background-color: #374151;
            }
          `}</style>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            weekStartsOn={1}
          />
        </div>
      )}
    </div>
  )
}