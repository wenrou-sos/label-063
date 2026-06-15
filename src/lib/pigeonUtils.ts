import type { PositionPoint, RaceRecord } from '@/types/pigeon'

export function calculateDistance(point1: PositionPoint, point2: PositionPoint): number {
  const R = 6371000
  const lat1 = toRadians(point1.lat)
  const lat2 = toRadians(point2.lat)
  const deltaLat = toRadians(point2.lat - point1.lat)
  const deltaLng = toRadians(point2.lng - point1.lng)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function calculateSpeed(distance: number, releaseTime: Date, arrivalTime: Date): number {
  const timeDiffMinutes = (arrivalTime.getTime() - releaseTime.getTime()) / (1000 * 60)
  if (timeDiffMinutes <= 0) return 0
  return Number((distance / timeDiffMinutes).toFixed(2))
}

export function calculateSpeedFromMs(
  distanceMeters: number,
  releaseTime: Date,
  arrivalTime: Date
): number {
  return calculateSpeed(distanceMeters, releaseTime, arrivalTime)
}

export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

export function formatDuration(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(diffSeconds / 3600)
  const minutes = Math.floor((diffSeconds % 3600) / 60)
  const seconds = diffSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function interpolatePosition(
  start: PositionPoint,
  end: PositionPoint,
  progress: number
): PositionPoint {
  const clampedProgress = Math.max(0, Math.min(1, progress))
  return {
    lat: start.lat + (end.lat - start.lat) * clampedProgress,
    lng: start.lng + (end.lng - start.lng) * clampedProgress,
    timestamp: Date.now(),
  }
}

export function calculateRankings(records: RaceRecord[]): RaceRecord[] {
  const sorted = [...records]
    .filter((r) => r.arrivalTime && r.speed)
    .sort((a, b) => (b.speed || 0) - (a.speed || 0))

  sorted.forEach((record, index) => {
    record.rank = index + 1
  })

  return sorted
}

export function calculateLoftRankings(records: RaceRecord[]): Map<string, RaceRecord[]> {
  const loftMap = new Map<string, RaceRecord[]>()

  records.forEach((record) => {
    if (!loftMap.has(record.loftId)) {
      loftMap.set(record.loftId, [])
    }
    loftMap.get(record.loftId)!.push(record)
  })

  loftMap.forEach((loftRecords) => {
    const sorted = [...loftRecords]
      .filter((r) => r.arrivalTime && r.speed)
      .sort((a, b) => (b.speed || 0) - (a.speed || 0))
    sorted.forEach((record, index) => {
      record.loftRank = index + 1
    })
  })

  return loftMap
}
