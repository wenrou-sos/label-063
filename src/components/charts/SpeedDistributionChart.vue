<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts/core'
import { ScatterChart } from 'echarts/charts'
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Activity } from 'lucide-vue-next'
import type { RaceRecord, Loft } from '@/types/pigeon'
import { formatDuration } from '@/lib/pigeonUtils'

echarts.use([
  ScatterChart,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
])

const props = defineProps<{
  raceRecords: RaceRecord[]
  lofs: Loft[]
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const scatterData = computed(() => {
  const arrivedRecords = props.raceRecords.filter(
    (r) => r.arrivalTime && r.speed
  )

  const groups: Map<string, { loft: Loft; data: any[] }> = new Map()

  props.lofs.forEach((loft) => {
    groups.set(loft.id, { loft, data: [] })
  })

  arrivedRecords.forEach((record) => {
    const durationMinutes =
      (record.arrivalTime!.getTime() - record.releaseTime.getTime()) / (1000 * 60)

    const group = groups.get(record.loftId)
    if (group) {
      group.data.push([
        Number(durationMinutes.toFixed(1)),
        Number(record.speed!.toFixed(1)),
        record.pigeonName,
        record.ringNumber,
      ])
    }
  })

  return Array.from(groups.values()).filter((g) => g.data.length > 0)
})

const chartOption = computed(() => {
  const series = scatterData.value.map((group) => ({
    name: group.loft.name,
    type: 'scatter' as const,
    data: group.data,
    symbolSize: 12,
    itemStyle: {
      color: group.loft.color,
      borderColor: '#fff',
      borderWidth: 2,
      shadowBlur: 6,
      shadowColor: group.loft.color + '50',
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 12,
        shadowColor: group.loft.color + '80',
        borderWidth: 3,
      },
    },
  }))

  const allSpeeds = scatterData.value.flatMap((g) => g.data.map((d) => d[1]))
  const allDurations = scatterData.value.flatMap((g) => g.data.map((d) => d[0]))

  const maxSpeed = allSpeeds.length > 0 ? Math.ceil(Math.max(...allSpeeds) / 100) * 100 + 100 : 2000
  const minSpeed = allSpeeds.length > 0 ? Math.floor(Math.min(...allSpeeds) / 100) * 100 - 100 : 500
  const maxDuration = allDurations.length > 0 ? Math.ceil(Math.max(...allDurations) / 30) * 30 + 30 : 300

  return {
    grid: {
      left: 56,
      right: 24,
      top: 40,
      bottom: 40,
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: {
        color: '#334155',
        fontSize: 12,
      },
      formatter: (params: any) => {
        const data = params.data
        const durationStr = `${Math.floor(data[0])}分${Math.round((data[0] % 1) * 60)}秒`
        return `
          <div style="font-weight: 600; margin-bottom: 4px;">${data[2]}</div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">${data[3]}</div>
          <div style="display: flex; justify-content: space-between; gap: 16px; font-size: 12px;">
            <span style="color: #64748b;">归巢用时</span>
            <span style="font-weight: 600;">${durationStr}</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; font-size: 12px; margin-top: 2px;">
            <span style="color: #64748b;">分速</span>
            <span style="font-weight: 600; color: ${params.color};">${data[1]} m/分</span>
          </div>
        `
      },
    },
    legend: {
      data: scatterData.value.map((g) => g.loft.name),
      right: 0,
      top: 0,
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 12,
      textStyle: {
        color: '#64748b',
        fontSize: 11,
      },
    },
    xAxis: {
      type: 'value',
      name: '归巢用时（分钟）',
      nameLocation: 'middle',
      nameGap: 22,
      nameTextStyle: {
        color: '#94a3b8',
        fontSize: 11,
      },
      min: 0,
      max: maxDuration,
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
      },
      axisLine: {
        lineStyle: {
          color: '#e2e8f0',
        },
      },
      splitLine: {
        lineStyle: {
          color: '#f1f5f9',
          type: 'dashed',
        },
      },
    },
    yAxis: {
      type: 'value',
      name: '分速（m/分）',
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: {
        color: '#94a3b8',
        fontSize: 11,
      },
      min: Math.max(0, minSpeed),
      max: maxSpeed,
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
      },
      axisLine: {
        lineStyle: {
          color: '#e2e8f0',
        },
      },
      splitLine: {
        lineStyle: {
          color: '#f1f5f9',
          type: 'dashed',
        },
      },
    },
    series,
  }
})

function initChart() {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(chartOption.value)
}

function resizeChart() {
  chartInstance?.resize()
}

watch(chartOption, () => {
  chartInstance?.setOption(chartOption.value)
})

onMounted(() => {
  initChart()
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  chartInstance?.dispose()
})
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-rose-50 to-pink-50">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <Activity class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="font-bold text-slate-800">速度分布散点图</h3>
            <p class="text-xs text-slate-500">归巢用时 vs 分速</p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-lg font-bold text-rose-600 font-mono">
            {{ raceRecords.filter(r => r.arrivalTime).length }}
          </div>
          <div class="text-xs text-slate-500">有效数据点</div>
        </div>
      </div>
    </div>
    <div ref="chartRef" class="h-72 w-full" />
  </div>
</template>
