export type DutyStatus = 'off_duty' | 'sleeper_berth' | 'driving' | 'on_duty'

export type StopType = 'start' | 'pickup' | 'dropoff' | 'fuel' | 'break' | 'rest' | 'restart'

export interface GeoPoint {
  query: string
  name: string
  lat: number
  lon: number
}

export interface Stop {
  type: StopType
  label: string
  location: string
  lat: number
  lon: number
  start: string
  end: string
  duration_hours: number
  trip_miles: number
}

export interface TripSegment {
  status: DutyStatus
  label: string
  start: string
  end: string
  miles: number
}

export interface LogEntry {
  status: DutyStatus
  label: string
  start_hour: number
  end_hour: number
  miles: number
}

export interface DailyLog {
  date: string
  entries: LogEntry[]
  totals: Record<DutyStatus, number>
  miles: number
  remarks: { hour: number; text: string }[]
  recap: {
    on_duty_today: number
    cycle_used: number
    cycle_available: number
  }
}

export interface TripSummary {
  total_miles: number
  driving_hours: number
  trip_hours: number
  starts_at: string
  ends_at: string
  days: number
}

export interface TripPlan {
  summary: TripSummary
  markers: { current: GeoPoint; pickup: GeoPoint; dropoff: GeoPoint }
  route: { geometry: [number, number][] }
  stops: Stop[]
  segments: TripSegment[]
  logs: DailyLog[]
}

export interface Trip {
  id: string
  current_location: string
  pickup_location: string
  dropoff_location: string
  cycle_used_hours: number
  plan: TripPlan
  created_at: string
}

export interface RecentTrip {
  id: string
  current_location: string
  pickup_location: string
  dropoff_location: string
  cycle_used_hours: number
  summary: TripSummary
  created_at: string
}

export interface TripInput {
  current_location: string
  pickup_location: string
  dropoff_location: string
  cycle_used_hours: number
  start_time?: string
}
