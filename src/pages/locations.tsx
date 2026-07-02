import { useEffect, useState } from "react"
import { useProjectStore } from "@/stores/project-store"
import { Plus, Trash2, Pencil, Save, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getLocations, saveLocation, deleteLocation } from "@/lib/supabase-db"
import { generateId } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import type { Location } from "@/types"

export function LocationsPage() {
  const { currentProject } = useProjectStore()
  const [locations, setLocations] = useState<Location[]>([])
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")

  useEffect(() => {
    if (currentProject) loadLocations()
  }, [currentProject?.id])

  const loadLocations = async () => {
    if (!currentProject) return
    const locs = await getLocations(currentProject.id)
    setLocations(locs)
  }

  const handleCreate = async () => {
    if (!currentProject || !newName.trim()) return
    const user = useAuthStore.getState().user
    const loc: Location = {
      id: generateId(),
      userId: user?.id ?? "",
      projectId: currentProject.id,
      name: newName.trim(),
      description: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await saveLocation(loc)
    setNewName("")
    setShowNew(false)
    loadLocations()
  }

  const handleDelete = async (id: string) => {
    await deleteLocation(id)
    loadLocations()
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return
    const existing = locations.find((l) => l.id === editingId)
    if (!existing) return
    await saveLocation({
      ...existing,
      name: editName.trim(),
      description: editDescription.trim(),
      updatedAt: new Date().toISOString(),
    })
    setEditingId(null)
    loadLocations()
  }

  const startEdit = (loc: Location) => {
    setEditingId(loc.id)
    setEditName(loc.name)
    setEditDescription(loc.description)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-ink-primary">Locais</h1>
          <p className="text-sm text-ink-tertiary mt-1">
            {locations.length} local{locations.length !== 1 ? "is" : ""}
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={15} className="mr-1.5" /> Novo local
        </Button>
      </div>

      {showNew && (
        <div className="mb-6 p-4 border border-border rounded-xl bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center shrink-0">
              <MapPin size={18} className="text-ink-tertiary" />
            </div>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate()
                if (e.key === "Escape") { setShowNew(false); setNewName("") }
              }}
              placeholder="Nome do local..."
              className="flex-1 bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <div className="flex gap-2 mt-3 ml-13">
            <Button onClick={handleCreate}>Criar</Button>
            <Button variant="ghost" onClick={() => { setShowNew(false); setNewName("") }}>Cancelar</Button>
          </div>
        </div>
      )}

      {locations.length === 0 && !showNew && (
        <div className="text-center py-16">
          <MapPin size={40} className="mx-auto text-ink-tertiary mb-3 opacity-40" />
          <h2 className="text-base font-medium text-ink-primary mb-1">Nenhum local</h2>
          <p className="text-sm text-ink-tertiary mb-4">
            Registre os lugares onde sua história acontece.
          </p>
          <Button onClick={() => setShowNew(true)}>
            <Plus size={15} className="mr-1.5" /> Criar local
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="group border border-border rounded-xl bg-surface hover:bg-elevated transition-colors"
          >
            {editingId === loc.id ? (
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
                  placeholder="Descrição, clima, habitantes..."
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
                <div className="w-9 h-9 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={16} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-ink-primary">{loc.name}</h3>
                  {loc.description && (
                    <p className="text-xs text-ink-secondary mt-1 line-clamp-2">{loc.description}</p>
                  )}
                  <p className="text-[10px] text-ink-tertiary mt-1.5">
                    Criado em {new Date(loc.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => startEdit(loc)}
                    className="text-ink-tertiary hover:text-ink-primary p-1.5 rounded-lg hover:bg-chrome transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(loc.id)}
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
