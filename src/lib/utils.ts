import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
