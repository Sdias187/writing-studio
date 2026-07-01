import { useEffect, useState } from "react"
import { useProjectStore } from "@/stores/project-store"
import { Plus, Trash2, Pencil, Save, StickyNote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { db } from "@/db"
import { generateId } from "@/lib/utils"
import type { Note } from "@/types"

export function NotesPage() {
  const { currentProject } = useProjectStore()
  const [notes, setNotes] = useState<Note[]>([])
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")

  useEffect(() => {
    if (currentProject) loadNotes()
  }, [currentProject?.id])

  const loadNotes = async () => {
    if (!currentProject) return
    const items = await db.notes.where("projectId").equals(currentProject.id).toArray()
    setNotes(items)
  }

  const handleCreate = async () => {
    if (!currentProject || !newTitle.trim()) return
    const note: Note = {
      id: generateId(),
      projectId: currentProject.id,
      title: newTitle.trim(),
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.notes.put(note)
    setNewTitle("")
    setShowNew(false)
    loadNotes()
  }

  const handleDelete = async (id: string) => {
    await db.notes.delete(id)
    loadNotes()
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim()) return
    const existing = notes.find((n) => n.id === editingId)
    if (!existing) return
    await db.notes.put({
      ...existing,
      title: editTitle.trim(),
      content: editContent.trim(),
      updatedAt: new Date().toISOString(),
    })
    setEditingId(null)
    loadNotes()
  }

  const startEdit = (note: Note) => {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-ink-primary">Notas</h1>
          <p className="text-sm text-ink-tertiary mt-1">
            {notes.length} nota{notes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={15} className="mr-1.5" /> Nova nota
        </Button>
      </div>

      {showNew && (
        <div className="mb-6 p-4 border border-border rounded-xl bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center shrink-0">
              <StickyNote size={18} className="text-ink-tertiary" />
            </div>
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate()
                if (e.key === "Escape") { setShowNew(false); setNewTitle("") }
              }}
              placeholder="Título da nota..."
              className="flex-1 bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <div className="flex gap-2 mt-3 ml-13">
            <Button onClick={handleCreate}>Criar</Button>
            <Button variant="ghost" onClick={() => { setShowNew(false); setNewTitle("") }}>Cancelar</Button>
          </div>
        </div>
      )}

      {notes.length === 0 && !showNew && (
        <div className="text-center py-16">
          <StickyNote size={40} className="mx-auto text-ink-tertiary mb-3 opacity-40" />
          <h2 className="text-base font-medium text-ink-primary mb-1">Nenhuma nota</h2>
          <p className="text-sm text-ink-tertiary mb-4">
            Notas são lembretes e ideias soltas que não pertencem a uma cena específica.
          </p>
          <Button onClick={() => setShowNew(true)}>
            <Plus size={15} className="mr-1.5" /> Criar nota
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className="group border border-border rounded-xl bg-surface hover:bg-elevated transition-colors"
          >
            {editingId === note.id ? (
              <div className="p-4 space-y-3">
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Título"
                  className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary outline-none focus:border-accent/50"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Escreva sua nota..."
                  rows={4}
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
                  <StickyNote size={16} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-ink-primary">{note.title}</h3>
                  {note.content && (
                    <p className="text-xs text-ink-secondary mt-1 line-clamp-2">{note.content}</p>
                  )}
                  <p className="text-[10px] text-ink-tertiary mt-1.5">
                    Criado em {new Date(note.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => startEdit(note)}
                    className="text-ink-tertiary hover:text-ink-primary p-1.5 rounded-lg hover:bg-chrome transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
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
