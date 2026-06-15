<script setup lang="ts">
import { Feather, CheckCircle, Plane, Zap } from 'lucide-vue-next'

interface Stats {
  total: number
  arrived: number
  inFlight: number
  bestSpeed: number
}

defineProps<{
  stats: Stats
  releaseTime: Date
  currentTime: Date
}>()

function getElapsedTime(release: Date, now: Date) {
  const diffMs = now.getTime() - release.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(diffSeconds / 3600)
  const minutes = Math.floor((diffSeconds % 3600) / 60)
  const seconds = diffSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
    <div
      class="relative rounded-2xl p-5 bg-white border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all"
    >
      <div
        class="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-sky-100 opacity-50 group-hover:scale-110 transition-transform"
      />
      <div class="relative">
        <div class="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center mb-3">
          <Feather class="w-5 h-5 text-sky-600" />
        </div>
        <div class="text-3xl font-bold text-slate-800">{{ stats.total }}</div>
        <div class="text-sm text-slate-500 mt-1">参赛总数</div>
      </div>
    </div>

    <div
      class="relative rounded-2xl p-5 bg-white border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all"
    >
      <div
        class="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-emerald-100 opacity-50 group-hover:scale-110 transition-transform"
      />
      <div class="relative">
        <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
          <CheckCircle class="w-5 h-5 text-emerald-600" />
        </div>
        <div class="text-3xl font-bold text-slate-800">
          {{ stats.arrived }}
          <span class="text-lg font-normal text-slate-400 ml-1">
            ({{ stats.total ? ((stats.arrived / stats.total) * 100).toFixed(1) : 0 }}%)
          </span>
        </div>
        <div class="text-sm text-slate-500 mt-1">已归巢</div>
      </div>
    </div>

    <div
      class="relative rounded-2xl p-5 bg-white border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all"
    >
      <div
        class="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-indigo-100 opacity-50 group-hover:scale-110 transition-transform"
      />
      <div class="relative">
        <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
          <Plane class="w-5 h-5 text-indigo-600 animate-bounce" style="animation-duration: 2s" />
        </div>
        <div class="text-3xl font-bold text-slate-800">{{ stats.inFlight }}</div>
        <div class="text-sm text-slate-500 mt-1">飞行中</div>
      </div>
    </div>

    <div
      class="relative rounded-2xl p-5 bg-white border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all"
    >
      <div
        class="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-amber-100 opacity-50 group-hover:scale-110 transition-transform"
      />
      <div class="relative">
        <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
          <Zap class="w-5 h-5 text-amber-600" />
        </div>
        <div class="text-3xl font-bold text-slate-800 font-mono">
          {{ stats.bestSpeed.toFixed(1) }}
          <span class="text-sm font-normal text-slate-400 ml-1">m/分</span>
        </div>
        <div class="text-sm text-slate-500 mt-1">最高分速</div>
      </div>
    </div>

    <div
      class="relative rounded-2xl p-5 bg-white border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all col-span-2 md:col-span-2 lg:col-span-2"
    >
      <div class="flex h-full items-center justify-between">
        <div>
          <div class="text-xs text-slate-500 mb-1">比赛计时</div>
          <div class="text-4xl font-bold font-mono text-slate-800 tracking-wider">
            {{ getElapsedTime(releaseTime, currentTime) }}
          </div>
          <div class="text-sm text-slate-500 mt-2">
            司放时间：{{ releaseTime.toLocaleTimeString('zh-CN') }}
          </div>
        </div>
        <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <svg class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>
