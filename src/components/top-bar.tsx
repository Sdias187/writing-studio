import { ArrowLeft } from "lucide-react"
import { IconButton, Button } from "@/components/ui/button"
import { useEditorStore } from "@/stores/editor-store"
import { useProjectStore } from "@/stores/project-store"
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
}

interface TopBarProps {
  onBack: () => void
  currentView?: ProjectView
  onNavigate?: (view: ProjectView) => void
}

export function TopBar({ onBack, currentView = "editor", onNavigate }: TopBarProps) {
  const { saveStatus, wordCount, isFocusMode, setFocusMode, editor } = useEditorStore()
  const { currentProject } = useProjectStore()

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
            <IconButton onClick={() => setFocusMode(true)} title="Modo foco (Ctrl+Shift+F)">
              <span className="text-xs">⛶</span>
            </IconButton>
          </>
        )}
      </div>
    </header>
  )
}
