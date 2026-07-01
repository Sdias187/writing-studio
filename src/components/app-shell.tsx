import type { ReactNode } from "react"

interface AppShellProps {
  sidebar?: ReactNode
  topbar: ReactNode
  children: ReactNode
}

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  return (
    <div className="h-screen flex flex-col bg-canvas overflow-hidden">
      {topbar}
      <div className="flex flex-1 overflow-hidden">
        {sidebar && (
          <aside className="w-60 border-r border-border bg-surface flex flex-col shrink-0 overflow-y-auto">
            {sidebar}
          </aside>
        )}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
