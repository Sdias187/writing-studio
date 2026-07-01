import { useCallback, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Placeholder from "@tiptap/extension-placeholder"
import LinkExtension from "@tiptap/extension-link"
import { BubbleMenu } from "./bubble-menu"
import { SlashMenu } from "./slash-menu"
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
      // count words for initial content
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

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+F: focus mode toggle
      if (e.key === "F" && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        setFocusMode(!isFocusMode)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [editor, isFocusMode, setFocusMode])

  return (
    <div className={`relative transition-all duration-300 ${isFocusMode ? "max-w-3xl mx-auto" : ""}`}>
      {editor && <BubbleMenu editor={editor} />}
      {editor && <SlashMenu editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}
