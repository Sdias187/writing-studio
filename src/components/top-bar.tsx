import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Download } from "lucide-react"
import { IconButton } from "@/components/ui/button"
import { useEditorStore } from "@/stores/editor-store"
import { useProjectStore } from "@/stores/project-store"
import { exportSceneAsMarkdown, exportSceneAsTxt, exportProjectAsMarkdown, exportProjectAsTxt } from "@/lib/export"
import type { ProjectView } from "@/App"

const statusLabel = {
  saved: "Salvo",
  saving: "Salvando...",
  unsaved: "Não salvo",
} as const

const statusColor = {
  saved: "text-ink-tertiary",
  saving: "text-accent",
  unsaved: "text-ink-secondary",
} as const

const viewTitles: Record<ProjectView, string> = {
  editor: "Editor",
  characters: "Personagens",
  locations: "Locais",
  notes: "Notas",
}

interface TopBarProps {
  onBack: () => void
  currentView?: ProjectView
  onNavigate?: (view: ProjectView) => void
}

export function TopBar({ onBack, currentView = "editor", onNavigate }: TopBarProps) {
  const { saveStatus, wordCount, isFocusMode, setFocusMode, editor, activeScene, content, save } = useEditorStore()
  const { currentProject } = useProjectStore()
  const [showExport, setShowExport] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  // Close export dropdown on outside click
  useEffect(() => {
    if (!showExport) return
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showExport])

  if (isFocusMode) {
    return (
      <div className="fixed top-0 right-0 p-4 z-50 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <IconButton onClick={() => setFocusMode(false)} title="Sair do modo foco">
          <span className="text-xs">✕</span>
        </IconButton>
      </div>
    )
  }

  return (
    <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-canvas select-none shrink-0">
      <div className="flex items-center gap-2">
        <IconButton onClick={onBack} title="Voltar ao dashboard">
          <ArrowLeft size={16} />
        </IconButton>
        <span className="text-sm font-medium text-ink-primary truncate max-w-[180px]">
          {currentProject?.title ?? "Sem projeto"}
        </span>
        <span className="text-xs text-ink-tertiary">/</span>
        <span className="text-sm text-ink-secondary">{viewTitles[currentView]}</span>
      </div>

      <div className="flex items-center gap-1">
        {currentView === "editor" && (
          <>
            <IconButton onClick={() => editor?.chain().undo().run()} title="Desfazer">
              <span className="text-xs">↩</span>
            </IconButton>
            <IconButton onClick={() => editor?.chain().redo().run()} title="Refazer">
              <span className="text-xs">↪</span>
            </IconButton>
            <div className="w-px h-5 bg-border mx-1" />
            <span className="text-xs text-ink-tertiary tabular-nums min-w-[4ch] text-right">
              {wordCount}
            </span>
            <span className="text-xs text-ink-tertiary ml-0.5 mr-2">palavras</span>
            <span className={`text-xs ${statusColor[saveStatus]} min-w-[4ch]`}>
              {statusLabel[saveStatus]}
            </span>
            <div className="w-px h-5 bg-border mx-1" />

            {/* Export dropdown */}
            <div ref={exportRef} className="relative">
              <IconButton onClick={() => setShowExport(!showExport)} title="Exportar">
                <Download size={15} />
              </IconButton>

              {showExport && (
                <div className="absolute right-0 top-full mt-1 min-w-[220px] bg-elevated border border-border rounded-xl p-1 z-50">
                  <div className="px-3 py-1.5 text-[10px] text-ink-tertiary uppercase tracking-wider font-medium">
                    Cena atual
                  </div>
                  <button
                    onClick={() => {
                      if (activeScene) exportSceneAsMarkdown({ ...activeScene, content: content ?? activeScene.content })
                      setShowExport(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-ink-secondary hover:text-ink-primary hover:bg-chrome rounded-lg transition-colors text-left"
                  >
                    Exportar como Markdown
                  </button>
                  <button
                    onClick={() => {
                      if (activeScene) exportSceneAsTxt({ ...activeScene, content: content ?? activeScene.content })
                      setShowExport(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-ink-secondary hover:text-ink-primary hover:bg-chrome rounded-lg transition-colors text-left"
                  >
                    Exportar como TXT
                  </button>

                  <div className="h-px bg-border my-1" />

                  <div className="px-3 py-1.5 text-[10px] text-ink-tertiary uppercase tracking-wider font-medium">
                    Projeto
                  </div>
                  <button
                    onClick={async () => {
                      if (currentProject) {
                        await save()
                        await exportProjectAsMarkdown(currentProject.id, currentProject.title)
                      }
                      setShowExport(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-ink-secondary hover:text-ink-primary hover:bg-chrome rounded-lg transition-colors text-left"
                  >
                    Exportar projeto como Markdown
                  </button>
                  <button
                    onClick={async () => {
                      if (currentProject) {
                        await save()
                        await exportProjectAsTxt(currentProject.id, currentProject.title)
                      }
                      setShowExport(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-ink-secondary hover:text-ink-primary hover:bg-chrome rounded-lg transition-colors text-left"
                  >
                    Exportar projeto como TXT
                  </button>
                </div>
              )}
            </div>

            <IconButton onClick={() => setFocusMode(true)} title="Modo foco (Ctrl+Shift+F)">
              <span className="text-xs">⛶</span>
            </IconButton>
          </>
        )}
      </div>
    </header>
  )
}
