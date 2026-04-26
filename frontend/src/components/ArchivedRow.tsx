import { memo } from 'react'
import { ProjectCard } from './ProjectCard'
import type { Project } from '../types'

interface ArchivedRowProps {
  projects: Project[]
  isAdmin: boolean
}

export const ArchivedRow = memo(function ArchivedRow({ projects, isAdmin }: ArchivedRowProps) {
  if (projects.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 text-gray-500 tracking-wide uppercase text-sm">
        Completed
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin min-h-[180px]">
        {projects.map((project) => (
          <div key={project.id} className="animate-fade-in">
            <ProjectCard
              project={project}
              isAdmin={isAdmin}
              isArchived={true}
            />
          </div>
        ))}
      </div>
    </div>
  )
})
