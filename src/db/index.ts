import Dexie, { type EntityTable } from "dexie"
import type { Project, Chapter, Scene, Character, Location, Note } from "@/types"

export class AzothDB extends Dexie {
  projects!: EntityTable<Project, "id">
  chapters!: EntityTable<Chapter, "id">
  scenes!: EntityTable<Scene, "id">
  characters!: EntityTable<Character, "id">
  locations!: EntityTable<Location, "id">
  notes!: EntityTable<Note, "id">

  constructor() {
    super("azoth")
    this.version(3).stores({
      projects: "id, title, createdAt, updatedAt",
      chapters: "id, projectId, order",
      scenes: "id, chapterId, projectId, order",
      characters: "id, projectId",
      locations: "id, projectId",
      notes: "id, projectId",
    })

    this.version(4).stores({
      projects: "id, title, createdAt, updatedAt",
      chapters: "id, projectId, order",
      scenes: "id, chapterId, projectId, order",
      characters: "id, projectId",
      locations: "id, projectId",
      notes: "id, projectId",
    }).upgrade((tx) => {
      // Add content field to all existing projects
      tx.table("projects").toCollection().modify((project: any) => {
        project.content = null
        project.chapterSynopses = {}
      })
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
  const tables = [db.projects, db.chapters, db.scenes, db.characters, db.locations, db.notes] as const
  await db.transaction("rw", tables, async () => {
    await db.projects.delete(id)
    await db.chapters.where("projectId").equals(id).delete()
    await db.scenes.where("projectId").equals(id).delete()
    await db.characters.where("projectId").equals(id).delete()
    await db.locations.where("projectId").equals(id).delete()
    await db.notes.where("projectId").equals(id).delete()
  })
}


// -- Notes --

export async function getNotes(projectId: string): Promise<Note[]> {
  return db.notes.where("projectId").equals(projectId).toArray()
}

export async function saveNote(note: Note): Promise<void> {
  await db.notes.put(note)
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id)
}
