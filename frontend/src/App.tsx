import { useProjectStore } from './store/useProjectStore'
import { activeProjectsSorted, archivedProjectsSorted } from './store/selectors'
import { ProjectStack } from './components/ProjectStack'
import { ArchivedRow } from './components/ArchivedRow'

function App() {
  const projects = useProjectStore((s) => s.projects)
  const isAdmin = useProjectStore((s) => s.isAdmin)
  const addProject = useProjectStore((s) => s.addProject)
  const reorderProjects = useProjectStore((s) => s.reorderProjects)

  const active = activeProjectsSorted(projects)
  const archived = archivedProjectsSorted(projects)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Project Stack</h1>
        {isAdmin && (
          <button
            className="px-4 py-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/40 rounded-lg text-sm font-medium hover:bg-neon-blue/30 transition-colors"
            onClick={() =>
              addProject({
                title: 'New Project',
                description: null,
                isPublic: true,
                isArchived: false,
                isDeleted: false,
                dueDate: null,
              })
            }
          >
            + Project
          </button>
        )}
      </div>

      <ProjectStack projects={active} isAdmin={isAdmin} onReorder={reorderProjects} />
      <ArchivedRow projects={archived} isAdmin={isAdmin} />
    </div>
  )
}

export default App
