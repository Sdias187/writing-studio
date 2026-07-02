import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { HeadingInfo } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function wordCount(text: string): number {
  const cleaned = text.replace(/<[^>]*>/g, " ")
  const words = cleaned.trim().split(/\s+/)
  return words.length === 1 && words[0] === "" ? 0 : words.length
}

export function parseHeadings(json: any): HeadingInfo[] {
  const headings: HeadingInfo[] = []
  let pos = 0

  function walk(node: any) {
    if (node.type === "heading") {
      const text = node.content
        ?.filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("") ?? ""
      headings.push({ level: node.attrs?.level ?? 1, text, pos })
    }

    if (node.content) {
      for (const child of node.content) {
        walk(child)
      }
    }

    // Approximate position by text length
    if (node.type === "text" && typeof node.text === "string") {
      pos += node.text.length
    } else if (node.type === "paragraph" || node.type === "heading") {
      pos += 1 // newline
    }
  }

  if (json) walk(json)
  return headings
}
