import { Plugin, PluginKey } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"
import type { Editor } from "@tiptap/react"

const SEARCH_DECO_KEY = "searchDeco"

export interface SearchMatch {
  from: number
  to: number
}

export function findMatches(editor: Editor, query: string): SearchMatch[] {
  if (!query.trim()) return []
  const doc = editor.state.doc
  const matches: SearchMatch[] = []
  const lower = query.toLowerCase()

  doc.descendants((node, pos) => {
    if (node.isText) {
      const text = node.text ?? ""
      const textLower = text.toLowerCase()
      let idx = 0
      while (idx < text.length) {
        const found = textLower.indexOf(lower, idx)
        if (found === -1) break
        matches.push({ from: pos + found, to: pos + found + query.length })
        idx = found + 1
      }
    }
    return true
  })

  return matches
}

export function updateSearchDecorations(
  editor: Editor,
  matches: SearchMatch[],
  activeIndex: number
): void {
  const doc = editor.state.doc
  const decorations = matches.map((m, i) =>
    Decoration.inline(m.from, m.to, {
      class: i === activeIndex ? "search-match-active" : "search-match",
    })
  )
  const decoSet = DecorationSet.create(doc, decorations)
  const tr = editor.state.tr.setMeta(SEARCH_DECO_KEY, decoSet)
  editor.view.dispatch(tr)
}

export function clearSearchDecorations(editor: Editor): void {
  const tr = editor.state.tr.setMeta(SEARCH_DECO_KEY, DecorationSet.empty)
  editor.view.dispatch(tr)
}

const searchPluginKey = new PluginKey("search")

export const searchPlugin = new Plugin({
  key: searchPluginKey,
  state: {
    init(): DecorationSet {
      return DecorationSet.empty
    },
    apply(tr, old: DecorationSet): DecorationSet {
      const meta = tr.getMeta(SEARCH_DECO_KEY)
      if (meta !== undefined) return meta
      return old.map(tr.mapping, tr.doc)
    },
  },
  props: {
    decorations(state: any): DecorationSet | null {
      return this.getState(state) ?? null
    },
  },
})
