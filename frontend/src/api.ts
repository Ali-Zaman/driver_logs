import type { RecentTrip, Trip, TripInput } from './types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!response.ok) {
    let message = 'Something went wrong. Please try again.'
    try {
      const body = await response.json()
      message = body.detail ?? Object.values(body).flat().join(' ')
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, response.status)
  }

  return response.json()
}

export const createTrip = (input: TripInput) =>
  request<Trip>('/api/trips/', { method: 'POST', body: JSON.stringify(input) })

export const getTrip = (id: string) => request<Trip>(`/api/trips/${id}/`)

export const listRecentTrips = () => request<RecentTrip[]>('/api/trips/')
