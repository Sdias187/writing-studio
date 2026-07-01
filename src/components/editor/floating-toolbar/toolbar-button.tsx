import { useCallback } from "react"
import type { Editor } from "@tiptap/react"
import { motion, useReducedMotion } from "motion/react"
import type { ToolbarButtonDef } from "./toolbar-config"
import { cn } from "@/lib/utils"

interface ToolbarButtonProps {
  editor: Editor
  def: ToolbarButtonDef
  size?: "sm" | "md"
}

export const ToolbarButton = function ToolbarButton({
  editor,
  def,
  size = "md",
}: ToolbarButtonProps) {
  const isActive = def.isActive(editor)
  const isDisabled = def.isDisabled?.(editor) ?? false
  const prefersReducedMotion = useReducedMotion()

  const handleClick = useCallback(() => {
    if (isDisabled) return
    def.action(editor)
  }, [editor, def, isDisabled])

  const dimension = size === "sm" ? "w-8 h-8" : "w-10 h-10"
  const iconSize = size === "sm" ? 16 : 18
  const Icon = def.icon

  return (
    <motion.button
      onClick={handleClick}
      disabled={isDisabled}
      title={def.tooltip}
      aria-label={def.ariaLabel}
      aria-pressed={isActive}
      aria-disabled={isDisabled}
      whileHover={prefersReducedMotion || isDisabled ? undefined : { scale: 1.04 }}
      whileTap={prefersReducedMotion || isDisabled ? undefined : { scale: 0.94 }}
      transition={prefersReducedMotion ? undefined : {
        scale: { type: "spring", stiffness: 400, damping: 17 },
      }}
      className={cn(
        dimension,
        "flex items-center justify-center rounded-xl",
        "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px]",
        "select-none",
        "transition-[background-color,box-shadow] duration-100 ease-out",
        isDisabled && "opacity-25 pointer-events-none",
        !isDisabled &&
          !isActive &&
          "text-ink-secondary hover:bg-white/[0.07] hover:text-ink-primary hover:shadow-[0_0_12px_rgba(231,197,154,0.06)]",
        isActive &&
          "bg-accent-subtle text-accent shadow-[0_0_12px_rgba(231,197,154,0.1)]"
      )}
    >
      <Icon size={iconSize} className="shrink-0" />
    </motion.button>
  )
}
