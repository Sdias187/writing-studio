import { useEffect, useRef } from "react"
import type { Editor } from "@tiptap/react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import type { ToolbarGroupDef } from "./toolbar-config"

interface OverflowMenuProps {
  editor: Editor
  groups: ToolbarGroupDef[]
  isOpen: boolean
  onClose: () => void
}

export function OverflowMenu({ editor, groups, isOpen, onClose }: OverflowMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  const animProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.95, y: 4 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
      }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          {...animProps}
          role="menu"
          aria-label="More formatting options"
          className="absolute bottom-full mb-3 right-0 min-w-[200px] bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/[0.06] rounded-xl shadow-2xl shadow-black/50 p-2 z-50"
          onMouseDown={(e) => e.preventDefault()}
        >
          {groups.map((group) => (
            <div key={group.id} role="none">
              {group.label && (
                <div
                  className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-wider uppercase text-ink-tertiary/60"
                  role="none"
                >
                  {group.label}
                </div>
              )}
              <div className="flex flex-wrap gap-0.5" role="none">
                {group.buttons.map((def) => (
                  <div key={def.id} role="none" className="overflow-menu-item-wrapper" onMouseDown={(e) => e.preventDefault()}>
                    <button
                      role="menuitem"
                      title={def.tooltip}
                      aria-label={def.ariaLabel}
                      aria-disabled={def.isDisabled?.(editor)}
                      disabled={def.isDisabled?.(editor)}
                      onClick={(e) => {
                        e.preventDefault()
                        if (def.isDisabled?.(editor)) return
                        def.action(editor)
                        onClose()
                      }}
                      className={`
                        flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg
                        text-sm transition-colors duration-100
                        ${def.isActive(editor) ? "bg-accent-subtle text-accent" : "text-ink-secondary hover:bg-white/[0.07] hover:text-ink-primary"}
                        ${def.isDisabled?.(editor) ? "opacity-25 pointer-events-none" : "cursor-pointer"}
                        focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px]
                      `}
                    >
                      <def.icon size={16} className="shrink-0" />
                      <span>{def.label}</span>
                    </button>
                  </div>
                ))}
              </div>
              <div role="none" className="h-1" />
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
