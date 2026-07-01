import { useEffect, useState } from "react"
import { useProjectStore } from "@/stores/project-store"
import { FileText, Plus, Trash2, ChevronRight, ChevronDown, Users, MapPin, StickyNote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { db, deleteChapter as dbDeleteChapter } from "@/db"
import type { Scene } from "@/types"
import type { ProjectView } from "@/App"

interface SidebarProps {
  onSelectScene: (sceneId: string) => void
  activeSceneId: string | null
  currentView: ProjectView
  onNavigate: (view: ProjectView) => void
}

const navItems: { view: ProjectView; label: string; icon: typeof Users }[] = [
  { view: "characters", label: "Personagens", icon: Users },
  { view: "locations", label: "Locais", icon: MapPin },
  { view: "notes", label: "Notas", icon: StickyNote },
]

export function Sidebar({ onSelectScene, activeSceneId, currentView, onNavigate }: SidebarProps) {
  const { currentProject, chapters, loadChapters, createChapter } = useProjectStore()
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [chapterScenes, setChapterScenes] = useState<Record<string, Scene[]>>({})
  const [newChapterTitle, setNewChapterTitle] = useState("")
  const [showNewChapter, setShowNewChapter] = useState(false)

  useEffect(() => {
    if (currentProject) {
      loadChapters(currentProject.id)
    }
  }, [currentProject?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loadAllScenes = async () => {
      const sceneMap: Record<string, Scene[]> = {}
      for (const chapter of chapters) {
        sceneMap[chapter.id] = await db.scenes.where("chapterId").equals(chapter.id).sortBy("order")
      }
      setChapterScenes(sceneMap)
    }
    if (chapters.length > 0) {
      loadAllScenes()
    }
  }, [chapters])

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(chapterId)) next.delete(chapterId)
      else next.add(chapterId)
      return next
    })
  }

  const handleCreateChapter = async () => {
    if (!currentProject || !newChapterTitle.trim()) return
    await createChapter(currentProject.id, newChapterTitle.trim())
    setNewChapterTitle("")
    setShowNewChapter(false)
  }

  const handleDeleteChapter = async (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await dbDeleteChapter(chapterId)
    if (currentProject) loadChapters(currentProject.id)
  }

  const handleCreateScene = async (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentProject) return
    const sceneCount = (chapterScenes[chapterId] ?? []).length
    const scene = await useProjectStore.getState().createScene(chapterId, currentProject.id, `Cena ${sceneCount + 1}`)
    const updated = await db.scenes.where("chapterId").equals(chapterId).sortBy("order")
    setChapterScenes((prev) => ({ ...prev, [chapterId]: updated }))
    onSelectScene(scene.id)
  }

  if (!currentProject) return null

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-ink-primary truncate">{currentProject.title}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Navigation */}
        <nav className="space-y-0.5">
          <button
            onClick={() => onNavigate("editor")}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-colors ${
              currentView === "editor"
                ? "bg-accent-subtle text-accent"
                : "text-ink-secondary hover:text-ink-primary hover:bg-chrome"
            }`}
          >
            <FileText size={15} />
            <span className="text-sm">Editor</span>
          </button>

          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-colors ${
                  currentView === item.view
                    ? "bg-accent-subtle text-accent"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-chrome"
                }`}
              >
                <Icon size={15} />
                <span className="text-sm">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Chapters */}
        <div>
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-xs font-medium text-ink-tertiary uppercase tracking-wider">Capítulos</span>
            <button
              onClick={() => setShowNewChapter(true)}
              className="text-ink-tertiary hover:text-ink-primary transition-colors"
              title="Novo capítulo"
            >
              <Plus size={14} />
            </button>
          </div>

          {showNewChapter && (
            <div className="px-2 mb-2">
              <input
                autoFocus
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateChapter()
                  if (e.key === "Escape") { setShowNewChapter(false); setNewChapterTitle("") }
                }}
                onBlur={() => { setShowNewChapter(false); setNewChapterTitle("") }}
                placeholder="Título do capítulo..."
                className="w-full bg-elevated border border-border rounded-lg px-3 py-1.5 text-sm text-ink-primary placeholder:text-ink-tertiary outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          )}

          <div className="space-y-0.5">
            {chapters.map((chapter) => (
              <div key={chapter.id}>
                <div
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-chrome cursor-pointer group transition-colors"
                  onClick={() => toggleChapter(chapter.id)}
                >
                  {expandedChapters.has(chapter.id) ? (
                    <ChevronDown size={14} className="text-ink-tertiary shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-ink-tertiary shrink-0" />
                  )}
                  <FileText size={14} className="text-ink-tertiary shrink-0" />
                  <span className="text-sm text-ink-secondary truncate flex-1">{chapter.title}</span>
                  <span className="text-[10px] text-ink-tertiary tabular-nums">{chapter.status === "completed" ? "✓" : "..."}</span>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                      onClick={(e) => handleCreateScene(chapter.id, e)}
                      className="text-ink-tertiary hover:text-ink-primary p-0.5"
                      title="Nova cena"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteChapter(chapter.id, e)}
                      className="text-ink-tertiary hover:text-error p-0.5"
                      title="Deletar capítulo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {expandedChapters.has(chapter.id) && (
                  <div className="ml-6 space-y-0.5 mt-0.5 mb-1">
                    {(chapterScenes[chapter.id] ?? []).map((scene) => (
                      <button
                        key={scene.id}
                        onClick={() => onSelectScene(scene.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left transition-colors ${
                          activeSceneId === scene.id
                            ? "bg-accent-subtle text-accent"
                            : "text-ink-tertiary hover:text-ink-secondary hover:bg-chrome"
                        }`}
                      >
                        <span className="text-xs truncate flex-1">{scene.title}</span>
                        <span className="text-[10px] tabular-nums opacity-60">{scene.wordCount}w</span>
                      </button>
                    ))}
                    {(chapterScenes[chapter.id] ?? []).length === 0 && (
                      <p className="text-xs text-ink-tertiary px-2 py-1 italic">Nenhuma cena</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {chapters.length === 0 && (
            <div className="text-center py-6 px-4">
              <p className="text-xs text-ink-tertiary mb-3">Nenhum capítulo ainda</p>
              <Button variant="ghost" onClick={() => setShowNewChapter(true)}>
                <Plus size={14} className="mr-1" /> Criar capítulo
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
