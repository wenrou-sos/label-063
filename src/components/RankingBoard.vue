<script setup lang="ts">
import { Trophy, Medal, Award, Clock, Zap } from 'lucide-vue-next'
import type { RaceRecord } from '@/types/pigeon'
import { cn } from '@/lib/utils'
import { formatTime, formatDuration } from '@/lib/pigeonUtils'

defineProps<{
  rankedRecords: RaceRecord[]
}>()

function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return {
        icon: Trophy,
        bgClass: 'bg-gradient-to-br from-amber-400 to-yellow-500',
        ringClass: 'ring-amber-300',
        rowClass: 'bg-gradient-to-r from-amber-50/80 to-transparent',
      }
    case 2:
      return {
        icon: Medal,
        bgClass: 'bg-gradient-to-br from-slate-300 to-slate-400',
        ringClass: 'ring-slate-300',
        rowClass: 'bg-gradient-to-r from-slate-50/80 to-transparent',
      }
    case 3:
      return {
        icon: Award,
        bgClass: 'bg-gradient-to-br from-orange-400 to-amber-600',
        ringClass: 'ring-orange-300',
        rowClass: 'bg-gradient-to-r from-orange-50/80 to-transparent',
      }
    default:
      return {
        icon: null,
        bgClass: 'bg-slate-200',
        ringClass: 'ring-slate-200',
        rowClass: '',
      }
  }
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Trophy class="w-5 h-5 text-amber-600" />
            实时排名榜
          </h2>
          <p class="text-sm text-slate-500 mt-0.5">按分速从高到低排序</p>
        </div>
        <div class="flex gap-4 text-sm">
          <div class="flex items-center gap-1.5 text-slate-500">
            <Zap class="w-4 h-4 text-indigo-500" />
            <span>分速 (m/分)</span>
          </div>
          <div class="flex items-center gap-1.5 text-slate-500">
            <Clock class="w-4 h-4 text-emerald-500" />
            <span>用时</span>
          </div>
        </div>
      </div>
    </div>

    <div class="max-h-[520px] overflow-y-auto">
      <div v-if="rankedRecords.length === 0" class="p-12 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
          <Trophy class="w-8 h-8 text-slate-300" />
        </div>
        <p class="text-slate-500">暂无归巢记录</p>
        <p class="text-sm text-slate-400 mt-1">等待赛鸽归巢...</p>
      </div>

      <div v-else class="divide-y divide-slate-100">
        <div
          v-for="record in rankedRecords"
          :key="record.pigeonId"
          :class="cn('px-4 py-3 flex items-center gap-4 transition-all', getRankStyle(record.rank!).rowClass)"
        >
          <div class="flex-shrink-0">
            <div
              v-if="getRankStyle(record.rank!).icon"
              :class="cn(
                'w-11 h-11 rounded-xl flex items-center justify-center shadow-lg ring-4',
                getRankStyle(record.rank!).bgClass,
                getRankStyle(record.rank!).ringClass
              )"
            >
              <component
                :is="getRankStyle(record.rank!).icon"
                class="w-5 h-5 text-white"
              />
            </div>
            <div
              v-else
              class="w-11 h-11 rounded-xl flex items-center justify-center bg-slate-100"
            >
              <span class="text-base font-bold text-slate-500">{{ record.rank }}</span>
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3">
              <span class="font-semibold text-slate-800">{{ record.pigeonName }}</span>
              <span class="text-xs font-mono text-slate-400">{{ record.ringNumber }}</span>
            </div>
            <div class="flex items-center gap-3 mt-1 text-sm text-slate-500">
              <span>{{ record.loftName }}</span>
              <span class="text-slate-300">·</span>
              <span>空距 {{ (record.distance / 1000).toFixed(2) }} km</span>
              <span class="text-slate-300">·</span>
              <span>归巢 {{ formatTime(record.arrivalTime!) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <div class="text-right">
              <div class="text-2xl font-bold font-mono text-indigo-600">
                {{ record.speed?.toFixed(2) }}
              </div>
              <div class="text-xs text-slate-400">m/分</div>
            </div>
            <div class="text-right min-w-[80px]">
              <div class="text-sm font-semibold font-mono text-emerald-600">
                {{ formatDuration(record.releaseTime, record.arrivalTime!) }}
              </div>
              <div class="text-xs text-slate-400">飞行时间</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
