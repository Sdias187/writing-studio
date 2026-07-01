import { useEffect, useRef, useState, useCallback } from "react"
import type { Editor } from "@tiptap/react"
import { Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Minus } from "lucide-react"

interface SlashMenuProps {
  editor: Editor
}

interface SlashItem {
  label: string
  icon: typeof Heading1
  action: (editor: Editor) => boolean
}

export function SlashMenu({ editor }: SlashMenuProps) {
  const [show, setShow] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  const items: SlashItem[] = [
    { label: "Título 1", icon: Heading1, action: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: "Título 2", icon: Heading2, action: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Título 3", icon: Heading3, action: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: "Lista", icon: List, action: (ed) => ed.chain().focus().toggleBulletList().run() },
    { label: "Lista ordenada", icon: ListOrdered, action: (ed) => ed.chain().focus().toggleOrderedList().run() },
    { label: "Citação", icon: Quote, action: (ed) => ed.chain().focus().toggleBlockquote().run() },
    { label: "Bloco de código", icon: Code, action: (ed) => ed.chain().focus().toggleCodeBlock().run() },
    { label: "Linha horizontal", icon: Minus, action: (ed) => ed.chain().focus().setHorizontalRule().run() },
  ]

  const handleAction = useCallback((item: SlashItem) => {
    item.action(editor)
    setShow(false)
  }, [editor])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!show) {
        if (event.key === "/") {
          const { view } = editor
          const coords = view.coordsAtPos(view.state.selection.from)
          setPosition({ top: coords.bottom + 4, left: coords.left })
          setShow(true)
          setSelectedIndex(0)
        }
        return
      }

      if (event.key === "ArrowDown") {
        event.preventDefault()
        setSelectedIndex((i) => (i + 1) % items.length)
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        setSelectedIndex((i) => (i - 1 + items.length) % items.length)
      } else if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault()
        handleAction(items[selectedIndex])
      } else if (event.key === "Escape") {
        event.preventDefault()
        setShow(false)
      } else if (event.key === " ") {
        setShow(false)
      } else if (event.key === "Backspace") {
        const { state } = editor
        const { selection } = state
        const textBefore = state.doc.textBetween(Math.max(0, selection.from - 2), selection.from)
        if (textBefore !== "/") {
          setShow(false)
        }
      }
    },
    [show, selectedIndex, items, editor, handleAction]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  if (!show) return null

  return (
    <div
      ref={menuRef}
      className="slash-menu fixed z-50"
      style={{ top: position.top, left: position.left }}
    >
      {items.map((item, index) => {
        const Icon = item.icon
        return (
          <button
            key={item.label}
            className={`slash-menu-item ${index === selectedIndex ? "is-selected" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault()
              handleAction(item)
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
