"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { Editor } from "@tiptap/react"
import { motion, useReducedMotion } from "motion/react"
import { useEditorStore } from "@/stores/editor-store"
import { ToolbarButton } from "./toolbar-button"
import { ToolbarDivider } from "./toolbar-divider"
import { OverflowMenu } from "./overflow-menu"
import { ToolbarColors } from "./toolbar-colors"
import { primaryGroups, overflowGroups, moreIcon } from "./toolbar-config"

const IDLE_TIMEOUT = 3000
const BLUR_DELAY = 300

function useToolbarVisibility(editor: Editor | null) {
  const [visible, setVisible] = useState(true)
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blurRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFocusMode = useEditorStore((s) => s.isFocusMode)

  const clearIdle = useCallback(() => {
    if (idleRef.current) {
      clearTimeout(idleRef.current)
      idleRef.current = null
    }
  }, [])

  const resetIdle = useCallback(() => {
    clearIdle()
    idleRef.current = setTimeout(() => setVisible(false), IDLE_TIMEOUT)
  }, [clearIdle])

  const show = useCallback(() => {
    if (blurRef.current) {
      clearTimeout(blurRef.current)
      blurRef.current = null
    }
    setVisible(true)
    resetIdle()
  }, [resetIdle])

  useEffect(() => {
    if (!editor) return

    const ed = editor as any

    const onFocus = () => show()
    const onBlur = () => {
      clearIdle()
      blurRef.current = setTimeout(() => setVisible(false), BLUR_DELAY)
    }
    const onSelectionUpdate = () => show()

    ed.on("focus", onFocus)
    ed.on("blur", onBlur)
    ed.on("selectionUpdate", onSelectionUpdate)

    // Start visible on mount
    show()

    return () => {
      ed.off("focus", onFocus)
      ed.off("blur", onBlur)
      ed.off("selectionUpdate", onSelectionUpdate)
      clearIdle()
      if (blurRef.current) clearTimeout(blurRef.current)
    }
  }, [editor, show, clearIdle])

  // Reset idle timer on any keyboard activity inside the editor
  useEffect(() => {
    const editorEl = editor?.view?.dom as HTMLElement | undefined
    if (!editorEl) return

    const onKeyDown = () => resetIdle()
    editorEl.addEventListener("keydown", onKeyDown)
    return () => editorEl.removeEventListener("keydown", onKeyDown)
  }, [editor, resetIdle])

  // Cancel hide when mouse enters toolbar
  const onMouseEnter = useCallback(() => {
    if (blurRef.current) {
      clearTimeout(blurRef.current)
      blurRef.current = null
    }
    clearIdle()
    setVisible(true)
  }, [clearIdle])

  // Restart idle when mouse leaves toolbar
  const onMouseLeave = useCallback(() => {
    resetIdle()
  }, [resetIdle])

  // Hide completely in focus mode
  const showToolbar = isFocusMode ? false : visible

  return { visible: showToolbar, onMouseEnter, onMouseLeave }
}

interface FloatingToolbarProps {
  editor: Editor
}

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const { visible, onMouseEnter, onMouseLeave } = useToolbarVisibility(editor)
  const [overflowOpen, setOverflowOpen] = useState(false)
  const [colorPickerType, setColorPickerType] = useState<"text" | "highlight" | null>(null)
  const reducedMotion = useReducedMotion()
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [, forceRender] = useState(0)

  // Re-render on editor state changes so isActive/isDisabled reflect current selection
  useEffect(() => {
    if (!editor) return
    const onStateChange = () => forceRender((n) => n + 1)
    editor.on("selectionUpdate", onStateChange)
    editor.on("update", onStateChange)
    return () => {
      editor.off("selectionUpdate", onStateChange)
      editor.off("update", onStateChange)
    }
  }, [editor])

  // Close overflow when toolbar hides
  useEffect(() => {
    if (!visible) {
      setOverflowOpen(false)
      setColorPickerType(null)
    }
  }, [visible])

  const toggleOverflow = useCallback(() => {
    setOverflowOpen((o) => !o)
    setColorPickerType(null)
  }, [])

  const closeOverflow = useCallback(() => setOverflowOpen(false), [])

  const handleColorClick = useCallback((type: "text" | "highlight") => {
    setColorPickerType((prev) => (prev === type ? null : type))
    setOverflowOpen(false)
  }, [])

  const closeColors = useCallback(() => setColorPickerType(null), [])

  const MoreIcon = moreIcon

  const animProps = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.92, y: 16 },
        animate: { opacity: visible ? 1 : 0, scale: visible ? 1 : 0.92, y: visible ? 0 : 8 },
        transition: { duration: visible ? 0.25 : 0.2, ease: [0.16, 1, 0.3, 1] },
      }

  return (
      <motion.div
        ref={toolbarRef}
        role="toolbar"
        aria-label="Formatting options"
        {...animProps}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ pointerEvents: visible ? "auto" : "none" }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-48px)]"
      >
        <div className="flex items-center h-[60px] pl-3 pr-2.5 gap-0.5 bg-[#1a1a1a]/85 backdrop-blur-2xl border border-white/[0.06] shadow-2xl shadow-black/50 rounded-full select-none">
          {/* Primary button groups */}
          {primaryGroups.map((group) => (
            <div key={group.id} className="flex items-center gap-0.5">
              <ToolbarDivider />
              {group.buttons.map((def) => (
                <ToolbarButton key={def.id} editor={editor} def={def} />
              ))}
            </div>
          ))}

          {/* Divider before More button */}
          <ToolbarDivider />

          {/* Color buttons (in overflow area but with direct picker) */}
          <div className="relative">
            <ToolbarButton
              editor={editor}
              def={{
                id: "text-color",
                icon: overflowGroups[2].buttons[0].icon,
                label: "Text Color",
                ariaLabel: "Text Color",
                tooltip: "Text Color",
                action: () => handleColorClick("text"),
                isActive: overflowGroups[2].buttons[0].isActive,
              }}
            />
            <ToolbarColors editor={editor} type={colorPickerType === "text" ? "text" : null} onClose={closeColors} />
          </div>

          <div className="relative">
            <ToolbarButton
              editor={editor}
              def={{
                id: "highlight",
                icon: overflowGroups[2].buttons[1].icon,
                label: "Highlight",
                ariaLabel: "Highlight",
                tooltip: "Highlight",
                action: () => handleColorClick("highlight"),
                isActive: overflowGroups[2].buttons[1].isActive,
              }}
            />
            <ToolbarColors editor={editor} type={colorPickerType === "highlight" ? "highlight" : null} onClose={closeColors} />
          </div>

          <ToolbarDivider />

          {/* Overflow / More button */}
          <div className="relative">
            <motion.button
              onClick={toggleOverflow}
              title="More options"
              aria-label="More formatting options"
              aria-haspopup="menu"
              aria-expanded={overflowOpen}
              whileHover={reducedMotion ? undefined : { scale: 1.04 }}
              whileTap={reducedMotion ? undefined : { scale: 0.94 }}
              transition={reducedMotion ? undefined : { scale: { type: "spring", stiffness: 400, damping: 17 } }}
              className={`
                w-10 h-10 flex items-center justify-center rounded-xl
                focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px]
                select-none transition-[background-color,box-shadow] duration-100 ease-out
                ${overflowOpen ? "bg-white/[0.1] text-ink-primary" : "text-ink-secondary hover:bg-white/[0.07] hover:text-ink-primary hover:shadow-[0_0_12px_rgba(231,197,154,0.06)]"}
              `}
            >
              <MoreIcon size={18} className="shrink-0" />
            </motion.button>

            <OverflowMenu editor={editor} groups={overflowGroups} isOpen={overflowOpen} onClose={closeOverflow} />
          </div>
        </div>
      </motion.div>
  )
}
