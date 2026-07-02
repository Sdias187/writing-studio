import { useEffect, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Extension } from "@tiptap/core"
import Underline from "@tiptap/extension-underline"
import Placeholder from "@tiptap/extension-placeholder"
import LinkExtension from "@tiptap/extension-link"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import TextAlign from "@tiptap/extension-text-align"
import Color from "@tiptap/extension-color"
import TextStyle from "@tiptap/extension-text-style"
import Highlight from "@tiptap/extension-highlight"
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import ImageExtension from "@tiptap/extension-image"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { common, createLowlight } from "lowlight"
import { BubbleMenu } from "./bubble-menu"
import { SlashMenu } from "./slash-menu"
import { FloatingToolbar } from "./floating-toolbar/floating-toolbar"
import { SearchPanel } from "./search-panel"
import { searchPlugin } from "./search-plugin"
import { useEditorStore } from "@/stores/editor-store"
import { useProjectStore } from "@/stores/project-store"
import { wordCount, parseHeadings } from "@/lib/utils"
import { clearSearchDecorations } from "./search-plugin"

const lowlight = createLowlight(common)

function navigateHeading(direction: "next" | "prev", editor: any) {
  const { headings } = useEditorStore.getState()
  if (headings.length === 0) return
  const currentPos = editor.state.selection.from

  if (direction === "next") {
    const next = headings.find((h) => h.pos > currentPos) ?? headings[0]
    editor.commands.setTextSelection({ from: next.pos, to: next.pos })
    editor.commands.scrollIntoView()
  } else {
    const prev = [...headings].reverse().find((h) => h.pos < currentPos) ?? headings[headings.length - 1]
    editor.commands.setTextSelection({ from: prev.pos, to: prev.pos })
    editor.commands.scrollIntoView()
  }
}

export function Editor() {
  const contentRef = useRef<object | null>(null)
  const initialLoadDone = useRef(false)
  const isFocusMode = useEditorStore((s) => s.isFocusMode)
  const setEditor = useEditorStore((s) => s.setEditor)
  const setWordCount = useEditorStore((s) => s.setWordCount)
  const setHeadings = useEditorStore((s) => s.setHeadings)
  const setFocusMode = useEditorStore((s) => s.setFocusMode)
  const setActiveHeading = useEditorStore((s) => s.setActiveHeading)
  const setSearchOpen = useEditorStore((s) => s.setSearchOpen)
  const searchOpen = useEditorStore((s) => s.searchOpen)
  const currentProject = useProjectStore((s) => s.currentProject)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Underline,
      TextStyle,
      Color,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      ImageExtension.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: "Comece a escrever..." }),
      LinkExtension.configure({ openOnClick: false }),
      Extension.create({ addProseMirrorPlugins: () => [searchPlugin] }),
    ],
    content: currentProject?.content ?? undefined,
    editorProps: {
      attributes: { class: "tiptap-editor" },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML()
      const json = ed.getJSON()
      contentRef.current = json as object

      setWordCount(wordCount(html))
      setHeadings(parseHeadings(json))
      useEditorStore.getState().autoSave()
    },
    onCreate: ({ editor: ed }) => {
      const html = ed.getHTML()
      const json = ed.getJSON()
      contentRef.current = json as object

      setWordCount(wordCount(html))
      setHeadings(parseHeadings(json))
    },
  })

  // Sync editor instance to store (once)
  useEffect(() => {
    if (editor) {
      setEditor(editor)
    }
    return () => {
      setEditor(null)
    }
  }, [editor, setEditor])

  // Load project content into editor once on mount (handles timing edge case)
  useEffect(() => {
    if (!editor || !currentProject?.content || initialLoadDone.current) return
    editor.commands.setContent(currentProject.content)
    initialLoadDone.current = true
  }, [editor, currentProject?.content])

  // Scroll tracking for breadcrumb
  useEffect(() => {
    if (!editor) return
    const editorEl = editor.view.dom.parentElement
    if (!editorEl) return

    const onScroll = () => {
      const headings = useEditorStore.getState().headings
      if (headings.length === 0) {
        setActiveHeading("")
        return
      }

      const viewportCenter = editorEl.getBoundingClientRect().top + window.innerHeight / 3
      let closest = ""
      let closestDist = Infinity

      for (const h of headings) {
        try {
          const pos = editor.view.coordsAtPos(h.pos)
          if (!pos) continue
          const dist = Math.abs(pos.top - viewportCenter)
          if (dist < closestDist) {
            closestDist = dist
            closest = h.text
          }
        } catch {
          // coordsAtPos can throw for positions outside the document
          continue
        }
      }

      setActiveHeading(closest)
    }

    editorEl.addEventListener("scroll", onScroll, { passive: true })
    return () => editorEl.removeEventListener("scroll", onScroll)
  }, [editor, setActiveHeading])

  // Beforeunload: warn if unsaved changes
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const status = useEditorStore.getState().saveStatus
      if (status === "unsaved") {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      // Save any pending content on unmount
      useEditorStore.getState().save()
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+F: toggle focus mode
      if (e.key === "F" && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        setFocusMode(!isFocusMode)
      }
      // Ctrl+F: toggle search
      if (e.key === "f" && e.ctrlKey && !e.shiftKey) {
        e.preventDefault()
        setSearchOpen(!searchOpen)
        if (searchOpen) {
          clearSearchDecorations(editor)
        }
      }
      // Ctrl+Shift+↓: next heading
      if (e.key === "ArrowDown" && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        navigateHeading("next", editor)
      }
      // Ctrl+Shift+↑: previous heading
      if (e.key === "ArrowUp" && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        navigateHeading("prev", editor)
      }
      // Escape: close search
      if (e.key === "Escape" && searchOpen) {
        e.preventDefault()
        setSearchOpen(false)
        clearSearchDecorations(editor)
      }
    }

    const handleToggleFocus = () => {
      setFocusMode(!isFocusMode)
    }

    document.addEventListener("keydown", handleKeyDown)
    window.addEventListener("toggle-focus-mode", handleToggleFocus)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("toggle-focus-mode", handleToggleFocus)
    }
  }, [editor, isFocusMode, setFocusMode, searchOpen, setSearchOpen])

  const searchPanel = useMemo(() => {
    if (!editor || !searchOpen) return null
    return createPortal(
      <div className="fixed top-14 right-4 z-[100]">
        <SearchPanel editor={editor} />
      </div>,
      document.body
    )
  }, [editor, searchOpen])

  return (
    <>
      {searchPanel}
    <div className={`relative transition-all duration-300 pb-24 ${isFocusMode ? "max-w-3xl mx-auto" : ""}`}>
      <div className="relative">
          {editor && <BubbleMenu editor={editor} />}
          {editor && <SlashMenu editor={editor} />}
          <EditorContent editor={editor} />
      </div>
      {editor && <FloatingToolbar editor={editor} />}
    </div>
    </>
  )
}
