export interface Project {
  id: string
  userId: string
  title: string
  description: string
  content: object | null
  chapterSynopses: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface Chapter {
  id: string
  userId: string
  projectId: string
  title: string
  order: number
  status: ChapterStatus
  createdAt: string
  updatedAt: string
}

export type ChapterStatus = "draft" | "in_revision" | "completed"

export interface Scene {
  id: string
  userId: string
  chapterId: string
  projectId: string
  title: string
  content: object | null
  wordCount: number
  order: number
  createdAt: string
  updatedAt: string
}

export interface Character {
  id: string
  userId: string
  projectId: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface Location {
  id: string
  userId: string
  projectId: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  userId: string
  projectId: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface HeadingInfo {
  level: number
  text: string
  pos: number
}
