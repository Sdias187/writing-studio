import { useCallback, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
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
import { BubbleMenu } from "./bubble-menu"
import { SlashMenu } from "./slash-menu"
import { FloatingToolbar } from "./floating-toolbar/floating-toolbar"
import { useEditorStore } from "@/stores/editor-store"
import { wordCount } from "@/lib/utils"

export function Editor() {
  const {
    activeScene,
    content,
    setContent,
    setEditor,
    setWordCount,
    setFocusMode,
    isFocusMode,
    editor: storedEditor,
  } = useEditorStore()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      ImageExtension.configure({
        inline: false,
        allowBase64: false,
      }),
      Placeholder.configure({
        placeholder: "Comece a escrever...",
      }),
      LinkExtension.configure({
        openOnClick: false,
      }),
    ],
    content: content ?? undefined,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML()
      const json = ed.getJSON()
      setContent(json as object)
      setWordCount(wordCount(html))
      useEditorStore.getState().autoSave()
    },
    onCreate: ({ editor: ed }) => {
      const html = ed.getHTML()
      setWordCount(wordCount(html))
    },
  })

  // Sync editor to store
  useEffect(() => {
    if (editor && editor !== storedEditor) {
      setEditor(editor)
    }
  }, [editor, setEditor, storedEditor])

  // Load scene content when active scene changes
  useEffect(() => {
    if (editor && activeScene) {
      const currentJson = JSON.stringify(editor.getJSON())
      const newJson = JSON.stringify(activeScene.content)
      if (currentJson !== newJson) {
        editor.commands.setContent(activeScene.content ?? "")
      }
    }
  }, [activeScene?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts + custom events
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+F: focus mode toggle
      if (e.key === "F" && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        setFocusMode(!isFocusMode)
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
  }, [editor, isFocusMode, setFocusMode])

  return (
    <div className={`relative transition-all duration-300 pb-24 ${isFocusMode ? "max-w-3xl mx-auto" : ""}`}>
      {editor && <BubbleMenu editor={editor} />}
      {editor && <SlashMenu editor={editor} />}
      {editor && <FloatingToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}
