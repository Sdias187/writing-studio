import { create } from "zustand"
import type { HeadingInfo } from "@/types"

export type SaveStatus = "saved" | "saving" | "unsaved"

interface EditorState {
  content: object | null
  wordCount: number
  saveStatus: SaveStatus
  isFocusMode: boolean
  editor: any | null
  headings: HeadingInfo[]
  activeHeading: string

  setContent: (content: object) => void
  setWordCount: (count: number) => void
  setEditor: (editor: any) => void
  setFocusMode: (enabled: boolean) => void
  setHeadings: (headings: HeadingInfo[]) => void
  setActiveHeading: (text: string) => void

  save: () => Promise<void>
  autoSave: () => Promise<void>
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export const useEditorStore = create<EditorState>((set, get) => ({
  content: null,
  wordCount: 0,
  saveStatus: "saved",
  isFocusMode: false,
  editor: null,
  headings: [],
  activeHeading: "",

  setContent: (content: object) => {
    set({ content, saveStatus: "unsaved" })
  },

  setWordCount: (wordCount: number) => {
    set({ wordCount })
  },

  setEditor: (editor: any) => {
    set({ editor })
  },

  setFocusMode: (isFocusMode: boolean) => {
    set({ isFocusMode })
  },

  setHeadings: (headings: HeadingInfo[]) => {
    set({ headings })
  },

  setActiveHeading: (text: string) => {
    set({ activeHeading: text })
  },

  save: async () => {
    const { editor, content } = get()

    // Try to get content from editor first (most current), fall back to store
    let json = content
    if (editor?.getJSON) {
      json = editor.getJSON() as object
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
