import { useState, useRef, useEffect } from 'react'
import { TERMS, type TermKey } from './terms'

interface TooltipProps {
  term: TermKey
  label?: string
}

export function Tooltip({ term, label }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const text = TERMS[term]
  if (!text) return null

  return (
    <span className="relative inline-flex items-center" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Explain ${label || term}`}
        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 hover:bg-blue-100 hover:text-blue-600 text-[10px] font-bold leading-none transition-colors flex-shrink-0 cursor-pointer"
      >
        ?
      </button>
      {open && (
        <div className="absolute bottom-6 left-0 z-50 w-64 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl leading-relaxed">
          {label && <div className="font-semibold mb-1 text-blue-300">{label}</div>}
          {text}
          <div className="absolute -bottom-1.5 left-3 w-3 h-3 bg-gray-900 rotate-45" />
        </div>
      )}
    </span>
  )
}
