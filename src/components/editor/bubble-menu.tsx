import { useCallback } from "react"
import type { Editor } from "@tiptap/react"
import { Bold, Italic, Underline, Strikethrough, Code, Quote } from "lucide-react"
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react"

interface BubbleMenuProps {
  editor: Editor
}

export function BubbleMenu({ editor }: BubbleMenuProps) {
  const handleAction = useCallback(
    (fn: () => boolean) => {
      fn()
      editor.chain().focus().run()
    },
    [editor]
  )

  return (
    <TiptapBubbleMenu editor={editor} tippyOptions={{ duration: 150 }}>
      <div className="bubble-menu">
        <button
          onClick={() => handleAction(() => editor.chain().toggleBold().run())}
          className={editor.isActive("bold") ? "is-active" : ""}
          title="Negrito"
        >
          <Bold size={15} />
        </button>
        <button
          onClick={() => handleAction(() => editor.chain().toggleItalic().run())}
          className={editor.isActive("italic") ? "is-active" : ""}
          title="Itálico"
        >
          <Italic size={15} />
        </button>
        <button
          onClick={() => handleAction(() => editor.chain().toggleUnderline().run())}
          className={editor.isActive("underline") ? "is-active" : ""}
          title="Sublinhado"
        >
          <Underline size={15} />
        </button>
        <button
          onClick={() => handleAction(() => editor.chain().toggleStrike().run())}
          className={editor.isActive("strike") ? "is-active" : ""}
          title="Tachado"
        >
          <Strikethrough size={15} />
        </button>
        <button
          onClick={() => handleAction(() => editor.chain().toggleCode().run())}
          className={editor.isActive("code") ? "is-active" : ""}
          title="Código"
        >
          <Code size={15} />
        </button>
        <button
          onClick={() => handleAction(() => editor.chain().toggleBlockquote().run())}
          className={editor.isActive("blockquote") ? "is-active" : ""}
          title="Citação"
        >
          <Quote size={15} />
        </button>
      </div>
    </TiptapBubbleMenu>
  )
}
