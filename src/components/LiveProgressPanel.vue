<script setup lang="ts">
import { computed } from 'vue'
import { Plane, CheckCircle, AlertTriangle } from 'lucide-vue-next'
import type { LiveProgress } from '@/types/pigeon'
import { cn } from '@/lib/utils'

const props = defineProps<{
  liveProgress: LiveProgress[]
  currentTime: Date
}>()

const sortedProgress = computed(() => {
  return [...props.liveProgress].sort((a, b) => {
    if (a.status !== b.status) {
      const order = { '已归巢': 0, '飞行中': 1, '异常': 2 }
      return order[a.status] - order[b.status]
    }
    return b.progress - a.progress
  })
})

function getProgressWidth(progress: number): string {
  return `${Math.max(2, progress * 100)}%`
}

function getStatusBadge(status: string) {
  switch (status) {
    case '已归巢':
      return {
        icon: CheckCircle,
        class: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      }
    case '异常':
      return {
        icon: AlertTriangle,
        class: 'bg-red-100 text-red-700 border-red-200',
      }
    default:
      return {
        icon: Plane,
        class: 'bg-blue-100 text-blue-700 border-blue-200',
      }
  }
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Plane class="w-5 h-5 text-indigo-600" />
            实时归巢进度
          </h2>
          <p class="text-sm text-slate-500 mt-0.5">参赛鸽子实时飞行状态追踪</p>
        </div>
        <div class="text-right">
          <div class="text-xs text-slate-500">当前时间</div>
          <div class="text-lg font-mono font-semibold text-slate-700">
            {{ currentTime.toLocaleTimeString('zh-CN') }}
          </div>
        </div>
      </div>
    </div>

    <div class="max-h-[520px] overflow-y-auto">
      <table class="w-full">
        <thead class="bg-slate-50 sticky top-0">
          <tr class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            <th class="px-4 py-3 w-12">#</th>
            <th class="px-4 py-3">赛鸽</th>
            <th class="px-4 py-3">鸽舍</th>
            <th class="px-4 py-3">状态</th>
            <th class="px-4 py-3 w-64">进度</th>
            <th class="px-4 py-3 text-right">预估分速</th>
            <th class="px-4 py-3 text-right">剩余距离</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="(item, index) in sortedProgress"
            :key="item.pigeonId"
            :class="cn(
              'hover:bg-slate-50 transition-colors',
              item.status === '已归巢' && 'bg-emerald-50/50'
            )"
          >
            <td class="px-4 py-3">
              <span
                :class="cn(
                  'w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-semibold',
                  index < 3
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600'
                )"
              >
                {{ index + 1 }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div>
                <div class="font-medium text-slate-800">{{ item.pigeonName }}</div>
                <div class="text-xs text-slate-500 font-mono">{{ item.ringNumber }}</div>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span
                  class="w-3 h-3 rounded-full shadow-sm"
                  :style="{ backgroundColor: item.loftColor }"
                />
                <span class="text-sm text-slate-700">{{ item.loftName }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <span
                :class="cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
                  getStatusBadge(item.status).class
                )"
              >
                <component :is="getStatusBadge(item.status).icon" class="w-3.5 h-3.5" />
                {{ item.status }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-700 ease-out"
                    :style="{
                      width: getProgressWidth(item.progress),
                      backgroundColor: item.status === '已归巢' ? '#10B981' : item.loftColor,
                    }"
                  />
                </div>
                <span
                  class="text-xs font-semibold font-mono w-14 text-right"
                  :class="item.status === '已归巢' ? 'text-emerald-600' : 'text-slate-600'"
                >
                  {{ (item.progress * 100).toFixed(1) }}%
                </span>
              </div>
            </td>
            <td class="px-4 py-3 text-right">
              <span
                class="font-mono font-semibold"
                :class="item.status === '已归巢' ? 'text-emerald-600' : 'text-indigo-600'"
              >
                {{ item.estimatedSpeed.toFixed(1) }}
              </span>
              <span class="text-xs text-slate-400 ml-1">m/分</span>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="font-mono text-slate-600">
                {{ item.status === '已归巢' ? '0.0' : (item.distanceRemaining / 1000).toFixed(2) }}
              </span>
              <span class="text-xs text-slate-400 ml-1">km</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
