import { useState, useCallback, useEffect, lazy, Suspense } from "react"
import { Dashboard } from "@/pages/dashboard"
import { AuthPage } from "@/pages/auth"
import { TopBar } from "@/components/top-bar"
import { Sidebar } from "@/components/sidebar"
import { AppShell } from "@/components/app-shell"
import { ErrorBoundary } from "@/components/error-boundary"
import { useProjectStore } from "@/stores/project-store"
import { useAuthStore } from "@/stores/auth-store"
import { getProject } from "@/lib/supabase-db"

const Editor = lazy(() => import("@/components/editor/editor").then((m) => ({ default: m.Editor })))
const CharactersPage = lazy(() => import("@/pages/characters").then((m) => ({ default: m.CharactersPage })))
const LocationsPage = lazy(() => import("@/pages/locations").then((m) => ({ default: m.LocationsPage })))
const NotesPage = lazy(() => import("@/pages/notes").then((m) => ({ default: m.NotesPage })))

export type ProjectView = "editor" | "characters" | "locations" | "notes"

function App() {
  const [view, setView] = useState<"dashboard" | ProjectView>("dashboard")
  const { setCurrentProject } = useProjectStore()
  const { user, isLoading, initialized, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  const handleSelectProject = useCallback(async (projectId: string) => {
    const project = await getProject(projectId)
    if (project) {
      await setCurrentProject(project)
      setView("editor")
    }
  }, [setCurrentProject])

  const handleBack = useCallback(() => {
    setView("dashboard")
  }, [])

  const handleNavigate = useCallback((subview: ProjectView) => {
    setView(subview)
  }, [])

  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  if (view === "dashboard") {
    return <Dashboard onSelectProject={handleSelectProject} />
  }

  const renderContent = () => {
    switch (view) {
      case "characters":
        return <CharactersPage />
      case "locations":
        return <LocationsPage />
      case "notes":
        return <NotesPage />
      default:
        return <Editor />
    }
  }

  return (
    <AppShell
      topbar={<TopBar onBack={handleBack} currentView={view} onNavigate={handleNavigate} />}
      sidebar={<Sidebar currentView={view} onNavigate={handleNavigate} />}
    >
      <Suspense fallback={null}>
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
      </Suspense>
    </AppShell>
  )
}

export default App
