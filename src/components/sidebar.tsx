import { useState } from "react"
import { useProjectStore } from "@/stores/project-store"
import { useEditorStore } from "@/stores/editor-store"
import { Edit3, Users, MapPin, StickyNote, Plus, Heading1, BookOpen } from "lucide-react"
import type { ProjectView } from "@/App"

interface SidebarProps {
  currentView: ProjectView
  onNavigate: (view: ProjectView) => void
}

function navigateToEditor(onNavigate: (view: ProjectView) => void) {
  onNavigate("editor")
}

const navItems: { view: ProjectView; label: string; icon: typeof Users }[] = [
  { view: "editor", label: "Escrita", icon: Edit3 },
  { view: "characters", label: "Personagens", icon: Users },
  { view: "locations", label: "Locais", icon: MapPin },
  { view: "notes", label: "Notas", icon: StickyNote },
]

function scrollToHeading(pos: number) {
  const editor = useEditorStore.getState().editor
  if (!editor) return
  editor.commands.setTextSelection({ from: pos, to: pos })
  editor.commands.scrollIntoView()
}

function scrollToHeadingSafe(pos: number) {
  const editor = useEditorStore.getState().editor
  if (editor) {
    scrollToHeading(pos)
    return
  }
  // Editor not ready yet — wait for it
  const unsub = useEditorStore.subscribe((state, prev) => {
    if (state.editor && !prev.editor) {
      scrollToHeading(pos)
      unsub()
    }
  })
}

function insertChapterHeadline() {
  const editor = useEditorStore.getState().editor
  if (!editor) return
  editor.chain().focus().toggleHeading({ level: 1 }).run()
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const currentProject = useProjectStore((s) => s.currentProject)
  const headings = useEditorStore((s) => s.headings)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [synopsisOpen, setSynopsisOpen] = useState<string | null>(null)
  const saveSynopsis = useProjectStore((s) => s.saveSynopsis)

  const toggleChapter = (text: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(text)) next.delete(text)
      else next.add(text)
      return next
    })
  }

  const isActiveChapter = (heading: { text: string }) => {
    return expandedChapters.has(heading.text)
  }

  // Group: H1 = chapter, H2/H3 = sub-items under the last H1
  const tocGroups: { chapter: typeof headings[0]; subs: typeof headings }[] = []
  let currentGroup: (typeof tocGroups)[number] | null = null

  for (const h of headings) {
    if (h.level === 1) {
      currentGroup = { chapter: h, subs: [] }
      tocGroups.push(currentGroup)
    } else if (currentGroup) {
      currentGroup.subs.push(h)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Project title & chapter controls */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={16} className="text-accent shrink-0" />
          <h2 className="text-sm font-semibold truncate">{currentProject?.title ?? "Sem projeto"}</h2>
        </div>
        {currentProject && (
          <button
            onClick={insertChapterHeadline}
            className="flex items-center gap-1.5 text-xs text-ink-tertiary hover:text-accent transition-colors"
          >
            <Plus size={12} />
            <Heading1 size={12} />
            <span>Adicionar capítulo</span>
          </button>
        )}
      </div>

      {/* Table of Contents */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {tocGroups.length === 0 && (
          <p className="text-xs text-ink-tertiary px-2 py-4 italic text-center">
            Use Heading 1 (H1) para criar capítulos
          </p>
        )}

        {tocGroups.map((group) => {
          const navigateToChapter = () => {
            navigateToEditor(onNavigate)
            scrollToHeadingSafe(group.chapter.pos)
          }
          const chapterId = group.chapter.text + group.chapter.pos
          const synopsis = currentProject?.chapterSynopses[chapterId] ?? ""

          return (
          <div key={chapterId}>
            <button
              onClick={() => {
                navigateToChapter()
                toggleChapter(group.chapter.text)
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors text-sm ${
                isActiveChapter(group.chapter)
                  ? "bg-accent-subtle text-accent"
                  : "text-ink-secondary hover:text-ink-primary hover:bg-chrome-hover"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary shrink-0 w-6">
                H1
              </span>
              <span className="truncate">{group.chapter.text}</span>
            </button>

            {isActiveChapter(group.chapter) && (
              <>
                {/* Sub-headings */}
                {group.subs.length > 0 && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-2">
                    {group.subs.map((sub) => (
                      <button
                        key={sub.text + sub.pos}
                        onClick={() => {
                          navigateToEditor(onNavigate)
                          scrollToHeadingSafe(sub.pos)
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-left transition-colors text-xs text-ink-tertiary hover:text-ink-secondary hover:bg-chrome-hover"
                      >
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-tertiary/60 shrink-0 w-5">
                          H{sub.level}
                        </span>
                        <span className="truncate">{sub.text}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Synopsis toggle */}
                <button
                  onClick={() => setSynopsisOpen(synopsisOpen === chapterId ? null : chapterId)}
                  className="ml-4 mt-0.5 text-[10px] text-ink-tertiary/50 hover:text-ink-tertiary transition-colors px-2 py-0.5"
                >
                  {synopsisOpen === chapterId ? "− ocultar sinopse" : synopsis ? "+ editar sinopse" : "+ adicionar sinopse"}
                </button>

                {synopsisOpen === chapterId && (
                  <div className="ml-4 mt-1 mb-2">
                    <textarea
                      defaultValue={synopsis}
                      placeholder="Sinopse do capítulo..."
                      rows={3}
                      onBlur={(e) => {
                        const val = e.target.value.trim()
                        saveSynopsis(chapterId, val)
                      }}
                      className="w-full text-xs bg-transparent border border-border rounded-lg px-2 py-1.5 text-ink-secondary placeholder:text-ink-tertiary/40 resize-none focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                )}
              </>
            )}
          </div>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="border-t border-border px-3 py-2">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentView === item.view
                ? "bg-accent-subtle text-accent"
                : "text-ink-tertiary hover:text-ink-secondary hover:bg-chrome-hover"
            }`}
          >
            <item.icon size={15} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
