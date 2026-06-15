<script setup lang="ts">
import { Building2, Users, Zap, TrendingUp } from 'lucide-vue-next'
import type { Loft, RaceRecord } from '@/types/pigeon'
import { cn } from '@/lib/utils'

interface LoftGroupData {
  loft: Loft
  records: RaceRecord[]
  avgSpeed: number
}

defineProps<{
  loftGroups: LoftGroupData[]
}>()

function getArrivedCount(records: RaceRecord[]) {
  return records.filter((r) => r.arrivalTime).length
}

function getBestSpeed(records: RaceRecord[]) {
  const arrived = records.filter((r) => r.speed)
  if (arrived.length === 0) return 0
  return Math.max(...arrived.map((r) => r.speed || 0))
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
      <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
        <Building2 class="w-5 h-5 text-emerald-600" />
        鸽舍团体排名
      </h2>
      <p class="text-sm text-slate-500 mt-0.5">按平均分速排序</p>
    </div>

    <div class="p-4 space-y-3">
      <div
        v-for="(group, index) in loftGroups"
        :key="group.loft.id"
        class="rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all"
      >
        <div
          class="px-4 py-3 flex items-center justify-between"
          :style="{
            background: `linear-gradient(135deg, ${group.loft.color}15 0%, transparent 100%)`,
          }"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm"
              :style="{ backgroundColor: group.loft.color }"
            >
              {{ index + 1 }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-800">{{ group.loft.name }}</span>
                <span class="text-xs text-slate-400">· 鸽主 {{ group.loft.owner }}</span>
              </div>
              <div class="flex items-center gap-4 mt-1 text-xs text-slate-500">
                <span class="flex items-center gap-1">
                  <Users class="w-3.5 h-3.5" />
                  参赛 {{ group.records.length }} 羽
                </span>
                <span class="flex items-center gap-1">
                  <span
                    class="w-2 h-2 rounded-full"
                    :class="getArrivedCount(group.records) > 0 ? 'bg-emerald-500' : 'bg-slate-300'"
                  />
                  归巢 {{ getArrivedCount(group.records) }} 羽
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <div class="text-center">
              <div class="flex items-center gap-1 text-slate-400 text-xs mb-0.5">
                <Zap class="w-3 h-3" />
                最高分速
              </div>
              <div class="text-lg font-bold font-mono text-slate-700">
                {{ getBestSpeed(group.records).toFixed(1) }}
                <span class="text-xs font-normal text-slate-400">m/分</span>
              </div>
            </div>
            <div class="text-center">
              <div class="flex items-center gap-1 text-slate-400 text-xs mb-0.5">
                <TrendingUp class="w-3 h-3" />
                平均分速
              </div>
              <div
                class="text-xl font-bold font-mono"
                :style="{ color: group.loft.color }"
              >
                {{ group.avgSpeed.toFixed(1) }}
                <span class="text-xs font-normal text-slate-400">m/分</span>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-slate-100 bg-slate-50/50 px-4 py-2">
          <div class="flex flex-wrap gap-2">
            <div
              v-for="record in group.records"
              :key="record.pigeonId"
              :class="cn(
                'px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5',
                record.arrivalTime
                  ? 'bg-white border border-slate-200'
                  : 'bg-slate-100 border border-slate-200/50'
              )"
            >
              <span
                v-if="record.loftRank"
                class="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                :style="{ backgroundColor: group.loft.color }"
              >
                {{ record.loftRank }}
              </span>
              <span class="font-medium text-slate-700">{{ record.pigeonName }}</span>
              <span v-if="record.speed" class="font-mono text-indigo-600 font-semibold">
                {{ record.speed.toFixed(0) }}
              </span>
              <span v-else class="text-slate-400 italic">飞行中...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
