<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  TooltipComponent,
  GridComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { TrendingUp } from 'lucide-vue-next'
import type { RaceRecord } from '@/types/pigeon'
import { formatTime } from '@/lib/pigeonUtils'

echarts.use([
  LineChart,
  TooltipComponent,
  GridComponent,
  CanvasRenderer,
])

const props = defineProps<{
  raceRecords: RaceRecord[]
  releaseTime: Date
  currentTime: Date
  totalPigeons: number
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const chartData = computed(() => {
  const arrivedRecords = props.raceRecords
    .filter((r) => r.arrivalTime)
    .sort((a, b) => a.arrivalTime!.getTime() - b.arrivalTime!.getTime())

  const timePoints: string[] = []
  const cumulativeCounts: number[] = []

  const startOfHour = new Date(props.releaseTime)
  startOfHour.setMinutes(0, 0, 0)
  const endOfHour = new Date(props.currentTime)
  endOfHour.setMinutes(0, 0, 0)
  endOfHour.setHours(endOfHour.getHours() + 1)

  let currentPoint = new Date(startOfHour)
  let count = 0
  let recordIndex = 0

  while (currentPoint <= endOfHour) {
    while (
      recordIndex < arrivedRecords.length &&
      arrivedRecords[recordIndex].arrivalTime! <= currentPoint
    ) {
      count++
      recordIndex++
    }

    timePoints.push(formatTime(currentPoint))
    cumulativeCounts.push(count)

    currentPoint = new Date(currentPoint.getTime() + 15 * 60 * 1000)
  }

  const lastTime = new Date(props.currentTime)
  if (
    timePoints.length === 0 ||
    timePoints[timePoints.length - 1] !== formatTime(lastTime)
  ) {
    timePoints.push(formatTime(lastTime))
    cumulativeCounts.push(arrivedRecords.length)
  }

  return { timePoints, cumulativeCounts, arrivedCount: arrivedRecords.length }
})

const arrivedCount = computed(() => chartData.value.arrivedCount)

const chartOption = computed(() => {
  const { timePoints, cumulativeCounts } = chartData.value

  return {
    grid: {
      left: 48,
      right: 24,
      top: 24,
      bottom: 32,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: {
        color: '#334155',
        fontSize: 12,
      },
      formatter: (params: any) => {
        const data = params[0]
        const pct = props.totalPigeons > 0
          ? ((data.value / props.totalPigeons) * 100).toFixed(1)
          : '0'
        return `
          <div style="font-weight: 600; margin-bottom: 4px;">${data.axisValue}</div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #6366f1;"></span>
            <span>累计归巢：</span>
            <span style="font-weight: 600; color: #6366f1;">${data.value} 羽</span>
          </div>
          <div style="margin-top: 2px; color: #94a3b8; font-size: 11px;">
            完成率：${pct}%
          </div>
        `
      },
    },
    xAxis: {
      type: 'category',
      data: timePoints,
      boundaryGap: false,
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        interval: Math.floor(timePoints.length / 6),
      },
      axisLine: {
        lineStyle: {
          color: '#e2e8f0',
        },
      },
      axisTick: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: Math.max(props.totalPigeons, 1),
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        formatter: '{value} 羽',
      },
      splitLine: {
        lineStyle: {
          color: '#f1f5f9',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: '累计归巢',
        type: 'line',
        data: cumulativeCounts,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#818cf8' },
            { offset: 1, color: '#4f46e5' },
          ]),
        },
        itemStyle: {
          color: '#6366f1',
          borderColor: '#fff',
          borderWidth: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(99, 102, 241, 0.25)' },
            { offset: 1, color: 'rgba(99, 102, 241, 0.02)' },
          ]),
        },
      },
    ],
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
    <div class="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <TrendingUp class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="font-bold text-slate-800">归巢进度趋势</h3>
            <p class="text-xs text-slate-500">累计归巢数量随时间变化</p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-indigo-600 font-mono">
            {{ arrivedCount }}
          </div>
          <div class="text-xs text-slate-500">已归巢 / 共 {{ totalPigeons }} 羽</div>
        </div>
      </div>
    </div>
    <div ref="chartRef" class="h-72 w-full" />
  </div>
</template>
