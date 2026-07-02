import { useEffect, useRef, useState } from "react"
import type { Editor } from "@tiptap/react"
import { useEditorStore } from "@/stores/editor-store"
import { findMatches, updateSearchDecorations, clearSearchDecorations } from "./search-plugin"

interface SearchPanelProps {
  editor: Editor
}

export function SearchPanel({ editor }: SearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { setSearchOpen, setSearchResults, searchResults, searchIndex } = useEditorStore()
  const [query, setQuery] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus()
    return () => {
      clearSearchDecorations(editor)
    }
  }, [editor])

  const doSearch = (q: string) => {
    setQuery(q)
    const matches = findMatches(editor, q)
    setSearchResults(matches, 0)
    updateSearchDecorations(editor, matches, 0)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 200)
  }

  const goToMatch = (direction: "next" | "prev") => {
    const { searchResults: results, searchIndex: idx, setSearchResults: setResults } = useEditorStore.getState()
    if (results.length === 0) return
    const nextIndex =
      direction === "next"
        ? (idx + 1) % results.length
        : (idx - 1 + results.length) % results.length

    setResults(results, nextIndex)
    const m = results[nextIndex]
    editor.commands.setTextSelection({ from: m.from, to: m.to })
    editor.commands.scrollIntoView()
    updateSearchDecorations(editor, results, nextIndex)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      goToMatch(e.shiftKey ? "prev" : "next")
    }
    if (e.key === "Escape") {
      setSearchOpen(false)
    }
  }

  const close = () => {
    setSearchOpen(false)
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-elevated border border-border rounded-xl shadow-lg">
      <input
        ref={inputRef}
        type="text"
        placeholder="Buscar no texto..."
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        defaultValue={query}
        className="w-48 bg-transparent text-sm text-ink-primary placeholder:text-ink-tertiary/50 outline-none"
      />
      {searchResults.length > 0 && (
        <span className="text-xs text-ink-tertiary tabular-nums min-w-[6ch] text-right">
          {searchIndex + 1} de {searchResults.length}
        </span>
      )}
      <button
        onClick={() => goToMatch("prev")}
        disabled={searchResults.length === 0}
        className="px-1.5 py-0.5 text-xs text-ink-tertiary hover:text-ink-primary disabled:opacity-25 transition-colors rounded"
        title="Anterior (Shift+Enter)"
      >
        ▲
      </button>
      <button
        onClick={() => goToMatch("next")}
        disabled={searchResults.length === 0}
        className="px-1.5 py-0.5 text-xs text-ink-tertiary hover:text-ink-primary disabled:opacity-25 transition-colors rounded"
        title="Próximo (Enter)"
      >
        ▼
      </button>
      <button
        onClick={close}
        className="px-1.5 py-0.5 text-xs text-ink-tertiary hover:text-ink-primary transition-colors rounded"
        title="Fechar (Esc)"
      >
        ✕
      </button>
    </div>
  )
}
