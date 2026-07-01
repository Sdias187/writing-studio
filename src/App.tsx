import { useState, useEffect, useCallback } from "react"
import { Dashboard } from "@/pages/dashboard"
import { Editor } from "@/components/editor/editor"
import { CharactersPage } from "@/pages/characters"
import { LocationsPage } from "@/pages/locations"
import { NotesPage } from "@/pages/notes"
import { TopBar } from "@/components/top-bar"
import { Sidebar } from "@/components/sidebar"
import { AppShell } from "@/components/app-shell"
import { useProjectStore } from "@/stores/project-store"
import { useEditorStore } from "@/stores/editor-store"
import { db } from "@/db"

export type ProjectView = "editor" | "characters" | "locations" | "notes"

function App() {
  const [view, setView] = useState<"dashboard" | ProjectView>("dashboard")
  const { setCurrentProject } = useProjectStore()
  const { setActiveScene, activeSceneId } = useEditorStore()

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

  const handleSelectScene = useCallback(async (sceneId: string) => {
    await setActiveScene(sceneId)
    setView("editor")
  }, [setActiveScene])

  const handleNavigate = useCallback((subview: ProjectView) => {
    setView(subview)
  }, [])

  // Auto-select first scene when editor opens
  useEffect(() => {
    if (view === "editor") {
      const init = async () => {
        const chapters = await db.chapters
          .where("projectId")
          .equals(useProjectStore.getState().currentProject?.id ?? "")
          .sortBy("order")

        if (chapters.length > 0) {
          const scenes = await db.scenes
            .where("chapterId")
            .equals(chapters[0].id)
            .sortBy("order")

          if (scenes.length > 0 && !activeSceneId) {
            await setActiveScene(scenes[0].id)
          }
        }
      }
      init()
    }
  }, [view]) // eslint-disable-line react-hooks/exhaustive-deps

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
      sidebar={
        <Sidebar
          onSelectScene={handleSelectScene}
          activeSceneId={activeSceneId}
          currentView={view}
          onNavigate={handleNavigate}
        />
      }
    >
      {renderContent()}
    </AppShell>
  )
}

export default App
