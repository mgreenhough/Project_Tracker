import { memo, useState, useCallback, useEffect, useRef } from 'react'
import { useCheckIn } from '../hooks/useCheckIn'

const INTERVAL_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
]

export const CheckInSettings = memo(function CheckInSettings() {
  const { preferences, savePreferences } = useCheckIn()
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownStyle({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const handleIntervalChange = useCallback((minutes: number) => {
    savePreferences({ intervalMinutes: minutes })
    setIsOpen(false)
  }, [savePreferences])

  const handleEnabledToggle = useCallback(() => {
    savePreferences({ enabled: !preferences.enabled })
  }, [preferences.enabled, savePreferences])

  const currentLabel = INTERVAL_OPTIONS.find((opt) => opt.value === preferences.intervalMinutes)?.label || `${preferences.intervalMinutes} min`

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="px-3 py-2 text-xs text-neon-blue border border-neon-blue/40 bg-neon-blue/10 hover:bg-neon-blue/20 rounded-lg transition-colors tap-active flex items-center gap-2"
        title="Check-in Settings"
      >
        <span>{preferences.enabled ? '⏱' : '🔕'}</span>
        <span>{preferences.enabled ? currentLabel : 'Off'}</span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-[9999] animate-fade-in"
          style={{
            ...dropdownStyle,
            width: '224px',
          }}
        >
          <div className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Check-in Settings</h3>

            {/* Enabled Toggle */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <span className="text-sm text-gray-300">Enabled</span>
              <button
                onClick={handleEnabledToggle}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  preferences.enabled ? 'bg-neon-green/50' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    preferences.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Interval Selection */}
            {preferences.enabled && (
              <div>
                <span className="text-xs text-gray-400 block mb-2">Check-in interval</span>
                <div className="grid grid-cols-2 gap-2">
                  {INTERVAL_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleIntervalChange(option.value)}
                      className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                        preferences.intervalMinutes === option.value
                          ? 'bg-neon-blue/20 text-neon-blue border-neon-blue/40'
                          : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!preferences.enabled && (
              <p className="text-xs text-gray-500 italic">
                Timers will run continuously without check-in prompts
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
})
