import Dexie, { type EntityTable } from "dexie"
import type { Project, Chapter, Scene, Character, Location } from "@/types"

export class AzothDB extends Dexie {
  projects!: EntityTable<Project, "id">
  chapters!: EntityTable<Chapter, "id">
  scenes!: EntityTable<Scene, "id">
  characters!: EntityTable<Character, "id">
  locations!: EntityTable<Location, "id">

  constructor() {
    super("azoth")
    this.version(2).stores({
      projects: "id, title, createdAt, updatedAt",
      chapters: "id, projectId, order",
      scenes: "id, chapterId, projectId, order",
      characters: "id, projectId",
      locations: "id, projectId",
    })
  }
}

export const db = new AzothDB()

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id)
}

export async function getProjects(): Promise<Project[]> {
  return db.projects.orderBy("updatedAt").reverse().toArray()
}

export async function saveProject(project: Project): Promise<void> {
  await db.projects.put(project)
}

export async function deleteProject(id: string): Promise<void> {
  await db.transaction("rw", db.projects, db.chapters, db.scenes, db.characters, db.locations, async () => {
    await db.projects.delete(id)
    await db.chapters.where("projectId").equals(id).delete()
    await db.scenes.where("projectId").equals(id).delete()
    await db.characters.where("projectId").equals(id).delete()
    await db.locations.where("projectId").equals(id).delete()
  })
}

export async function getChapters(projectId: string): Promise<Chapter[]> {
  return db.chapters.where("projectId").equals(projectId).sortBy("order")
}

export async function saveChapter(chapter: Chapter): Promise<void> {
  await db.chapters.put(chapter)
}

export async function deleteChapter(id: string): Promise<void> {
  await db.transaction("rw", db.chapters, db.scenes, async () => {
    await db.chapters.delete(id)
    await db.scenes.where("chapterId").equals(id).delete()
  })
}

export async function getScenes(chapterId: string): Promise<Scene[]> {
  return db.scenes.where("chapterId").equals(chapterId).sortBy("order")
}

export async function getScene(id: string): Promise<Scene | undefined> {
  return db.scenes.get(id)
}

export async function saveScene(scene: Scene): Promise<void> {
  await db.scenes.put(scene)
}

export async function deleteScene(id: string): Promise<void> {
  await db.scenes.delete(id)
}

export async function reorderItems<T extends { id: string; order: number }>(
  table: EntityTable<T, string>,
  items: { id: string; order: number }[]
): Promise<void> {
  await db.transaction("rw", table, async () => {
    for (const item of items) {
      await table.update(item.id as any, { order: item.order } as any)
    }
  })
}
