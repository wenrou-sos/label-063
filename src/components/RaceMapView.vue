<script setup lang="ts">
import { computed } from 'vue'
import { MapPin, Home, Navigation } from 'lucide-vue-next'
import type { Loft, LiveProgress, PositionPoint } from '@/types/pigeon'

const props = defineProps<{
  lofs: Loft[]
  liveProgress: LiveProgress[]
  releasePoint: PositionPoint
}>()

const MAP_WIDTH = 800
const MAP_HEIGHT = 520
const PADDING = 60

const allPoints = computed(() => {
  const points = [
    props.releasePoint,
    ...props.lofs.map((l) => ({ lat: l.location.lat, lng: l.location.lng, timestamp: 0 })),
  ]

  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)

  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  const latRange = maxLat - minLat
  const lngRange = maxLng - minLng

  const range = Math.max(latRange, lngRange, 0.1)
  const scaleMinLat = minLat - range * 0.15
  const scaleMaxLat = maxLat + range * 0.15
  const scaleMinLng = minLng - range * 0.15
  const scaleMaxLng = maxLng + range * 0.15

  return {
    minLat: scaleMinLat,
    maxLat: scaleMaxLat,
    minLng: scaleMinLng,
    maxLng: scaleMaxLng,
    range: scaleMaxLat - scaleMinLat,
  }
})

function latLngToXY(lat: number, lng: number) {
  const { minLat, maxLat, minLng, maxLng } = allPoints.value

  const latDelta = maxLat - minLat
  const lngDelta = maxLng - minLng

  const x = PADDING + ((lng - minLng) / lngDelta) * (MAP_WIDTH - PADDING * 2)
  const y = MAP_HEIGHT - PADDING - ((lat - minLat) / latDelta) * (MAP_HEIGHT - PADDING * 2)

  return { x, y }
}

const releasePointXY = computed(() =>
  latLngToXY(props.releasePoint.lat, props.releasePoint.lng)
)

const loftPositions = computed(() =>
  props.lofs.map((loft) => ({
    ...loft,
    position: latLngToXY(loft.location.lat, loft.location.lng),
  }))
)

const pigeonPositions = computed(() =>
  props.liveProgress.map((progress) => ({
    pigeonId: progress.pigeonId,
    pigeonName: progress.pigeonName,
    ringNumber: progress.ringNumber,
    loftName: progress.loftName,
    loftColor: progress.loftColor,
    position: latLngToXY(
      progress.currentPosition.lat,
      progress.currentPosition.lng
    ),
    status: progress.status,
    progress: progress.progress,
  }))
)

function getLoftById(loftId: string) {
  return props.lofs.find((l) => l.id === loftId)
}

function getLoftPosition(loftColor: string) {
  const loft = props.lofs.find((l) => l.color === loftColor)
  if (!loft) return { x: 0, y: 0 }
  return latLngToXY(loft.location.lat, loft.location.lng)
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Navigation class="w-5 h-5 text-sky-600 animate-spin [animation-duration:8s]" />
            归巢路线模拟
          </h2>
          <p class="text-sm text-slate-500 mt-0.5">
            赛鸽从司放地至各鸽舍飞行轨迹
          </p>
        </div>
        <div class="flex items-center gap-4 text-xs">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
            <span class="text-slate-600">司放地</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded bg-sky-500 shadow-sm" />
            <span class="text-slate-600">鸽舍</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
            <span class="text-slate-600">飞行中</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
            <span class="text-slate-600">已归巢</span>
          </div>
        </div>
      </div>
    </div>

    <div class="relative" :style="{ height: MAP_HEIGHT + 'px' }">
      <svg
        :viewBox="`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`" class="w-full h-full">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#e2e8f0"
              stroke-width="1"
            />
          </pattern>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect
          x="0" y="0" :width="MAP_WIDTH" :height="MAP_HEIGHT" fill="url(#grid)" />

        <template v-for="loft in loftPositions">
          <line
            :x1="releasePointXY.x"
            :y1="releasePointXY.y"
            :x2="loft.position.x"
            :y2="loft.position.y"
            :stroke="loft.color"
            stroke-width="2"
            stroke-dasharray="6 4"
            stroke-opacity="0.4"
          />
        </template>

        <g>
          <circle
            :cx="releasePointXY.x"
            :cy="releasePointXY.y"
            r="18"
            fill="#ef4444"
            opacity="0.2"
          />
          <circle
            :cx="releasePointXY.x"
            :cy="releasePointXY.y"
            r="12"
            fill="#ef4444"
            filter="url(#glow)"
          />
          <text
            :x="releasePointXY.x"
            :y="releasePointXY.y - 28"
            text-anchor="middle"
            class="text-xs font-bold fill-white"
          >
            司放地
          </text>
        </g>

        <g v-for="loft in loftPositions" :key="loft.id">
          <rect
            :x="loft.position.x - 12"
            :y="loft.position.y - 10"
            width="24"
            height="20"
            rx="4"
            :fill="loft.color"
            filter="url(#glow)"
          />
          <polygon
            :points="`${loft.position.x - 14},${loft.position.y - 10} ${loft.position.x},${loft.position.y - 20} ${loft.position.x + 14},${loft.position.y - 10}`"
            :fill="loft.color"
          />
          <text
            :x="loft.position.x"
            :y="loft.position.y + 4"
            text-anchor="middle"
            class="text-[10px] font-bold fill-white"
          >
            🏠
          </text>
          <text
            :x="loft.position.x"
            :y="loft.position.y + 36"
            text-anchor="middle"
            class="text-xs font-semibold fill-slate-700"
          >
            {{ loft.name }}
          </text>
        </g>

        <g v-for="pigeon in pigeonPositions" :key="pigeon.pigeonId">
          <circle
            v-if="pigeon.status === '飞行中'"
            :cx="pigeon.position.x"
            :cy="pigeon.position.y"
            r="16"
            :fill="pigeon.loftColor"
            opacity="0.25"
            class="animate-ping"
          />
          <circle
            :cx="pigeon.position.x"
            :cy="pigeon.position.y"
            :r="pigeon.status === '已归巢' ? 8 : 10"
            :fill="pigeon.status === '已归巢' ? '#f59e0b' : '#10b981'"
            stroke="white"
            stroke-width="2"
            filter="url(#glow)"
          />
          <text
            :x="pigeon.position.x"
            :y="pigeon.position.y + 1"
            text-anchor="middle"
            class="text-[10px] font-bold fill-white"
          >
            🕊️
          </text>
          <title>
            {{ `${pigeon.pigeonName} (${pigeon.ringNumber}) - ${pigeon.loftName} - ${(pigeon.progress * 100).toFixed(1)}%` }}
          </title>
        </g>
      </svg>
    </div>
  </div>
</template>
