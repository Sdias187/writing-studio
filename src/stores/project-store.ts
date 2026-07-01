import { create } from "zustand"
import type { Project, Chapter, Scene } from "@/types"
import { getProjects, getChapters, getScenes, saveProject, saveChapter, saveScene, deleteProject as dbDeleteProject } from "@/db"
import { generateId } from "@/lib/utils"

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  chapters: Chapter[]
  scenes: Scene[]
  isLoading: boolean

  loadProjects: () => Promise<void>
  setCurrentProject: (project: Project) => Promise<void>
  createProject: (title: string, description?: string) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  loadChapters: (projectId: string) => Promise<void>
  createChapter: (projectId: string, title: string) => Promise<Chapter>
  loadScenes: (chapterId: string) => Promise<void>
  createScene: (chapterId: string, projectId: string, title: string) => Promise<Scene>
}

export const useProjectStore = create<ProjectState>((set, _get) => ({
  projects: [],
  currentProject: null,
  chapters: [],
  scenes: [],
  isLoading: false,

  loadProjects: async () => {
    set({ isLoading: true })
    const projects = await getProjects()
    set({ projects, isLoading: false })
  },

  setCurrentProject: async (project: Project) => {
    set({ currentProject: project })
    const chapters = await getChapters(project.id)
    set({ chapters })
    if (chapters.length > 0) {
      const scenes = await getScenes(chapters[0].id)
      set({ scenes })
    } else {
      set({ scenes: [] })
    }
  },

  createProject: async (title: string, description = "") => {
    const project: Project = {
      id: generateId(),
      title,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await saveProject(project)
    const projects = await getProjects()
    set({ projects })
    return project
  },

  deleteProject: async (id: string) => {
    await dbDeleteProject(id)
    const projects = await getProjects()
    set({ projects })
  },

  loadChapters: async (projectId: string) => {
    const chapters = await getChapters(projectId)
    set({ chapters })
  },

  createChapter: async (projectId: string, title: string) => {
    const chapters = await getChapters(projectId)
    const chapter: Chapter = {
      id: generateId(),
      projectId,
      title,
      order: chapters.length,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await saveChapter(chapter)
    const updated = await getChapters(projectId)
    set({ chapters: updated })

    const scene: Scene = {
      id: generateId(),
      chapterId: chapter.id,
      projectId,
      title: "Cena 1",
      content: null,
      wordCount: 0,
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await saveScene(scene)
    set({ scenes: [scene] })

    return chapter
  },

  loadScenes: async (chapterId: string) => {
    const scenes = await getScenes(chapterId)
    set({ scenes })
  },

  createScene: async (chapterId: string, projectId: string, title: string) => {
    const scenes = await getScenes(chapterId)
    const scene: Scene = {
      id: generateId(),
      chapterId,
      projectId,
      title,
      content: null,
      wordCount: 0,
      order: scenes.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await saveScene(scene)
    const updated = await getScenes(chapterId)
    set({ scenes: updated })
    return scene
  },
}))
