import { QueryClient, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { useProfile } from 'lib/profile'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'
import type { Project } from './project-detail-query'

export type ProjectsVariables = {
  ref?: string
}

export type ProjectInfo = components['schemas']['ProjectInfo']

export async function getProjects({
  signal,
  headers,
}: {
  signal?: AbortSignal
  headers?: Record<string, string>
}) {
  const { data, error } = await get('/platform/projects', { signal, headers })

  if (error) handleError(error)
  return data as ProjectInfo[]
}

export type ProjectsData = Awaited<ReturnType<typeof getProjects>>
export type ProjectsError = ResponseError

export const useProjectsQuery = <TData = ProjectsData>({
  enabled = true,
  ...options
}: UseQueryOptions<ProjectsData, ProjectsError, TData> = {}) => {
  const { profile } = useProfile()
  return useQuery<ProjectsData, ProjectsError, TData>(
    projectKeys.list(),
    ({ signal }) => getProjects({ signal }),
    {
      enabled: enabled && profile !== undefined,
      staleTime: 30 * 60 * 1000, // 30 minutes
      ...options,
    }
  )
}

export function prefetchProjects(client: QueryClient) {
  return client.prefetchQuery(projectKeys.list(), ({ signal }) => getProjects({ signal }))
}

export function useProjectsPrefetch() {
  const client = useQueryClient()

  return useCallback(() => {
    prefetchProjects(client)
  }, [client])
}

export function useAutoProjectsPrefetch() {
  const prefetch = useProjectsPrefetch()

  const called = useRef<boolean>(false)
  if (called.current === false) {
    called.current = true
    prefetch()
  }
}

export function invalidateProjectsQuery(client: QueryClient) {
  return client.invalidateQueries(projectKeys.list())
}

export function setProjectStatus(
  client: QueryClient,
  projectRef: Project['ref'],
  status: Project['status']
) {
  client.setQueriesData<Project[] | undefined>(
    projectKeys.list(),
    (old) => {
      if (!old) return old

      return old.map((project) => {
        if (project.ref === projectRef) {
          return { ...project, status }
        }
        return project
      })
    },
    { updatedAt: Date.now() }
  )

  client.setQueriesData<Project>(
    projectKeys.detail(projectRef),
    (old) => {
      if (!old) return old

      return { ...old, status }
    },
    { updatedAt: Date.now() }
  )
}

export function setProjectPostgrestStatus(
  client: QueryClient,
  projectRef: Project['ref'],
  status: Project['postgrestStatus']
) {
  client.setQueriesData<Project>(
    projectKeys.detail(projectRef),
    (old) => {
      if (!old) return old

      return { ...old, postgrestStatus: status }
    },
    { updatedAt: Date.now() }
  )
}
