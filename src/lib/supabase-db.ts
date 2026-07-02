import { supabase } from "@/lib/supabase"
import type { Project, Character, Location, Note } from "@/types"

// ─── Projects ───

export async function getProjects(userId: string): Promise<Project[]> {
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  return (data ?? []).map(mapProject)
}

export async function getProject(id: string): Promise<Project | undefined> {
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single()

  return data ? mapProject(data) : undefined
}

export async function saveProject(project: Project): Promise<void> {
  const record = toProjectRow(project)

  const { error } = await supabase
    .from("projects")
    .upsert(record, { onConflict: "id" })

  if (error) throw error
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)

  if (error) throw error
}

// ─── Characters ───

export async function getCharacters(projectId: string): Promise<Character[]> {
  const { data } = await supabase
    .from("characters")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })

  return (data ?? []).map(mapCharacter)
}

export async function saveCharacter(char: Character): Promise<void> {
  const { error } = await supabase
    .from("characters")
    .upsert(toCharacterRow(char), { onConflict: "id" })

  if (error) throw error
}

export async function deleteCharacter(id: string): Promise<void> {
  const { error } = await supabase
    .from("characters")
    .delete()
    .eq("id", id)

  if (error) throw error
}

// ─── Locations ───

export async function getLocations(projectId: string): Promise<Location[]> {
  const { data } = await supabase
    .from("locations")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })

  return (data ?? []).map(mapLocation)
}

export async function saveLocation(loc: Location): Promise<void> {
  const { error } = await supabase
    .from("locations")
    .upsert(toLocationRow(loc), { onConflict: "id" })

  if (error) throw error
}

export async function deleteLocation(id: string): Promise<void> {
  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", id)

  if (error) throw error
}

// ─── Notes ───

export async function getNotes(projectId: string): Promise<Note[]> {
  const { data } = await supabase
    .from("notes")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })

  return (data ?? []).map(mapNote)
}

export async function saveNote(note: Note): Promise<void> {
  const { error } = await supabase
    .from("notes")
    .upsert(toNoteRow(note), { onConflict: "id" })

  if (error) throw error
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)

  if (error) throw error
}

// ─── Mappers (Supabase snake_case → TypeScript camelCase) ───

interface ProjectRow {
  id: string
  user_id: string
  title: string
  description: string
  content: object | null
  chapter_synopses: Record<string, string>
  created_at: string
  updated_at: string
}

interface CharacterRow {
  id: string
  user_id: string
  project_id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

interface LocationRow {
  id: string
  user_id: string
  project_id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

interface NoteRow {
  id: string
  user_id: string
  project_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    content: row.content,
    chapterSynopses: row.chapter_synopses ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toProjectRow(project: Project): ProjectRow {
  return {
    id: project.id,
    user_id: project.userId,
    title: project.title,
    description: project.description,
    content: project.content,
    chapter_synopses: project.chapterSynopses,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  }
}

function mapCharacter(row: CharacterRow): Character {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toCharacterRow(char: Character): CharacterRow {
  return {
    id: char.id,
    user_id: char.userId,
    project_id: char.projectId,
    name: char.name,
    description: char.description,
    created_at: char.createdAt,
    updated_at: char.updatedAt,
  }
}

function mapLocation(row: LocationRow): Location {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toLocationRow(loc: Location): LocationRow {
  return {
    id: loc.id,
    user_id: loc.userId,
    project_id: loc.projectId,
    name: loc.name,
    description: loc.description,
    created_at: loc.createdAt,
    updated_at: loc.updatedAt,
  }
}

function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toNoteRow(note: Note): NoteRow {
  return {
    id: note.id,
    user_id: note.userId,
    project_id: note.projectId,
    title: note.title,
    content: note.content,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  }
}
