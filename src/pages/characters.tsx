import { useEffect, useState } from "react"
import { useProjectStore } from "@/stores/project-store"
import { Plus, Trash2, Pencil, Save, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { db } from "@/db"
import { generateId } from "@/lib/utils"
import type { Character } from "@/types"

export function CharactersPage() {
  const { currentProject } = useProjectStore()
  const [characters, setCharacters] = useState<Character[]>([])
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")

  useEffect(() => {
    if (currentProject) loadCharacters()
  }, [currentProject?.id])

  const loadCharacters = async () => {
    if (!currentProject) return
    const chars = await db.characters.where("projectId").equals(currentProject.id).toArray()
    setCharacters(chars)
  }

  const handleCreate = async () => {
    if (!currentProject || !newName.trim()) return
    const char: Character = {
      id: generateId(),
      projectId: currentProject.id,
      name: newName.trim(),
      description: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.characters.put(char)
    setNewName("")
    setShowNew(false)
    loadCharacters()
  }

  const handleDelete = async (id: string) => {
    await db.characters.delete(id)
    loadCharacters()
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return
    const existing = characters.find((c) => c.id === editingId)
    if (!existing) return
    await db.characters.put({
      ...existing,
      name: editName.trim(),
      description: editDescription.trim(),
      updatedAt: new Date().toISOString(),
    })
    setEditingId(null)
    loadCharacters()
  }

  const startEdit = (char: Character) => {
    setEditingId(char.id)
    setEditName(char.name)
    setEditDescription(char.description)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-ink-primary">Personagens</h1>
          <p className="text-sm text-ink-tertiary mt-1">
            {characters.length} personagem{characters.length !== 1 ? "ns" : ""}
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={15} className="mr-1.5" /> Novo personagem
        </Button>
      </div>

      {showNew && (
        <div className="mb-6 p-4 border border-border rounded-xl bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center shrink-0">
              <User size={18} className="text-ink-tertiary" />
            </div>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate()
                if (e.key === "Escape") { setShowNew(false); setNewName("") }
              }}
              placeholder="Nome do personagem..."
              className="flex-1 bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <div className="flex gap-2 mt-3 ml-13">
            <Button onClick={handleCreate}>Criar</Button>
            <Button variant="ghost" onClick={() => { setShowNew(false); setNewName("") }}>Cancelar</Button>
          </div>
        </div>
      )}

      {characters.length === 0 && !showNew && (
        <div className="text-center py-16">
          <User size={40} className="mx-auto text-ink-tertiary mb-3 opacity-40" />
          <h2 className="text-base font-medium text-ink-primary mb-1">Nenhum personagem</h2>
          <p className="text-sm text-ink-tertiary mb-4">
            Personagens ajudam a manter o controle de quem é quem na sua história.
          </p>
          <Button onClick={() => setShowNew(true)}>
            <Plus size={15} className="mr-1.5" /> Criar personagem
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {characters.map((char) => (
          <div
            key={char.id}
            className="group border border-border rounded-xl bg-surface hover:bg-elevated transition-colors"
          >
            {editingId === char.id ? (
              <div className="p-4 space-y-3">
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nome"
                  className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary outline-none focus:border-accent/50"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Descrição, personalidade, aparência..."
                  rows={3}
                  className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary outline-none focus:border-accent/50 resize-none"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit}>
                    <Save size={14} className="mr-1.5" /> Salvar
                  </Button>
                  <Button variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4">
                <div className="w-9 h-9 rounded-full bg-accent-subtle flex items-center justify-center shrink-0 mt-0.5">
                  <User size={16} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-ink-primary">{char.name}</h3>
                  {char.description && (
                    <p className="text-xs text-ink-secondary mt-1 line-clamp-2">{char.description}</p>
                  )}
                  <p className="text-[10px] text-ink-tertiary mt-1.5">
                    Criado em {new Date(char.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => startEdit(char)}
                    className="text-ink-tertiary hover:text-ink-primary p-1.5 rounded-lg hover:bg-chrome transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(char.id)}
                    className="text-ink-tertiary hover:text-error p-1.5 rounded-lg hover:bg-chrome transition-colors"
                    title="Deletar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
