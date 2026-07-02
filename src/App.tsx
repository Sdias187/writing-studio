import { useState, useCallback, lazy, Suspense } from "react"
import { Dashboard } from "@/pages/dashboard"
import { TopBar } from "@/components/top-bar"
import { Sidebar } from "@/components/sidebar"
import { AppShell } from "@/components/app-shell"
import { useProjectStore } from "@/stores/project-store"
import { db } from "@/db"

const Editor = lazy(() => import("@/components/editor/editor").then((m) => ({ default: m.Editor })))
const CharactersPage = lazy(() => import("@/pages/characters").then((m) => ({ default: m.CharactersPage })))
const LocationsPage = lazy(() => import("@/pages/locations").then((m) => ({ default: m.LocationsPage })))
const NotesPage = lazy(() => import("@/pages/notes").then((m) => ({ default: m.NotesPage })))

export type ProjectView = "editor" | "characters" | "locations" | "notes"

function App() {
  const [view, setView] = useState<"dashboard" | ProjectView>("dashboard")
  const { setCurrentProject } = useProjectStore()

  const handleSelectProject = useCallback(async (projectId: string) => {
    const project = await db.projects.get(projectId)
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
        {renderContent()}
      </Suspense>
    </AppShell>
  )
}

export default App
