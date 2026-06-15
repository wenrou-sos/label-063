export interface Loft {
  id: string
  name: string
  owner: string
  location: {
    lat: number
    lng: number
  }
  color: string
}

export interface Pigeon {
  id: string
  ringNumber: string
  name: string
  loftId: string
  loftName: string
  sex: '雄' | '雌'
  age: number
  status: PigeonStatus
  homeLocation: {
    lat: number
    lng: number
  }
}

export type PigeonStatus = '飞行中' | '已归巢' | '异常'

export interface RaceRecord {
  pigeonId: string
  ringNumber: string
  pigeonName: string
  loftId: string
  loftName: string
  releaseTime: Date
  arrivalTime?: Date
  distance: number
  speed?: number
  rank?: number
  loftRank?: number
}

export interface PositionPoint {
  lat: number
  lng: number
  timestamp: number
}

export interface LiveProgress {
  pigeonId: string
  ringNumber: string
  pigeonName: string
  loftName: string
  loftColor: string
  currentPosition: PositionPoint
  progress: number
  distanceRemaining: number
  estimatedSpeed: number
  status: PigeonStatus
}

export interface ScanResult {
  ringNumber: string
  scanTime: Date
  success: boolean
  message?: string
}
