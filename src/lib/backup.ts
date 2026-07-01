import { db } from "@/db"

export interface BackupData {
  version: number
  exportedAt: string
  projects: unknown[]
  chapters: unknown[]
  scenes: unknown[]
  characters: unknown[]
  locations: unknown[]
  notes: unknown[]
}

const BACKUP_VERSION = 1

export async function createBackup(): Promise<BackupData> {
  const [projects, chapters, scenes, characters, locations, notes] = await Promise.all([
    db.projects.toArray(),
    db.chapters.toArray(),
    db.scenes.toArray(),
    db.characters.toArray(),
    db.locations.toArray(),
    db.notes.toArray(),
  ])

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    projects,
    chapters,
    scenes,
    characters,
    locations,
    notes,
  }
}

export function downloadBackup(data: BackupData): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = `writing-studio-backup-${data.exportedAt.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseBackupFile(json: string): BackupData {
  const data = JSON.parse(json) as BackupData

  if (!data.version || !data.exportedAt) {
    throw new Error("Arquivo de backup inválido: formato não reconhecido.")
  }

  const requiredTables = ["projects", "chapters", "scenes", "characters", "locations", "notes"] as const
  for (const table of requiredTables) {
    if (!Array.isArray(data[table])) {
      throw new Error(`Arquivo de backup inválido: tabela "${table}" ausente ou não é uma lista.`)
    }
  }

  return data
}

export async function restoreBackup(data: BackupData): Promise<void> {
  const tables = [db.projects, db.chapters, db.scenes, db.characters, db.locations, db.notes] as const
  await db.transaction(
    "rw",
    tables,
    async () => {
      // Clear existing data
      await Promise.all([
        db.projects.clear(),
        db.chapters.clear(),
        db.scenes.clear(),
        db.characters.clear(),
        db.locations.clear(),
        db.notes.clear(),
      ])

      // Import backup data
      await Promise.all([
        db.projects.bulkPut(data.projects as any),
        db.chapters.bulkPut(data.chapters as any),
        db.scenes.bulkPut(data.scenes as any),
        db.characters.bulkPut(data.characters as any),
        db.locations.bulkPut(data.locations as any),
        db.notes.bulkPut(data.notes as any),
      ])
    }
  )
}
