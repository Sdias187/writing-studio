import { create } from "zustand"
import type { Project } from "@/types"
import { getProjects, saveProject, deleteProject as dbDeleteProject } from "@/lib/supabase-db"
import { generateId } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean

  loadProjects: () => Promise<void>
  setCurrentProject: (project: Project) => Promise<void>
  createProject: (title: string, description?: string) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  updateProjectContent: (content: object) => Promise<void>
  saveSynopsis: (chapterId: string, synopsis: string) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,

  loadProjects: async () => {
    const user = useAuthStore.getState().user
    if (!user) return

    set({ isLoading: true })
    const projects = await getProjects(user.id)
    set({ projects, isLoading: false })
  },

  setCurrentProject: async (project: Project) => {
    set({ currentProject: project })
  },

  createProject: async (title: string, description = "") => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error("User not authenticated")

    const project: Project = {
      id: generateId(),
      userId: user.id,
      title,
      description,
      content: null,
      chapterSynopses: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await saveProject(project)
    const projects = await getProjects(user.id)
    set({ projects })
    return project
  },

  deleteProject: async (id: string) => {
    const user = useAuthStore.getState().user
    if (!user) return

    await dbDeleteProject(id)
    const projects = await getProjects(user.id)
    set({ projects })
  },

  updateProjectContent: async (content: object) => {
    const { currentProject } = get()
    if (!currentProject) return
    const updated: Project = {
      ...currentProject,
      content,
      updatedAt: new Date().toISOString(),
    }
    await saveProject(updated)
    set({ currentProject: updated })
  },

  saveSynopsis: async (chapterId: string, synopsis: string) => {
    const { currentProject } = get()
    if (!currentProject) return
    const updated: Project = {
      ...currentProject,
      chapterSynopses: {
        ...currentProject.chapterSynopses,
        [chapterId]: synopsis,
      },
      updatedAt: new Date().toISOString(),
    }
    await saveProject(updated)
    set({ currentProject: updated })
  },
}))
