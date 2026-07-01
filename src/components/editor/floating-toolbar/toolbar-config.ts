import type { Editor } from "@tiptap/react"
import type { ComponentType } from "react"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Undo2,
  Redo2,
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Image,
  Table,
  Quote,
  Code,
  Minus,
  Palette,
  Highlighter,
  MessageSquarePlus,
  Sparkles,
  MoreHorizontal,
} from "lucide-react"

export interface ToolbarButtonDef {
  id: string
  icon: ComponentType<{ size?: number; className?: string }>
  label: string
  ariaLabel: string
  tooltip: string
  action: (editor: Editor) => void
  isActive: (editor: Editor) => boolean
  isDisabled?: (editor: Editor) => boolean
}

export interface ToolbarGroupDef {
  id: string
  label?: string
  buttons: ToolbarButtonDef[]
}

function promptForUrl(): string | null {
  return window.prompt("Enter URL:")
}

function promptForImageUrl(): string | null {
  return window.prompt("Enter image URL:")
}

export const primaryGroups: ToolbarGroupDef[] = [
  {
    id: "undo-redo",
    buttons: [
      {
        id: "undo",
        icon: Undo2,
        label: "Undo",
        ariaLabel: "Undo (Ctrl+Z)",
        tooltip: "Undo",
        action: (editor) => editor.chain().focus().undo().run(),
        isActive: () => false,
        isDisabled: (editor) => !editor.can().undo(),
      },
      {
        id: "redo",
        icon: Redo2,
        label: "Redo",
        ariaLabel: "Redo (Ctrl+Shift+Z)",
        tooltip: "Redo",
        action: (editor) => editor.chain().focus().redo().run(),
        isActive: () => false,
        isDisabled: (editor) => !editor.can().redo(),
      },
    ],
  },
  {
    id: "text-style",
    buttons: [
      {
        id: "bold",
        icon: Bold,
        label: "Bold",
        ariaLabel: "Bold (Ctrl+B)",
        tooltip: "Bold",
        action: (editor) => editor.chain().focus().toggleBold().run(),
        isActive: (editor) => editor.isActive("bold"),
      },
      {
        id: "italic",
        icon: Italic,
        label: "Italic",
        ariaLabel: "Italic (Ctrl+I)",
        tooltip: "Italic",
        action: (editor) => editor.chain().focus().toggleItalic().run(),
        isActive: (editor) => editor.isActive("italic"),
      },
      {
        id: "underline",
        icon: Underline,
        label: "Underline",
        ariaLabel: "Underline (Ctrl+U)",
        tooltip: "Underline",
        action: (editor) => editor.chain().focus().toggleUnderline().run(),
        isActive: (editor) => editor.isActive("underline"),
      },
      {
        id: "strike",
        icon: Strikethrough,
        label: "Strike",
        ariaLabel: "Strikethrough",
        tooltip: "Strikethrough",
        action: (editor) => editor.chain().focus().toggleStrike().run(),
        isActive: (editor) => editor.isActive("strike"),
      },
    ],
  },
  {
    id: "headings",
    buttons: [
      {
        id: "paragraph",
        icon: Pilcrow,
        label: "Paragraph",
        ariaLabel: "Paragraph",
        tooltip: "Paragraph",
        action: (editor) => editor.chain().focus().setParagraph().run(),
        isActive: (editor) => editor.isActive("paragraph"),
      },
      {
        id: "heading-1",
        icon: Heading1,
        label: "Heading 1",
        ariaLabel: "Heading 1",
        tooltip: "Heading 1",
        action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: (editor) => editor.isActive("heading", { level: 1 }),
      },
      {
        id: "heading-2",
        icon: Heading2,
        label: "Heading 2",
        ariaLabel: "Heading 2",
        tooltip: "Heading 2",
        action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: (editor) => editor.isActive("heading", { level: 2 }),
      },
      {
        id: "heading-3",
        icon: Heading3,
        label: "Heading 3",
        ariaLabel: "Heading 3",
        tooltip: "Heading 3",
        action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: (editor) => editor.isActive("heading", { level: 3 }),
      },
    ],
  },
  {
    id: "lists",
    buttons: [
      {
        id: "bullet-list",
        icon: List,
        label: "Bullet List",
        ariaLabel: "Bullet List",
        tooltip: "Bullet List",
        action: (editor) => editor.chain().focus().toggleBulletList().run(),
        isActive: (editor) => editor.isActive("bulletList"),
      },
      {
        id: "ordered-list",
        icon: ListOrdered,
        label: "Ordered List",
        ariaLabel: "Ordered List",
        tooltip: "Ordered List",
        action: (editor) => editor.chain().focus().toggleOrderedList().run(),
        isActive: (editor) => editor.isActive("orderedList"),
      },
      {
        id: "checklist",
        icon: CheckSquare,
        label: "Checklist",
        ariaLabel: "Checklist",
        tooltip: "Checklist",
        action: (editor) => editor.chain().focus().toggleTaskList().run(),
        isActive: (editor) => editor.isActive("taskList"),
      },
    ],
  },
  {
    id: "insert-link",
    buttons: [
      {
        id: "link",
        icon: Link,
        label: "Link",
        ariaLabel: "Insert Link",
        tooltip: "Link",
        action: (editor) => {
          const url = promptForUrl()
          if (url === null) return
          if (url === "") {
            editor.chain().focus().unsetLink().run()
            return
          }
          editor.chain().focus().setLink({ href: url }).run()
        },
        isActive: (editor) => editor.isActive("link"),
      },
    ],
  },
]

export const overflowGroups: ToolbarGroupDef[] = [
  {
    id: "alignment",
    label: "Alignment",
    buttons: [
      {
        id: "align-left",
        icon: AlignLeft,
        label: "Align Left",
        ariaLabel: "Align Left",
        tooltip: "Align Left",
        action: (editor) => editor.chain().focus().setTextAlign("left").run(),
        isActive: (editor) => editor.isActive({ textAlign: "left" }),
      },
      {
        id: "align-center",
        icon: AlignCenter,
        label: "Align Center",
        ariaLabel: "Align Center",
        tooltip: "Align Center",
        action: (editor) => editor.chain().focus().setTextAlign("center").run(),
        isActive: (editor) => editor.isActive({ textAlign: "center" }),
      },
      {
        id: "align-right",
        icon: AlignRight,
        label: "Align Right",
        ariaLabel: "Align Right",
        tooltip: "Align Right",
        action: (editor) => editor.chain().focus().setTextAlign("right").run(),
        isActive: (editor) => editor.isActive({ textAlign: "right" }),
      },
      {
        id: "align-justify",
        icon: AlignJustify,
        label: "Justify",
        ariaLabel: "Justify",
        tooltip: "Justify",
        action: (editor) => editor.chain().focus().setTextAlign("justify").run(),
        isActive: (editor) => editor.isActive({ textAlign: "justify" }),
      },
    ],
  },
  {
    id: "insert",
    label: "Insert",
    buttons: [
      {
        id: "image",
        icon: Image,
        label: "Image",
        ariaLabel: "Insert Image",
        tooltip: "Image",
        action: (editor) => {
          const url = promptForImageUrl()
          if (!url) return
          editor.chain().focus().setImage({ src: url }).run()
        },
        isActive: () => false,
        isDisabled: (editor) => !editor.can().setImage?.({ src: "" }),
      },
      {
        id: "table",
        icon: Table,
        label: "Table",
        ariaLabel: "Insert Table",
        tooltip: "Table",
        action: (editor) =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
        isActive: (editor) => editor.isActive("table"),
      },
      {
        id: "blockquote",
        icon: Quote,
        label: "Blockquote",
        ariaLabel: "Blockquote",
        tooltip: "Quote",
        action: (editor) => editor.chain().focus().toggleBlockquote().run(),
        isActive: (editor) => editor.isActive("blockquote"),
      },
      {
        id: "code-block",
        icon: Code,
        label: "Code Block",
        ariaLabel: "Code Block",
        tooltip: "Code Block",
        action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
        isActive: (editor) => editor.isActive("codeBlock"),
      },
      {
        id: "horizontal-rule",
        icon: Minus,
        label: "Horizontal Rule",
        ariaLabel: "Horizontal Rule",
        tooltip: "Horizontal Rule",
        action: (editor) => editor.chain().focus().setHorizontalRule().run(),
        isActive: () => false,
      },
    ],
  },
  {
    id: "colors",
    label: "Colors",
    buttons: [
      {
        id: "text-color",
        icon: Palette,
        label: "Text Color",
        ariaLabel: "Text Color",
        tooltip: "Text Color",
        action: () => {}, // handled by ToolbarColors
        isActive: (editor) => editor.isActive("textStyle") && !!editor.getAttributes("textStyle").color,
      },
      {
        id: "highlight",
        icon: Highlighter,
        label: "Highlight",
        ariaLabel: "Highlight",
        tooltip: "Highlight",
        action: () => {}, // handled by ToolbarColors
        isActive: (editor) => editor.isActive("highlight"),
      },
    ],
  },
  {
    id: "writer-tools",
    label: "Tools",
    buttons: [
      {
        id: "comments",
        icon: MessageSquarePlus,
        label: "Comments",
        ariaLabel: "Add Comment",
        tooltip: "Comment",
        action: () => {}, // placeholder
        isActive: () => false,
        isDisabled: () => true,
      },
      {
        id: "focus-mode",
        icon: Sparkles,
        label: "Focus Mode",
        ariaLabel: "Toggle Focus Mode",
        tooltip: "Focus Mode",
        action: (editor) => {
          // Dispatch a custom event that editor.tsx listens for
          window.dispatchEvent(new CustomEvent("toggle-focus-mode"))
        },
        isActive: () => false,
      },
    ],
  },
]

export const moreIcon = MoreHorizontal

export function getAllButtons(): ToolbarButtonDef[] {
  return [...primaryGroups.flatMap((g) => g.buttons), ...overflowGroups.flatMap((g) => g.buttons)]
}
