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

export interface RaceBasicInfo {
  name: string
  distance: number
  releaseLocation: string
  releaseCoords: {
    lat: number
    lng: number
  }
  weather: string
  weatherDetail: string
  releaseTime: Date
  endTime: Date | null
}

export interface TopThreeRecord {
  rank?: number
  ringNumber: string
  pigeonName: string
  loftName: string
  speed?: number
  distance: number
  arrivalTime?: Date
  releaseTime: Date
}

export interface LoftRankingItem {
  loftId: string
  loftName: string
  loftColor: string
  totalPigeons: number
  arrivedPigeons: number
  returnRate: number
  avgSpeed: number
  bestSpeed: number
}

export interface TimeDistributionBin {
  start: number
  end: number
  label: string
}

export interface TimeDistribution {
  bins: TimeDistributionBin[]
  counts: number[]
  maxCount: number
}

export interface RaceReportData {
  basicInfo: RaceBasicInfo
  totalPigeons: number
  arrivedPigeons: number
  returnRate: number
  topThree: TopThreeRecord[]
  loftRankings: LoftRankingItem[]
  timeDistribution: TimeDistribution
  generateTime: Date
}
