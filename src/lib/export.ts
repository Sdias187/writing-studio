import type { Scene } from "@/types"
import { db } from "@/db"

type PMNode = {
  type: string
  content?: PMNode[]
  text?: string
  marks?: { type: string; attrs?: Record<string, string> }[]
  attrs?: Record<string, unknown>
}

function renderMarks(text: string, marks?: PMNode["marks"]): string {
  if (!marks || marks.length === 0) return text

  let result = text

  // Apply marks inside-out so wrapping is correct
  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        result = `**${result}**`
        break
      case "italic":
        result = `*${result}*`
        break
      case "code":
        result = `\`${result}\``
        break
      case "strike":
        result = `~~${result}~~`
        break
      case "link":
        result = `[${result}](${mark.attrs?.href ?? ""})`
        break
      // underline — no markdown equivalent, keep as-is
    }
  }

  return result
}

function extractText(node: PMNode): string {
  if (node.text) return node.text
  if (!node.content) return ""
  return node.content.map(extractText).join("")
}

function renderInline(node: PMNode): string {
  if (node.text) return renderMarks(node.text, node.marks)
  if (node.type === "hardBreak") return "\n"
  if (!node.content) return ""
  return node.content.map(renderInline).join("")
}

function renderBlock(node: PMNode, _index: number): string {
  switch (node.type) {
    case "paragraph": {
      const inner = node.content ? node.content.map(renderInline).join("") : ""
      return `${inner}\n\n`
    }

    case "heading": {
      const level = (node.attrs?.level as number) ?? 1
      const prefix = "#".repeat(level)
      const inner = node.content ? node.content.map(renderInline).join("") : ""
      return `${prefix} ${inner}\n\n`
    }

    case "bulletList": {
      if (!node.content) return ""
      return node.content
        .map((item) => {
          const text = item.content ? item.content.map(renderInline).join("") : ""
          return `* ${text}`
        })
        .join("\n") + "\n\n"
    }

    case "orderedList": {
      if (!node.content) return ""
      return node.content
        .map((item, i) => {
          const text = item.content ? item.content.map(renderInline).join("") : ""
          return `${i + 1}. ${text}`
        })
        .join("\n") + "\n\n"
    }

    case "listItem": {
      // handled by parent list
      const inner = node.content ? node.content.map(renderInline).join("") : ""
      return inner
    }

    case "codeBlock": {
      const lang = (node.attrs?.language as string) ?? ""
      const code = extractText(node)
      return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`
    }

    case "blockquote": {
      if (!node.content) return ""
      const inner = node.content.map((child) => renderBlock(child, 0)).join("").trim()
      return inner
        .split("\n")
        .map((line) => (line.trim() ? `> ${line}` : ""))
        .filter(Boolean)
        .join("\n") + "\n\n"
    }

    case "horizontalRule":
      return `---\n\n`

    case "hardBreak":
      return "\n"

    default:
      if (node.content) return node.content.map(renderBlock).join("")
      return ""
  }
}

function proseMirrorToMarkdown(doc: PMNode): string {
  if (!doc.content || doc.content.length === 0) return ""
  return doc.content.map((node, i) => renderBlock(node, i)).join("").trim() + "\n"
}

function proseMirrorToPlainText(doc: PMNode): string {
  if (!doc.content) return ""
  return doc.content.map(extractText).join("\n").trim()
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function sceneFilename(scene: Scene, ext: string): string {
  const safeName = scene.title.replace(/[^a-zA-Z0-9_\- ]/g, "").trim().replace(/\s+/g, "_")
  return `${safeName}.${ext}`
}

export function exportSceneAsMarkdown(scene: Scene): void {
  const content = scene.content ? proseMirrorToMarkdown(scene.content as PMNode) : ""
  const header = `# ${scene.title}\n\n`
  downloadFile(header + content, sceneFilename(scene, "md"), "text/markdown")
}

export function exportSceneAsTxt(scene: Scene): void {
  const content = scene.content ? proseMirrorToPlainText(scene.content as PMNode) : ""
  const header = `${scene.title}\n${"=".repeat(scene.title.length)}\n\n`
  downloadFile(header + content, sceneFilename(scene, "txt"), "text/plain")
}

export async function exportProjectAsMarkdown(projectId: string, projectTitle: string): Promise<void> {
  const chapters = await db.chapters.where("projectId").equals(projectId).sortBy("order")
  const lines: string[] = [`# ${projectTitle}\n`]

  for (const chapter of chapters) {
    const scenes = await db.scenes.where("chapterId").equals(chapter.id).sortBy("order")
    if (scenes.length === 0) {
      lines.push(`\n## ${chapter.title}\n\n*Este capítulo está vazio.*\n`)
      continue
    }

    lines.push(`\n## ${chapter.title}\n`)
    for (const scene of scenes) {
      lines.push(`### ${scene.title}\n`)
      if (scene.content) {
        lines.push(proseMirrorToMarkdown(scene.content as PMNode))
      }
      lines.push("\n---\n")
    }
  }

  const safeName = projectTitle.replace(/[^a-zA-Z0-9_\- ]/g, "").trim().replace(/\s+/g, "_")
  downloadFile(lines.join(""), `${safeName}.md`, "text/markdown")
}

export async function exportProjectAsTxt(projectId: string, projectTitle: string): Promise<void> {
  const chapters = await db.chapters.where("projectId").equals(projectId).sortBy("order")
  const lines: string[] = [`${projectTitle}\n${"=".repeat(projectTitle.length)}\n`]

  for (const chapter of chapters) {
    const scenes = await db.scenes.where("chapterId").equals(chapter.id).sortBy("order")
    if (scenes.length === 0) {
      lines.push(`\n${chapter.title}\n${"-".repeat(chapter.title.length)}\n\n[empty]\n`)
      continue
    }

    lines.push(`\n${chapter.title}\n${"-".repeat(chapter.title.length)}\n`)
    for (const scene of scenes) {
      lines.push(`\n${scene.title}\n${"~".repeat(scene.title.length)}\n`)
      if (scene.content) {
        lines.push(proseMirrorToPlainText(scene.content as PMNode))
      }
      lines.push("\n")
    }
  }

  const safeName = projectTitle.replace(/[^a-zA-Z0-9_\- ]/g, "").trim().replace(/\s+/g, "_")
  downloadFile(lines.join(""), `${safeName}.txt`, "text/plain")
}
