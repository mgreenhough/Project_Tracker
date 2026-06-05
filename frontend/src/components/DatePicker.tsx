import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parse } from 'date-fns'
import 'react-day-picker/dist/style.css'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  onConfirm: (confirmedValue?: string) => void
  onCancel: () => void
  placeholder?: string
}

export function DatePicker({ value, onChange, onConfirm, onCancel, placeholder = 'dd/mm/yy' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const justSelectedRef = useRef(false)
  
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
        // Don't confirm if we just selected a date (prevents double confirm)
        if (justSelectedRef.current) {
          justSelectedRef.current = false
          setIsOpen(false)
          return
        }
        setIsOpen(false)
        onConfirm(value)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onConfirm, value])
  
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = formatDate(date)
      justSelectedRef.current = true
      onChange(formattedDate)
      setIsOpen(false)
      onConfirm(formattedDate)
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
        justSelectedRef.current = true
        onConfirm(newValue)
      }
    }
  }
  
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsOpen(false)
      onConfirm(value)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      onCancel()
    }
  }
  
  const handleInputBlur = () => {
    // Delay to allow calendar clicks to register
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        // Don't confirm if we just selected/confirmed a date (prevents double confirm)
        if (justSelectedRef.current) {
          justSelectedRef.current = false
          setIsOpen(false)
          return
        }
        setIsOpen(false)
        onConfirm(value)
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
        autoFocus
      />
      
      {isOpen && (
        <div className="absolute z-[100] mt-1 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-w-[calc(100vw-2rem)] overflow-auto">
          <style>{`
            .rdp {
              --rdp-cell-size: 32px;
              --rdp-accent-color: #3b82f6;
              --rdp-background-color: #1f2937;
              margin: 0;
            }
            @media (max-width: 640px) {
              .rdp {
                --rdp-cell-size: 28px;
              }
              .rdp-caption_label {
                font-size: 0.875rem;
              }
              .rdp-head_cell {
                font-size: 0.75rem;
              }
              .rdp-day {
                font-size: 0.875rem;
              }
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
          {value && (
            <button
              type="button"
              onClick={() => {
                justSelectedRef.current = true
                onChange('')
                setIsOpen(false)
                onConfirm('')
              }}
              className="mt-2 w-full py-1 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors border border-red-900/50"
            >
              Clear Date
            </button>
          )}
        </div>
      )}
    </div>
  )
}