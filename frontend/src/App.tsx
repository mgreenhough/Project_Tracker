import { Routes, Route, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProjectStore } from './store/useProjectStore'
import { activeProjectsSorted, archivedProjectsSorted } from './store/selectors'
import { ProjectStack } from './components/ProjectStack'
import { ArchivedRow } from './components/ArchivedRow'
import { LoginPage } from './components/LoginPage'

function MainLayout() {
  const projects = useProjectStore((s) => s.projects)
  const isLoading = useProjectStore((s) => s.isLoading)
  const error = useProjectStore((s) => s.error)
  const addProject = useProjectStore((s) => s.addProject)
  const reorderProjects = useProjectStore((s) => s.reorderProjects)
  const loadProjects = useProjectStore((s) => s.loadProjects)
  const setError = useProjectStore((s) => s.setError)
  const { isAdmin, logout, isLoading: authLoading } = useAuth()

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const active = activeProjectsSorted(projects)
  const archived = archivedProjectsSorted(projects)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Project Stack</h1>
        <div className="flex items-center gap-3">
          {authLoading ? (
            <span className="text-xs text-gray-500">Loading…</span>
          ) : isAdmin ? (
            <>
              <span className="text-xs text-emerald-400 border border-emerald-400/30 px-2 py-1 rounded">Admin</span>
              <button
                className="px-4 py-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/40 rounded-lg text-sm font-medium hover:bg-neon-blue/30 transition-colors"
                onClick={() =>
                  addProject({
                    title: 'New Project',
                    description: null,
                    isPublic: true,
                    isArchived: false,
                    dueDate: null,
                  })
                }
              >
                + Project
              </button>
              <button
                onClick={logout}
                className="px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {isLoading && projects.length === 0 && (
        <div className="text-sm text-gray-500 py-8">Loading projects…</div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-3 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-gray-400 hover:text-white ml-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      <ProjectStack projects={active} isAdmin={isAdmin} onReorder={reorderProjects} />
      <ArchivedRow projects={archived} isAdmin={isAdmin} />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  )
}

export default App
