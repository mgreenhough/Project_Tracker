import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
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
  
  // Calculate and set calendar position when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      const calendarWidth = 320 // Approximate calendar width
      const calendarHeight = 350 // Approximate calendar height
      
      let left = rect.left
      let top = rect.bottom + 8
      
      // Prevent going off right edge of screen
      if (left + calendarWidth > window.innerWidth) {
        left = window.innerWidth - calendarWidth - 16
      }
      
      // Prevent going off bottom edge - show above input instead
      if (top + calendarHeight > window.innerHeight) {
        top = rect.top - calendarHeight - 8
      }
      
      // Prevent going off left edge
      if (left < 8) {
        left = 8
      }
      
      setCalendarPosition({ top, left })
    }
  }, [isOpen])
  
  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      // Check if click is inside input container OR inside calendar (portal)
      const isInsideContainer = containerRef.current?.contains(target) ?? false
      const isInsideCalendar = calendarRef.current?.contains(target) ?? false
      
      if (!isInsideContainer && !isInsideCalendar) {
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
  
  // Handle window resize
  useEffect(() => {
    function handleResize() {
      if (isOpen && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect()
        const calendarWidth = 320
        const calendarHeight = 350
        
        let left = rect.left
        let top = rect.bottom + 8
        
        if (left + calendarWidth > window.innerWidth) {
          left = window.innerWidth - calendarWidth - 16
        }
        if (top + calendarHeight > window.innerHeight) {
          top = rect.top - calendarHeight - 8
        }
        if (left < 8) left = 8
        
        setCalendarPosition({ top, left })
      }
    }
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [isOpen])
  
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
  
  const calendarContent = (
    <div 
      ref={calendarRef}
      className="fixed z-[9999] p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl"
      style={{ 
        top: calendarPosition.top, 
        left: calendarPosition.left,
        maxWidth: 'calc(100vw - 16px)',
        maxHeight: 'calc(100vh - 16px)',
      }}
    >
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
  )
  
  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
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
      
      {isOpen && createPortal(calendarContent, document.body)}
    </div>
  )
}