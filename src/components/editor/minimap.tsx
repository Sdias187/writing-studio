import { useCallback, useEffect, useRef, useState } from "react"
import type { Editor } from "@tiptap/react"

interface Block {
  type: string
  level?: number
  textLen: number
}

interface MinimapProps {
  editor: Editor
}

export function Minimap({ editor }: MinimapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [viewport, setViewport] = useState({ top: 0, height: 100 })

  // Rebuild blocks when content changes
  useEffect(() => {
    // Wait a tick for editor to be ready
    const id = setTimeout(() => {
      const json = editor.getJSON() as any
      if (!json?.content) {
        setBlocks([])
        return
      }
      const b: Block[] = []
      for (const node of json.content) {
        if (node.type === "heading") {
          b.push({ type: "heading", level: node.attrs?.level ?? 1, textLen: textLength(node) })
        } else if (node.type === "paragraph") {
          b.push({ type: "paragraph", textLen: textLength(node) })
        } else if (node.type === "codeBlock" || node.type === "blockquote") {
          b.push({ type: node.type, textLen: textLength(node) })
        } else if (
          node.type === "bulletList" ||
          node.type === "orderedList" ||
          node.type === "taskList"
        ) {
          // Flatten list items
          let len = 0
          if (node.content) {
            for (const item of node.content) {
              if (item.content) {
                for (const child of item.content) {
                  len += textLength(child)
                }
              }
            }
          }
          b.push({ type: "list", textLen: len || 1 })
        } else if (node.type === "horizontalRule") {
          b.push({ type: "hr", textLen: 1 })
        } else {
          b.push({ type: "other", textLen: textLength(node) })
        }
      }
      setBlocks(b)
    }, 100)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, editor.state.doc.content.size])

  // Track viewport
  useEffect(() => {
    const editorEl = editor.view.dom.parentElement
    if (!editorEl) return

    const updateViewport = () => {
      const sh = editorEl.scrollHeight
      const ch = editorEl.clientHeight
      const st = editorEl.scrollTop
      if (ch >= sh) {
        setViewport({ top: 0, height: 100 })
        return
      }
      setViewport({
        top: (st / sh) * 100,
        height: (ch / sh) * 100,
      })
    }

    updateViewport()
    editorEl.addEventListener("scroll", updateViewport, { passive: true })
    return () => editorEl.removeEventListener("scroll", updateViewport)
  }, [editor])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const editorEl = editor.view.dom.parentElement
      if (!editorEl) return
      const y = (e.clientY - rect.top) / rect.height
      editorEl.scrollTo({ top: y * editorEl.scrollHeight, behavior: "smooth" })
    },
    [editor]
  )

  const totalLen = blocks.reduce((s, b) => s + Math.max(b.textLen, 1), 0) || 1
  const MIN_H = 2

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="w-3 cursor-pointer relative select-none shrink-0"
      style={{ minHeight: 120 }}
    >
      {/* Blocks */}
      <div className="absolute inset-0 flex flex-col gap-px px-px">
        {blocks.map((b, i) => {
          const pct = (Math.max(b.textLen, 1) / totalLen) * 100
          const h = Math.max(pct, MIN_H)
          let bg = "bg-white/[0.06]"
          if (b.type === "heading") {
            bg = b.level === 1 ? "bg-accent" : b.level === 2 ? "bg-accent/60" : "bg-accent/40"
          } else if (b.type === "codeBlock") {
            bg = "bg-white/[0.12]"
          } else if (b.type === "hr") {
            bg = "bg-border"
          } else if (b.type === "list") {
            bg = "bg-white/[0.04]"
          }
          return <div key={i} className={`shrink-0 rounded-[1px] ${bg}`} style={{ height: `${Math.max(h, 1.5)}%` }} />
        })}
      </div>

      {/* Viewport overlay */}
      <div
        className="absolute left-0 right-0 bg-white/[0.07] border border-white/[0.04] rounded-sm pointer-events-none"
        style={{
          top: `${viewport.top}%`,
          height: `${viewport.height}%`,
          minHeight: viewport.top > 0 ? 8 : undefined,
        }}
      />
    </div>
  )
}

function textLength(node: any): number {
  if (!node) return 0
  if (node.type === "text" && typeof node.text === "string") return node.text.length
  if (node.content) {
    return node.content.reduce((s: number, c: any) => s + textLength(c), 0)
  }
  return 0
}
