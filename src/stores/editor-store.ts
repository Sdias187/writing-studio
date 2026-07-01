import { create } from "zustand"
import type { Scene } from "@/types"
import { db, saveScene, getScene } from "@/db"

export type SaveStatus = "saved" | "saving" | "unsaved"

interface EditorState {
  activeSceneId: string | null
  activeScene: Scene | null
  content: object | null
  title: string
  wordCount: number
  saveStatus: SaveStatus
  isFocusMode: boolean
  editor: any | null

  setActiveScene: (sceneId: string) => Promise<void>
  setContent: (content: object) => void
  setTitle: (title: string) => void
  setWordCount: (count: number) => void
  setEditor: (editor: any) => void
  setFocusMode: (enabled: boolean) => void

  save: () => Promise<void>
  autoSave: () => Promise<void>
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export const useEditorStore = create<EditorState>((set, get) => ({
  activeSceneId: null,
  activeScene: null,
  content: null,
  title: "",
  wordCount: 0,
  saveStatus: "saved",
  isFocusMode: false,
  editor: null,

  setActiveScene: async (sceneId: string) => {
    const scene = await getScene(sceneId)
    if (!scene) return
    set({
      activeSceneId: sceneId,
      activeScene: scene,
      content: scene.content,
      title: scene.title,
      wordCount: scene.wordCount,
      saveStatus: "saved",
    })
  },

  setContent: (content: object) => {
    set({ content, saveStatus: "unsaved" })
  },

  setTitle: (title: string) => {
    set({ title, saveStatus: "unsaved" })
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

  save: async () => {
    const { activeSceneId, content, title, wordCount } = get()
    if (!activeSceneId || !content) return

    set({ saveStatus: "saving" })

    await saveScene({
      id: activeSceneId,
      chapterId: get().activeScene?.chapterId ?? "",
      projectId: get().activeScene?.projectId ?? "",
      title,
      content,
      wordCount,
      order: get().activeScene?.order ?? 0,
      createdAt: get().activeScene?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    set({ saveStatus: "saved" })
  },

  autoSave: async () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      get().save()
    }, 1500)
  },
}))
