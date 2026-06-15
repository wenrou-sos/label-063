<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Play, Pause, RotateCcw, Trophy, Shield, Radio, BarChart3 } from 'lucide-vue-next'
import { usePigeonRace } from '@/composables/usePigeonRace'
import RaceStatsCards from '@/components/RaceStatsCards.vue'
import LiveProgressPanel from '@/components/LiveProgressPanel.vue'
import RankingBoard from '@/components/RankingBoard.vue'
import LoftGroupRanking from '@/components/LoftGroupRanking.vue'
import RaceMapView from '@/components/RaceMapView.vue'
import RingScanPanel from '@/components/RingScanPanel.vue'
import ProgressTrendChart from '@/components/charts/ProgressTrendChart.vue'
import LoftCompareBarChart from '@/components/charts/LoftCompareBarChart.vue'
import SpeedDistributionChart from '@/components/charts/SpeedDistributionChart.vue'

const {
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
  scanRingNumber,
  startSimulation,
  stopSimulation,
  resetRace,
} = usePigeonRace()

const activeTab = ref<'progress' | 'map' | 'ranking' | 'lofts' | 'dashboard'>('map')

const inFlightPigeons = computed(() =>
  pigeons.value.filter((p) => p.status === '飞行中')
)

const loftChartStats = computed(() => {
  return loftGroupedRecords.value.map((group) => {
    const arrivedRecords = group.records.filter((r) => r.arrivalTime && r.speed)
    const bestSpeed = arrivedRecords.length > 0
      ? Math.max(...arrivedRecords.map((r) => r.speed || 0))
      : 0

    return {
      loft: group.loft,
      avgSpeed: group.avgSpeed,
      bestSpeed,
      count: group.records.length,
      arrivedCount: arrivedRecords.length,
    }
  })
})

function handleScan(ringNumber: string) {
  scanRingNumber(ringNumber)
}

onMounted(() => {
  startSimulation()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100">
    <header class="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 shadow-sm">
      <div class="container mx-auto px-4 lg:px-6">
        <div class="h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C9.5 2 7 4 7 7c0 1.5.5 2.5 1.5 3.5L7 13h10l-1.5-2.5C16.5 9.5 17 8.5 17 7c0-3-2.5-5-5-5zm-1 4a1 1 0 110 2 1 1 0 010-2zm2 0a1 1 0 110 2 1 1 0 010-2zM5 14l-2 5v2h18v-2l-2-5H5z" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold text-slate-800 tracking-tight">
                赛鸽竞翔成绩实时展示系统
              </h1>
              <p class="text-xs text-slate-500 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                第 2024 届春季全国精英赛 · 500 公里
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 mr-2">
              <Radio class="w-4 h-4 text-emerald-500 animate-pulse" />
              <span class="text-sm font-medium text-slate-700">实时直播中</span>
            </div>

            <div
              class="flex items-center gap-1 p-1 rounded-xl bg-slate-100"
              role="tablist"
            >
              <button
                @click="activeTab = 'map'"
                :class="[
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  activeTab === 'map'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800',
                ]"
              >
                地图
              </button>
              <button
                @click="activeTab = 'progress'"
                :class="[
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  activeTab === 'progress'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800',
                ]"
              >
                进度
              </button>
              <button
                @click="activeTab = 'ranking'"
                :class="[
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                  activeTab === 'ranking'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800',
                ]"
              >
                <Trophy class="w-3.5 h-3.5" />
                排名
              </button>
              <button
                @click="activeTab = 'lofts'"
                :class="[
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                  activeTab === 'lofts'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800',
                ]"
              >
                <Shield class="w-3.5 h-3.5" />
                鸽舍
              </button>
              <button
                @click="activeTab = 'dashboard'"
                :class="[
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                  activeTab === 'dashboard'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800',
                ]"
              >
                <BarChart3 class="w-3.5 h-3.5" />
                看板
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="!isSimulationRunning"
                @click="startSimulation"
                class="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <Play class="w-4 h-4" />
                开始
              </button>
              <button
                v-else
                @click="stopSimulation"
                class="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <Pause class="w-4 h-4" />
                暂停
              </button>
              <button
                @click="resetRace"
                class="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <RotateCcw class="w-4 h-4" />
                重置
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-4 lg:px-6 py-6 space-y-6">
      <RaceStatsCards
        :stats="stats"
        :release-time="releaseTime"
        :current-time="currentTime"
      />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div v-show="activeTab === 'map'">
            <RaceMapView
              :lofs="lofs"
              :live-progress="liveProgress"
              :release-point="raceReleasePoint"
            />
          </div>

          <div v-show="activeTab === 'progress'">
            <LiveProgressPanel
              :live-progress="liveProgress"
              :current-time="currentTime"
            />
          </div>

          <div v-show="activeTab === 'ranking'">
            <RankingBoard :ranked-records="rankedRecords" />
          </div>

          <div v-show="activeTab === 'lofts'">
            <LoftGroupRanking :loft-groups="loftGroupedRecords" />
          </div>

          <div v-show="activeTab === 'dashboard'" class="space-y-6">
            <ProgressTrendChart
              :race-records="raceRecords"
              :release-time="releaseTime"
              :current-time="currentTime"
              :total-pigeons="stats.total"
            />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LoftCompareBarChart :loft-stats="loftChartStats" />
              <SpeedDistributionChart
                :race-records="raceRecords"
                :lofs="lofs"
              />
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <RingScanPanel
            :scan-history="scanHistory"
            :in-flight-pigeons="inFlightPigeons"
            @scan="handleScan"
          />

          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/50">
              <h3 class="font-bold text-slate-700 text-sm">裁判信息板</h3>
            </div>
            <div class="p-5 space-y-4">
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="p-3 rounded-xl bg-slate-50">
                  <div class="text-xs text-slate-500 mb-1">司放地</div>
                  <div class="font-semibold text-slate-800">北京市天安门</div>
                  <div class="text-xs text-slate-400 mt-0.5">
                    {{ raceReleasePoint.lat.toFixed(4) }}°N, {{ raceReleasePoint.lng.toFixed(4) }}°E
                  </div>
                </div>
                <div class="p-3 rounded-xl bg-slate-50">
                  <div class="text-xs text-slate-500 mb-1">天气条件</div>
                  <div class="font-semibold text-slate-800">晴 · 微风</div>
                  <div class="text-xs text-slate-400 mt-0.5">
                    东南风 2-3 级 · 22°C
                  </div>
                </div>
                <div class="p-3 rounded-xl bg-slate-50">
                  <div class="text-xs text-slate-500 mb-1">参赛鸽舍</div>
                  <div class="font-semibold text-slate-800">{{ lofs.length }} 家</div>
                </div>
                <div class="p-3 rounded-xl bg-slate-50">
                  <div class="text-xs text-slate-500 mb-1">司放羽数</div>
                  <div class="font-semibold text-slate-800">{{ stats.total }} 羽</div>
                </div>
              </div>

              <div class="border-t border-slate-100 pt-4">
                <div class="text-xs font-medium text-slate-500 mb-2">参与鸽舍</div>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="loft in lofs"
                    :key="loft.id"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border"
                    :style="{
                      backgroundColor: loft.color + '15',
                      borderColor: loft.color + '40',
                      color: loft.color,
                    }"
                  >
                    <span
                      class="w-2 h-2 rounded-full"
                      :style="{ backgroundColor: loft.color }"
                    />
                    {{ loft.name }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="border-t border-slate-200/60 bg-white/50 backdrop-blur mt-12">
      <div class="container mx-auto px-4 lg:px-6 py-6">
        <div class="flex flex-col md:flex-row items-center justify-between gap-3">
          <p class="text-sm text-slate-500">
            © 2024 中国信鸽协会竞翔管理系统 · 赛鸽竞翔成绩实时展示平台
          </p>
          <div class="flex items-center gap-4 text-xs text-slate-400">
            <span>数据更新频率: 1 秒</span>
            <span>·</span>
            <span>系统版本 v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
