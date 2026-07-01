export interface Project {
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface Chapter {
  id: string
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
  projectId: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface Location {
  id: string
  projectId: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}
