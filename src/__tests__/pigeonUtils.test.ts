import { describe, it, expect } from 'vitest'
import {
  RING_NUMBER_PATTERN,
  validateRingNumber,
  isLikelyScannerInput,
  calculateSpeed,
  calculateDistance,
  calculateRankings,
  calculateLoftRankings,
  formatTime,
  formatDuration,
  interpolatePosition,
} from '@/lib/pigeonUtils'
import type { PositionPoint, RaceRecord } from '@/types/pigeon'

describe('validateRingNumber', () => {
  it('应接受标准脚环编号格式', () => {
    expect(validateRingNumber('CHN-2024-0000001')).toBeNull()
    expect(validateRingNumber('CHN-2024-9999999')).toBeNull()
  })

  it('应接受带前后空格的脚环编号', () => {
    expect(validateRingNumber('  CHN-2024-0000001  ')).toBeNull()
  })

  it('应拒绝空字符串', () => {
    expect(validateRingNumber('')).toBe('请输入脚环编号')
    expect(validateRingNumber('   ')).toBe('请输入脚环编号')
  })

  it('应拒绝不完整的脚环编号', () => {
    expect(validateRingNumber('CHN-2024-00000')).not.toBeNull()
    expect(validateRingNumber('CHN-2024-000000')).not.toBeNull()
  })

  it('应拒绝缺少连字符的格式', () => {
    expect(validateRingNumber('CHN20240000001')).not.toBeNull()
  })

  it('应拒绝格式完全错误的输入', () => {
    expect(validateRingNumber('abc')).not.toBeNull()
    expect(validateRingNumber('12345')).not.toBeNull()
    expect(validateRingNumber('CHN-ABCD-0000001')).not.toBeNull()
    expect(validateRingNumber('CHN-2024-ABCDEFG')).not.toBeNull()
  })

  it('应拒绝长度达到14但格式不完整的输入（原bug场景）', () => {
    expect(validateRingNumber('CHN-2024-00000')).not.toBeNull()
  })
})

describe('RING_NUMBER_PATTERN', () => {
  it('应匹配标准脚环编号', () => {
    expect(RING_NUMBER_PATTERN.test('CHN-2024-0000001')).toBe(true)
  })

  it('应拒绝不完整的脚环编号', () => {
    expect(RING_NUMBER_PATTERN.test('CHN-2024-00000')).toBe(false)
    expect(RING_NUMBER_PATTERN.test('CHN-2024-000000')).toBe(false)
  })

  it('应拒绝非标格式', () => {
    expect(RING_NUMBER_PATTERN.test('')).toBe(false)
    expect(RING_NUMBER_PATTERN.test('CHN-2024')).toBe(false)
    expect(RING_NUMBER_PATTERN.test('CHN-2024-00000001')).toBe(false)
  })
})

describe('isLikelyScannerInput', () => {
  it('应识别扫码枪快速输入（一次追加3+字符）', () => {
    expect(isLikelyScannerInput('CHN-')).toBe(true)
    expect(isLikelyScannerInput('2024-')).toBe(true)
    expect(isLikelyScannerInput('CHN-2024-0000001')).toBe(true)
  })

  it('应拒绝手动逐字输入（每次追加少于3字符）', () => {
    expect(isLikelyScannerInput('C')).toBe(false)
    expect(isLikelyScannerInput('CH')).toBe(false)
    expect(isLikelyScannerInput('')).toBe(false)
  })

  it('应拒绝纯数字短输入', () => {
    expect(isLikelyScannerInput('12')).toBe(false)
  })
})

describe('calculateSpeed', () => {
  it('应正确计算分速（米/分钟）', () => {
    const release = new Date('2024-01-01T08:00:00')
    const arrival = new Date('2024-01-01T10:00:00')
    const distance = 500000

    const speed = calculateSpeed(distance, release, arrival)
    expect(speed).toBeCloseTo(4166.67, 1)
  })

  it('应在到达时间等于释放时间时返回0', () => {
    const time = new Date('2024-01-01T08:00:00')
    expect(calculateSpeed(1000, time, time)).toBe(0)
  })

  it('应在到达时间早于释放时间时返回0', () => {
    const release = new Date('2024-01-01T10:00:00')
    const arrival = new Date('2024-01-01T08:00:00')
    expect(calculateSpeed(1000, release, arrival)).toBe(0)
  })

  it('应处理短时间间隔', () => {
    const release = new Date('2024-01-01T08:00:00')
    const arrival = new Date('2024-01-01T08:01:00')
    const speed = calculateSpeed(1000, release, arrival)
    expect(speed).toBe(1000)
  })
})

describe('calculateDistance', () => {
  it('应计算两点之间的 Haversine 距离', () => {
    const beijing: PositionPoint = { lat: 39.9087, lng: 116.3975, timestamp: 0 }
    const shanghai: PositionPoint = { lat: 31.2304, lng: 121.4737, timestamp: 0 }

    const distance = calculateDistance(beijing, shanghai)
    expect(distance).toBeGreaterThan(900000)
    expect(distance).toBeLessThan(1200000)
  })

  it('应在两点相同时返回0', () => {
    const point: PositionPoint = { lat: 39.9087, lng: 116.3975, timestamp: 0 }
    const distance = calculateDistance(point, point)
    expect(distance).toBeCloseTo(0, 0)
  })
})

describe('calculateRankings', () => {
  it('应按分速从高到低排序并赋排名', () => {
    const records: RaceRecord[] = [
      {
        pigeonId: '1', ringNumber: 'R1', pigeonName: 'A', loftId: 'L1', loftName: 'L1',
        releaseTime: new Date('2024-01-01T08:00:00'), arrivalTime: new Date('2024-01-01T09:00:00'),
        distance: 60000, speed: 1000,
      },
      {
        pigeonId: '2', ringNumber: 'R2', pigeonName: 'B', loftId: 'L1', loftName: 'L1',
        releaseTime: new Date('2024-01-01T08:00:00'), arrivalTime: new Date('2024-01-01T08:30:00'),
        distance: 60000, speed: 2000,
      },
      {
        pigeonId: '3', ringNumber: 'R3', pigeonName: 'C', loftId: 'L2', loftName: 'L2',
        releaseTime: new Date('2024-01-01T08:00:00'), distance: 60000,
      },
    ]

    const ranked = calculateRankings(records)
    expect(ranked).toHaveLength(2)
    expect(ranked[0].rank).toBe(1)
    expect(ranked[0].pigeonId).toBe('2')
    expect(ranked[1].rank).toBe(2)
    expect(ranked[1].pigeonId).toBe('1')
  })

  it('应过滤未归巢的赛鸽', () => {
    const records: RaceRecord[] = [
      {
        pigeonId: '1', ringNumber: 'R1', pigeonName: 'A', loftId: 'L1', loftName: 'L1',
        releaseTime: new Date('2024-01-01T08:00:00'), distance: 60000,
      },
    ]
    const ranked = calculateRankings(records)
    expect(ranked).toHaveLength(0)
  })
})

describe('calculateLoftRankings', () => {
  it('应按鸽舍分组计算舍内排名', () => {
    const records: RaceRecord[] = [
      {
        pigeonId: '1', ringNumber: 'R1', pigeonName: 'A', loftId: 'L1', loftName: '蓝天',
        releaseTime: new Date('2024-01-01T08:00:00'), arrivalTime: new Date('2024-01-01T09:00:00'),
        distance: 60000, speed: 1000,
      },
      {
        pigeonId: '2', ringNumber: 'R2', pigeonName: 'B', loftId: 'L1', loftName: '蓝天',
        releaseTime: new Date('2024-01-01T08:00:00'), arrivalTime: new Date('2024-01-01T08:30:00'),
        distance: 60000, speed: 2000,
      },
    ]

    const loftMap = calculateLoftRankings(records)
    expect(loftMap.has('L1')).toBe(true)
    const loftRecords = loftMap.get('L1')!
    const ranked = loftRecords.find((r) => r.pigeonId === '2')
    expect(ranked?.loftRank).toBe(1)
    const unranked = loftRecords.find((r) => r.pigeonId === '1')
    expect(unranked?.loftRank).toBe(2)
  })
})

describe('formatTime', () => {
  it('应格式化时间为 HH:MM:SS', () => {
    const date = new Date('2024-01-01T14:05:09')
    expect(formatTime(date)).toBe('14:05:09')
  })
})

describe('formatDuration', () => {
  it('应格式化持续时间为 HH:MM:SS', () => {
    const start = new Date('2024-01-01T08:00:00')
    const end = new Date('2024-01-01T10:30:45')
    expect(formatDuration(start, end)).toBe('02:30:45')
  })
})

describe('interpolatePosition', () => {
  it('应在两点间线性插值', () => {
    const start: PositionPoint = { lat: 0, lng: 0, timestamp: 0 }
    const end: PositionPoint = { lat: 10, lng: 20, timestamp: 0 }

    const mid = interpolatePosition(start, end, 0.5)
    expect(mid.lat).toBeCloseTo(5)
    expect(mid.lng).toBeCloseTo(10)
  })

  it('应在 progress=0 时返回起点', () => {
    const start: PositionPoint = { lat: 0, lng: 0, timestamp: 0 }
    const end: PositionPoint = { lat: 10, lng: 20, timestamp: 0 }

    const result = interpolatePosition(start, end, 0)
    expect(result.lat).toBeCloseTo(0)
    expect(result.lng).toBeCloseTo(0)
  })

  it('应在 progress=1 时返回终点', () => {
    const start: PositionPoint = { lat: 0, lng: 0, timestamp: 0 }
    const end: PositionPoint = { lat: 10, lng: 20, timestamp: 0 }

    const result = interpolatePosition(start, end, 1)
    expect(result.lat).toBeCloseTo(10)
    expect(result.lng).toBeCloseTo(20)
  })

  it('应将 progress 限制在 [0, 1] 范围', () => {
    const start: PositionPoint = { lat: 0, lng: 0, timestamp: 0 }
    const end: PositionPoint = { lat: 10, lng: 20, timestamp: 0 }

    const below = interpolatePosition(start, end, -0.5)
    expect(below.lat).toBeCloseTo(0)
    expect(below.lng).toBeCloseTo(0)

    const above = interpolatePosition(start, end, 1.5)
    expect(above.lat).toBeCloseTo(10)
    expect(above.lng).toBeCloseTo(20)
  })
})
