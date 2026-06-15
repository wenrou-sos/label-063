import { ref, reactive, computed, onUnmounted } from 'vue'
import type {
  Loft,
  Pigeon,
  RaceRecord,
  LiveProgress,
  ScanResult,
  PositionPoint,
  LoftRankingItem,
  RaceReportData,
} from '@/types/pigeon'
import {
  calculateDistance,
  calculateSpeed,
  interpolatePosition,
  calculateRankings,
  calculateLoftRankings,
} from '@/lib/pigeonUtils'

const RACE_RELEASE_POINT: PositionPoint = {
  lat: 39.9087,
  lng: 116.3975,
  timestamp: 0,
}

const MOCK_LOFTS: Loft[] = [
  {
    id: 'loft-1',
    name: '蓝天鸽舍',
    owner: '张明',
    location: { lat: 31.2304, lng: 121.4737 },
    color: '#3B82F6',
  },
  {
    id: 'loft-2',
    name: '风云鸽舍',
    owner: '李强',
    location: { lat: 31.2350, lng: 121.4820 },
    color: '#10B981',
  },
  {
    id: 'loft-3',
    name: '闪电鸽舍',
    owner: '王伟',
    location: { lat: 31.2250, lng: 121.4680 },
    color: '#F59E0B',
  },
  {
    id: 'loft-4',
    name: '雄鹰鸽舍',
    owner: '赵刚',
    location: { lat: 31.2400, lng: 121.4900 },
    color: '#EF4444',
  },
  {
    id: 'loft-5',
    name: '金翼鸽舍',
    owner: '孙磊',
    location: { lat: 31.2200, lng: 121.4580 },
    color: '#8B5CF6',
  },
]

const PIGEON_NAMES = [
  '追风', '闪电', '神翼', '疾风', '飞鹰', '翔龙', '天霸', '凌云',
  '铁翼', '金鹰', '战狼', '风神', '羽神', '雷霆', '流星', '银翼',
  '蓝焰', '红日', '苍穹', '北斗',
]

function generateMockPigeons(): Pigeon[] {
  const pigeons: Pigeon[] = []
  let pigeonIndex = 0

  MOCK_LOFTS.forEach((loft) => {
    const pigeonCount = 3 + Math.floor(Math.random() * 3)
    for (let i = 0; i < pigeonCount; i++) {
      const ringNum = 20240000001 + pigeonIndex
      pigeons.push({
        id: `pigeon-${pigeonIndex + 1}`,
        ringNumber: `CHN-2024-${ringNum.toString().slice(-7)}`,
        name: PIGEON_NAMES[pigeonIndex % PIGEON_NAMES.length],
        loftId: loft.id,
        loftName: loft.name,
        sex: Math.random() > 0.5 ? '雄' : '雌',
        age: 1 + Math.floor(Math.random() * 4),
        status: '飞行中',
        homeLocation: { ...loft.location },
      })
      pigeonIndex++
    }
  })

  return pigeons
}

export function usePigeonRace() {
  const lofs = ref<Loft[]>(MOCK_LOFTS)
  const pigeons = ref<Pigeon[]>(generateMockPigeons())
  const releaseTime = ref<Date>(new Date(Date.now() - 3 * 60 * 60 * 1000))
  const raceRecords = reactive<RaceRecord[]>([])
  const liveProgress = reactive<LiveProgress[]>([])
  const scanHistory = ref<ScanResult[]>([])
  const isSimulationRunning = ref(false)
  const isInitialized = ref(false)
  const currentTime = ref<Date>(new Date())

  let simulationTimer: number | null = null
  let timeUpdateTimer: number | null = null

  function initRace() {
    raceRecords.length = 0
    liveProgress.length = 0

    pigeons.value.forEach((pigeon) => {
      const distance = calculateDistance(RACE_RELEASE_POINT, {
        lat: pigeon.homeLocation.lat,
        lng: pigeon.homeLocation.lng,
        timestamp: 0,
      })

      raceRecords.push({
        pigeonId: pigeon.id,
        ringNumber: pigeon.ringNumber,
        pigeonName: pigeon.name,
        loftId: pigeon.loftId,
        loftName: pigeon.loftName,
        releaseTime: releaseTime.value,
        distance: Number(distance.toFixed(1)),
      })

      const loft = lofs.value.find((l) => l.id === pigeon.loftId)
      liveProgress.push({
        pigeonId: pigeon.id,
        ringNumber: pigeon.ringNumber,
        pigeonName: pigeon.name,
        loftName: pigeon.loftName,
        loftColor: loft?.color || '#6B7280',
        currentPosition: { ...RACE_RELEASE_POINT, timestamp: Date.now() },
        progress: 0,
        distanceRemaining: distance,
        estimatedSpeed: 800 + Math.random() * 600,
        status: '飞行中',
      })
    })
  }

  function updateLiveProgress() {
    liveProgress.forEach((progress) => {
      if (progress.status === '已归巢') return

      const baseSpeed = progress.estimatedSpeed
      const speedVariation = (Math.random() - 0.5) * 200
      const currentSpeed = Math.max(400, baseSpeed + speedVariation)

      const record = raceRecords.find((r) => r.pigeonId === progress.pigeonId)
      if (!record) return

      const timeStepMinutes = 1 / 60
      const distanceStep = currentSpeed * timeStepMinutes
      const progressIncrement = distanceStep / record.distance

      progress.progress = Math.min(1, progress.progress + progressIncrement)
      progress.distanceRemaining = Math.max(0, record.distance * (1 - progress.progress))
      progress.estimatedSpeed = Number(currentSpeed.toFixed(2))

      const pigeon = pigeons.value.find((p) => p.id === progress.pigeonId)
      if (pigeon) {
        progress.currentPosition = interpolatePosition(
          { ...RACE_RELEASE_POINT, timestamp: 0 },
          { lat: pigeon.homeLocation.lat, lng: pigeon.homeLocation.lng, timestamp: 0 },
          progress.progress
        )
      }

      if (progress.progress >= 1) {
        progress.status = '已归巢'
        const pigeonToUpdate = pigeons.value.find((p) => p.id === progress.pigeonId)
        if (pigeonToUpdate) pigeonToUpdate.status = '已归巢'
        recordArrival(progress.pigeonId, new Date())
      }
    })
  }

  function recordArrival(pigeonId: string, arrivalTime: Date): boolean {
    const record = raceRecords.find((r) => r.pigeonId === pigeonId)
    if (!record) return false

    if (record.arrivalTime) return false

    record.arrivalTime = arrivalTime
    record.speed = calculateSpeed(record.distance, record.releaseTime, arrivalTime)

    const pigeon = pigeons.value.find((p) => p.id === pigeonId)
    if (pigeon) pigeon.status = '已归巢'

    const progress = liveProgress.find((p) => p.pigeonId === pigeonId)
    if (progress) {
      progress.status = '已归巢'
      progress.progress = 1
      progress.distanceRemaining = 0
    }

    scanHistory.value.unshift({
      ringNumber: record.ringNumber,
      scanTime: arrivalTime,
      success: true,
      message: `${record.pigeonName} 成功归巢！`,
    })

    return true
  }

  function scanRingNumber(ringNumber: string): ScanResult {
    const trimmedRing = ringNumber.trim()

    const pigeon = pigeons.value.find((p) => p.ringNumber === trimmedRing)
    if (!pigeon) {
      const result: ScanResult = {
        ringNumber: trimmedRing,
        scanTime: new Date(),
        success: false,
        message: '未找到该脚环编号的赛鸽',
      }
      scanHistory.value.unshift(result)
      return result
    }

    const record = raceRecords.find((r) => r.pigeonId === pigeon.id)
    if (!record) {
      const result: ScanResult = {
        ringNumber: trimmedRing,
        scanTime: new Date(),
        success: false,
        message: '该赛鸽未参与本次比赛',
      }
      scanHistory.value.unshift(result)
      return result
    }

    if (record.arrivalTime) {
      const result: ScanResult = {
        ringNumber: trimmedRing,
        scanTime: new Date(),
        success: false,
        message: '该赛鸽已记录归巢',
      }
      scanHistory.value.unshift(result)
      return result
    }

    const arrivalTime = new Date()
    recordArrival(pigeon.id, arrivalTime)

    return {
      ringNumber: trimmedRing,
      scanTime: arrivalTime,
      success: true,
      message: `${pigeon.name} 成功归巢！`,
    }
  }

  function startSimulation() {
    if (isSimulationRunning.value) return
    isSimulationRunning.value = true

    if (!isInitialized.value) {
      initRace()
      isInitialized.value = true
    }

    simulationTimer = window.setInterval(() => {
      updateLiveProgress()
    }, 1000)

    timeUpdateTimer = window.setInterval(() => {
      currentTime.value = new Date()
    }, 1000)
  }

  function stopSimulation() {
    isSimulationRunning.value = false
    if (simulationTimer) {
      clearInterval(simulationTimer)
      simulationTimer = null
    }
    if (timeUpdateTimer) {
      clearInterval(timeUpdateTimer)
      timeUpdateTimer = null
    }
  }

  function resetRace() {
    stopSimulation()
    pigeons.value.forEach((p) => (p.status = '飞行中'))
    scanHistory.value = []
    isInitialized.value = false
    initRace()
    isInitialized.value = true
  }

  const rankedRecords = computed(() => calculateRankings([...raceRecords]))

  const loftGroupedRecords = computed(() => {
    const map = calculateLoftRankings([...raceRecords])
    const result: { loft: Loft; records: RaceRecord[]; avgSpeed: number }[] = []

    map.forEach((records, loftId) => {
      const loft = lofs.value.find((l) => l.id === loftId)
      if (!loft) return

      const arrivedRecords = records.filter((r) => r.arrivalTime && r.speed)
      const avgSpeed =
        arrivedRecords.length > 0
          ? arrivedRecords.reduce((sum, r) => sum + (r.speed || 0), 0) / arrivedRecords.length
          : 0

      result.push({
        loft,
        records: [...records].sort((a, b) => (b.speed || 0) - (a.speed || 0)),
        avgSpeed: Number(avgSpeed.toFixed(2)),
      })
    })

    return result.sort((a, b) => b.avgSpeed - a.avgSpeed)
  })

  const stats = computed(() => {
    const total = pigeons.value.length
    const arrived = raceRecords.filter((r) => r.arrivalTime).length
    const inFlight = total - arrived
    const bestSpeed = rankedRecords.value[0]?.speed || 0

    return {
      total,
      arrived,
      inFlight,
      bestSpeed,
    }
  })

  const isRaceFinished = computed(() => {
    return stats.value.arrived > 0 && stats.value.inFlight === 0
  })

  const raceBasicInfo = computed(() => {
    const distances = raceRecords.map((r) => r.distance)
    const avgDistance = distances.length > 0
      ? distances.reduce((a, b) => a + b, 0) / distances.length
      : 0

    return {
      name: '第 2024 届春季全国精英赛',
      distance: Number((avgDistance / 1000).toFixed(2)),
      releaseLocation: '北京市天安门',
      releaseCoords: {
        lat: RACE_RELEASE_POINT.lat,
        lng: RACE_RELEASE_POINT.lng,
      },
      weather: '晴 · 微风',
      weatherDetail: '东南风 2-3 级 · 22°C',
      releaseTime: releaseTime.value,
      endTime: isRaceFinished.value
        ? raceRecords.reduce((latest, r) => {
            if (!r.arrivalTime) return latest
            return r.arrivalTime > latest ? r.arrivalTime : latest
          }, releaseTime.value)
        : null,
    }
  })

  const topThreeRecords = computed(() => {
    return rankedRecords.value.slice(0, 3).map((r) => ({
      rank: r.rank,
      ringNumber: r.ringNumber,
      pigeonName: r.pigeonName,
      loftName: r.loftName,
      speed: r.speed,
      distance: r.distance,
      arrivalTime: r.arrivalTime,
      releaseTime: r.releaseTime,
    }))
  })

  const loftReturnRankings = computed<LoftRankingItem[]>(() => {
    const loftStats: Map<string, LoftRankingItem> = new Map()

    lofs.value.forEach((loft) => {
      loftStats.set(loft.id, {
        loftId: loft.id,
        loftName: loft.name,
        loftColor: loft.color,
        totalPigeons: 0,
        arrivedPigeons: 0,
        returnRate: 0,
        avgSpeed: 0,
        bestSpeed: 0,
      })
    })

    raceRecords.forEach((record) => {
      const stat = loftStats.get(record.loftId)
      if (!stat) return

      stat.totalPigeons++
      if (record.arrivalTime) {
        stat.arrivedPigeons++
        if (record.speed) {
          stat.avgSpeed += record.speed
          if (record.speed > stat.bestSpeed) {
            stat.bestSpeed = record.speed
          }
        }
      }
    })

    const result: LoftRankingItem[] = []
    loftStats.forEach((stat) => {
      if (stat.totalPigeons > 0) {
        stat.returnRate = Number(((stat.arrivedPigeons / stat.totalPigeons) * 100).toFixed(2))
        stat.avgSpeed = stat.arrivedPigeons > 0
          ? Number((stat.avgSpeed / stat.arrivedPigeons).toFixed(2))
          : 0
        result.push(stat)
      }
    })

    return result.sort((a, b) => b.returnRate - a.returnRate)
  })

  const arrivalTimeDistribution = computed(() => {
    const arrivedRecords = raceRecords.filter((r) => r.arrivalTime)
    if (arrivedRecords.length === 0) {
      return { bins: [], counts: [], maxCount: 0 }
    }

    const arrivalTimes = arrivedRecords.map((r) => {
      const diffMs = r.arrivalTime!.getTime() - r.releaseTime.getTime()
      return diffMs / (1000 * 60)
    })

    const minTime = Math.min(...arrivalTimes)
    const maxTime = Math.max(...arrivalTimes)
    const binCount = Math.min(10, Math.ceil(maxTime - minTime) || 1)
    const binSize = Math.max(10, (maxTime - minTime) / binCount)

    const bins: { start: number; end: number; label: string }[] = []
    const counts: number[] = []

    for (let i = 0; i < binCount; i++) {
      const start = minTime + i * binSize
      const end = minTime + (i + 1) * binSize
      const startMins = Math.floor(start)
      const endMins = Math.floor(end)
      bins.push({
        start,
        end,
        label: `${startMins}-${endMins}分钟`,
      })
      counts.push(0)
    }

    arrivalTimes.forEach((time) => {
      const binIndex = Math.min(
        Math.floor((time - minTime) / binSize),
        binCount - 1
      )
      if (binIndex >= 0 && binIndex < counts.length) {
        counts[binIndex]++
      }
    })

    return {
      bins,
      counts,
      maxCount: Math.max(...counts),
    }
  })

  function generateReportData(): RaceReportData {
    return {
      basicInfo: raceBasicInfo.value,
      totalPigeons: stats.value.total,
      arrivedPigeons: stats.value.arrived,
      returnRate: stats.value.total > 0
        ? Number(((stats.value.arrived / stats.value.total) * 100).toFixed(2))
        : 0,
      topThree: topThreeRecords.value,
      loftRankings: loftReturnRankings.value,
      timeDistribution: arrivalTimeDistribution.value,
      generateTime: new Date(),
    }
  }

  const raceReleasePoint = computed(() => RACE_RELEASE_POINT)

  onUnmounted(() => {
    stopSimulation()
  })

  return {
    lofs,
    pigeons,
    releaseTime,
    raceRecords,
    liveProgress,
    scanHistory,
    isSimulationRunning,
    currentTime,
    rankedRecords,
    loftGroupedRecords,
    stats,
    raceReleasePoint,
    isRaceFinished,
    raceBasicInfo,
    topThreeRecords,
    loftReturnRankings,
    arrivalTimeDistribution,
    initRace,
    scanRingNumber,
    startSimulation,
    stopSimulation,
    resetRace,
    generateReportData,
  }
}
