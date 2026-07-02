import { create } from "zustand"
import type { Editor } from "@tiptap/react"
import type { HeadingInfo } from "@/types"

export type SearchResult = { from: number; to: number }

export type SaveStatus = "saved" | "saving" | "unsaved"

export type EditorFont = "sans" | "serif" | "mono" | "literata" | "playfair"

export const FONT_OPTIONS: { id: EditorFont; label: string; className: string; preview: string }[] = [
  { id: "sans", label: "Inter", className: "font-sans", preview: "Inter" },
  { id: "serif", label: "Georgia", className: "font-serif", preview: "Georgia" },
  { id: "mono", label: "JetBrains Mono", className: "font-mono", preview: "JetBrains Mono" },
  { id: "literata", label: "Literata", className: "font-literata", preview: "Literata" },
  { id: "playfair", label: "Playfair Display", className: "font-playfair", preview: "Playfair Display" },
]

interface EditorState {
  content: object | null
  wordCount: number
  saveStatus: SaveStatus
  isFocusMode: boolean
  typewriterMode: boolean
  editorFont: EditorFont
  editor: Editor | null
  headings: HeadingInfo[]
  activeHeading: string

  setContent: (content: object) => void
  setWordCount: (count: number) => void
  setEditor: (editor: Editor | null) => void
  setFocusMode: (enabled: boolean) => void
  setTypewriterMode: (enabled: boolean) => void
  setEditorFont: (font: EditorFont) => void
  setHeadings: (headings: HeadingInfo[]) => void
  setActiveHeading: (text: string) => void

  searchOpen: boolean
  searchQuery: string
  searchResults: SearchResult[]
  searchIndex: number

  setSearchOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  setSearchResults: (results: SearchResult[], index: number) => void
  setSearchIndex: (index: number) => void

  save: () => Promise<void>
  autoSave: () => Promise<void>
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export const useEditorStore = create<EditorState>((set, get) => ({
  content: null,
  wordCount: 0,
  saveStatus: "saved",
  isFocusMode: false,
  typewriterMode: false,
  editorFont: "sans",
  editor: null,
  headings: [],
  activeHeading: "",
  searchOpen: false,
  searchQuery: "",
  searchResults: [],
  searchIndex: 0,

  setContent: (content: object) => {
    set({ content, saveStatus: "unsaved" })
  },

  setWordCount: (wordCount: number) => {
    set({ wordCount })
  },

  setEditor: (editor: Editor | null) => {
    set({ editor })
  },

  setFocusMode: (isFocusMode: boolean) => {
    set({ isFocusMode })
  },

  setTypewriterMode: (typewriterMode: boolean) => {
    set({ typewriterMode })
  },

  setEditorFont: (editorFont: EditorFont) => {
    set({ editorFont })
  },

  setHeadings: (headings: HeadingInfo[]) => {
    set({ headings })
  },

  setActiveHeading: (text: string) => {
    set({ activeHeading: text })
  },

  setSearchOpen: (open: boolean) => {
    set({ searchOpen: open })
    if (!open) {
      set({ searchQuery: "", searchResults: [], searchIndex: 0 })
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  setSearchResults: (results: SearchResult[], index: number) => {
    set({ searchResults: results, searchIndex: index })
  },

  setSearchIndex: (index: number) => {
    set({ searchIndex: index })
  },

  save: async () => {
    const { editor, content } = get()

    // Try to get content from editor first (most current), fall back to store
    let json = content
    if (editor?.getJSON) {
      json = editor.getJSON()
    }

    if (!json) return

    set({ saveStatus: "saving" })
    const { useProjectStore } = await import("@/stores/project-store")
    await useProjectStore.getState().updateProjectContent(json)
    // Update store content to stay in sync
    set({ content: json, saveStatus: "saved" })
  },

  autoSave: async () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      get().save()
    }, 1500)
  },
}))
