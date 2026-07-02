import { useEffect, useState } from "react"
import { useProjectStore } from "@/stores/project-store"
import { BookOpen, Plus, PenLine, Trash2, FileText, LogOut } from "lucide-react"
import { Button, IconButton } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth-store"

interface DashboardProps {
  onSelectProject: (projectId: string) => void
}

export function Dashboard({ onSelectProject }: DashboardProps) {
  const { projects, loadProjects, createProject, deleteProject } = useProjectStore()
  const [newTitle, setNewTitle] = useState("")
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    loadProjects()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    const project = await createProject(newTitle.trim())
    setNewTitle("")
    setShowNew(false)
    onSelectProject(project.id)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Deletar projeto e todos os seus dados?")) {
      await deleteProject(id)
      loadProjects()
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="h-14 border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <PenLine size={18} className="text-accent" />
          <h1 className="text-base font-semibold text-ink-primary">Azoth</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowNew(true)}>
            <Plus size={15} className="mr-1.5" /> Novo projeto
          </Button>
          <IconButton
            onClick={() => useAuthStore.getState().signOut()}
            title="Sair"
          >
            <LogOut size={15} />
          </IconButton>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        {showNew && (
          <div className="mb-8 p-4 border border-border rounded-xl bg-surface">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate()
                if (e.key === "Escape") { setShowNew(false); setNewTitle("") }
              }}
              placeholder="Título do seu projeto..."
              className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-ink-primary placeholder:text-ink-tertiary outline-none focus:border-accent/50 transition-colors"
            />
            <div className="flex gap-2 mt-3">
              <Button onClick={handleCreate}>Criar</Button>
              <Button variant="ghost" onClick={() => { setShowNew(false); setNewTitle("") }}>Cancelar</Button>
            </div>
          </div>
        )}

        {projects.length === 0 && !showNew && (
          <div className="text-center py-20">
            <BookOpen size={48} className="mx-auto text-ink-tertiary mb-4 opacity-40" />
            <h2 className="text-lg font-medium text-ink-primary mb-2">Nenhum projeto ainda</h2>
            <p className="text-sm text-ink-tertiary mb-6 max-w-sm mx-auto">
              Crie seu primeiro projeto e comece a escrever. Seus dados ficam salvos no navegador.
            </p>
            <Button onClick={() => setShowNew(true)}>
              <Plus size={15} className="mr-1.5" /> Criar projeto
            </Button>
          </div>
        )}

        <div className="grid gap-3">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-surface hover:bg-elevated cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0">
                <FileText size={18} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-ink-primary truncate">{project.title}</h3>
                <p className="text-xs text-ink-tertiary mt-0.5">
                  {new Date(project.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(project.id, e)}
                className="opacity-0 group-hover:opacity-100 text-ink-tertiary hover:text-error p-1.5 rounded-lg hover:bg-chrome transition-all"
                title="Deletar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
