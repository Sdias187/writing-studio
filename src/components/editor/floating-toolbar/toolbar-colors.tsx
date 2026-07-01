import { useEffect, useRef } from "react"
import type { Editor } from "@tiptap/react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"

interface ToolbarColorsProps {
  editor: Editor
  type: "text" | "highlight" | null
  onClose: () => void
}

const TEXT_COLORS = [
  { label: "Default", value: undefined },
  { label: "Gray", value: "#949494" },
  { label: "Red", value: "#c94f4f" },
  { label: "Orange", value: "#d4975a" },
  { label: "Yellow", value: "#c9b45a" },
  { label: "Green", value: "#6baf6b" },
  { label: "Teal", value: "#4fa8a8" },
  { label: "Blue", value: "#5a8fc9" },
  { label: "Purple", value: "#8f6bb5" },
  { label: "Pink", value: "#c96b8f" },
]

const HIGHLIGHT_COLORS = [
  { label: "None", value: undefined },
  { label: "Yellow", value: "#c9b45a" },
  { label: "Green", value: "#6baf6b" },
  { label: "Blue", value: "#5a8fc9" },
  { label: "Purple", value: "#8f6bb5" },
  { label: "Pink", value: "#c96b8f" },
  { label: "Orange", value: "#d4975a" },
  { label: "Red", value: "#c94f4f" },
]

export function ToolbarColors({ editor, type, onClose }: ToolbarColorsProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (!type) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [type, onClose])

  const colors = type === "text" ? TEXT_COLORS : HIGHLIGHT_COLORS

  const handleColorSelect = (color: string | undefined) => {
    if (type === "text") {
      if (color) {
        editor.chain().focus().setColor(color).run()
      } else {
        editor.chain().focus().unsetColor().run()
      }
    } else {
      if (color) {
        editor.chain().focus().toggleHighlight({ color }).run()
      } else {
        editor.chain().focus().toggleHighlight().run()
      }
    }
    onClose()
  }

  return (
    <AnimatePresence>
      {type && (
        <motion.div
          ref={ref}
          initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95, y: 4 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
          transition={prefersReducedMotion ? undefined : { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
          role="listbox"
          aria-label={type === "text" ? "Text color" : "Highlight color"}
          className="absolute bottom-full mb-3 right-0 p-2.5 bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/[0.06] rounded-xl shadow-2xl shadow-black/50 z-50"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="grid grid-cols-5 gap-1.5">
            {colors.map((c) => (
              <button
                key={c.label}
                role="option"
                aria-label={c.label}
                aria-selected={c.value === undefined && type === "text" ? !editor.isActive("textStyle") : false}
                title={c.label}
                onClick={(e) => {
                  e.preventDefault()
                  handleColorSelect(c.value)
                }}
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center
                  transition-transform duration-100 hover:scale-110
                  focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2
                  ${c.value ? "" : "border border-white/10 bg-transparent"}
                `}
                style={c.value ? { backgroundColor: c.value } : undefined}
              >
                {!c.value && (
                  <svg viewBox="0 0 12 12" className="w-3 h-3 text-ink-tertiary">
                    <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
