import { supabase } from "@/lib/supabase"

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

async function fetchAll(table: string) {
  const { data } = await supabase.from(table).select("*")
  return data ?? []
}

export async function createBackup(): Promise<BackupData> {
  const [projects, chapters, scenes, characters, locations, notes] = await Promise.all([
    fetchAll("projects"),
    fetchAll("chapters"),
    fetchAll("scenes"),
    fetchAll("characters"),
    fetchAll("locations"),
    fetchAll("notes"),
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
  const tables = ["projects", "chapters", "scenes", "characters", "locations", "notes"] as const

  // Delete all current user's data from each table
  for (const table of tables) {
    await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000")
  }

  // Insert backup data into each table
  for (const table of tables) {
    const rows = data[table]
    if (rows.length > 0) {
      const { error } = await supabase.from(table).insert(rows as any)
      if (error) throw error
    }
  }
}
