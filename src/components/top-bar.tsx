import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Download, LogOut, AlignCenter } from "lucide-react"
import { IconButton } from "@/components/ui/button"
import { useEditorStore, FONT_OPTIONS } from "@/stores/editor-store"
import { useProjectStore } from "@/stores/project-store"
import { useAuthStore } from "@/stores/auth-store"
import { exportProjectAsMarkdown, exportProjectAsTxt } from "@/lib/export"
import { createBackup, downloadBackup, parseBackupFile, restoreBackup } from "@/lib/backup"
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

export function TopBar({ onBack, currentView = "editor", onNavigate: _onNavigate }: TopBarProps) {
  const { saveStatus, wordCount, isFocusMode, setFocusMode, editorFont, setEditorFont, typewriterMode, setTypewriterMode, editor, save, activeHeading } = useEditorStore()
  const { currentProject } = useProjectStore()
  const [showExport, setShowExport] = useState(false)
  const [fontOpen, setFontOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const fontRef = useRef<HTMLDivElement>(null)
  const backupInputRef = useRef<HTMLInputElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    if (!showExport && !fontOpen) return
    const handleClick = (e: MouseEvent) => {
      if (showExport && exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false)
      }
      if (fontOpen && fontRef.current && !fontRef.current.contains(e.target as Node)) {
        setFontOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showExport, fontOpen])

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
        <span className="text-sm text-ink-secondary truncate max-w-[200px]">
          {currentView === "editor" && activeHeading ? activeHeading : viewTitles[currentView]}
        </span>
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

                  <div className="h-px bg-border my-1" />

                  <div className="px-3 py-1.5 text-[10px] text-ink-tertiary uppercase tracking-wider font-medium">
                    Backup
                  </div>
                  <button
                    onClick={async () => {
                      const data = await createBackup()
                      downloadBackup(data)
                      setShowExport(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-ink-secondary hover:text-ink-primary hover:bg-chrome rounded-lg transition-colors text-left"
                  >
                    Exportar backup (.json)
                  </button>
                  <button
                    onClick={() => {
                      backupInputRef.current?.click()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-ink-secondary hover:text-ink-primary hover:bg-chrome rounded-lg transition-colors text-left"
                  >
                    Importar backup
                  </button>
                  <input
                    ref={backupInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    aria-hidden="true"
                    tabIndex={-1}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const text = await file.text()
                        const data = parseBackupFile(text)
                        await restoreBackup(data)
                        alert("Backup restaurado com sucesso! A página será recarregada.")
                        window.location.reload()
                      } catch (err) {
                        alert(err instanceof Error ? err.message : "Erro ao restaurar backup.")
                      } finally {
                        e.target.value = ""
                        setShowExport(false)
                      }
                    }}
                  />
                </div>
              )}
            </div>

            <IconButton onClick={() => setFocusMode(true)} title="Modo foco (Ctrl+Shift+F)">
              <span className="text-xs">⛶</span>
            </IconButton>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Font selector dropdown */}
            <div className="relative" ref={fontRef}>
              <button
                onClick={() => setFontOpen(!fontOpen)}
                className="flex items-center gap-1.5 px-2 py-1 text-[11px] rounded-md transition-colors hover:bg-chrome/30"
                title="Fonte do editor"
              >
                <span className={FONT_OPTIONS.find((f) => f.id === editorFont)?.className ?? "font-sans"}>
                  {FONT_OPTIONS.find((f) => f.id === editorFont)?.label ?? "Inter"}
                </span>
                <svg width="8" height="5" viewBox="0 0 8 5" fill="none" className="text-ink-tertiary">
                  <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {fontOpen && (
                <div className="absolute right-0 top-full mt-1 min-w-[160px] bg-elevated border border-border rounded-xl p-1 z-50">
                  {FONT_OPTIONS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => { setEditorFont(font.id); setFontOpen(false) }}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-1.5 text-sm rounded-lg transition-colors text-left ${
                        editorFont === font.id
                          ? "text-accent bg-accent-subtle"
                          : "text-ink-secondary hover:text-ink-primary hover:bg-chrome"
                      }`}
                    >
                      <span className={font.className}>{font.preview}</span>
                      {editorFont === font.id && (
                        <svg width="12" height="9" viewBox="0 0 12 9" fill="none" className="shrink-0">
                          <path d="M1 4.5L4.5 8L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Typewriter toggle */}
            <IconButton
              onClick={() => setTypewriterMode(!typewriterMode)}
              title={typewriterMode ? "Desativar modo typewriter" : "Ativar modo typewriter"}
            >
              <AlignCenter size={15} className={typewriterMode ? "text-accent" : ""} />
            </IconButton>
          </>
        )}
        <div className="w-px h-5 bg-border mx-1" />
        <IconButton
          onClick={() => useAuthStore.getState().signOut()}
          title="Sair"
        >
          <LogOut size={15} />
        </IconButton>
      </div>
    </header>
  )
}
