<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Building2 } from 'lucide-vue-next'
import type { Loft } from '@/types/pigeon'

echarts.use([
  BarChart,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
])

interface LoftStat {
  loft: Loft
  avgSpeed: number
  bestSpeed: number
  count: number
  arrivedCount: number
}

const props = defineProps<{
  loftStats: LoftStat[]
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const sortedStats = computed(() => {
  return [...props.loftStats].sort((a, b) => b.avgSpeed - a.avgSpeed)
})

const chartOption = computed(() => {
  const names = sortedStats.value.map((s) => s.loft.name)
  const avgSpeeds = sortedStats.value.map((s) => Number(s.avgSpeed.toFixed(1)))
  const bestSpeeds = sortedStats.value.map((s) => Number(s.bestSpeed.toFixed(1)))
  const colors = sortedStats.value.map((s) => s.loft.color)

  return {
    grid: {
      left: 56,
      right: 24,
      top: 40,
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
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const avg = params.find((p: any) => p.seriesName === '平均分速')
        const best = params.find((p: any) => p.seriesName === '最高分速')
        const stat = sortedStats.value[params[0].dataIndex]
        return `
          <div style="font-weight: 600; margin-bottom: 6px;">${stat.loft.name}</div>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: ${stat.loft.color};"></span>
            <span>平均分速：</span>
            <span style="font-weight: 600;">${avg.value} m/分</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: #f59e0b;"></span>
            <span>最高分速：</span>
            <span style="font-weight: 600;">${best.value} m/分</span>
          </div>
          <div style="margin-top: 4px; color: #94a3b8; font-size: 11px;">
            已归巢 ${stat.arrivedCount}/${stat.count} 羽
          </div>
        `
      },
    },
    legend: {
      data: ['平均分速', '最高分速'],
      right: 0,
      top: 0,
      itemWidth: 12,
      itemHeight: 8,
      itemGap: 16,
      textStyle: {
        color: '#64748b',
        fontSize: 11,
      },
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        rotate: 0,
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
      name: 'm/分',
      nameTextStyle: {
        color: '#94a3b8',
        fontSize: 10,
        padding: [0, 0, 0, 32],
      },
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
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
        name: '平均分速',
        type: 'bar',
        data: avgSpeeds.map((val, idx) => ({
          value: val,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: colors[idx] },
              { offset: 1, color: colors[idx] + '80' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barWidth: 18,
        barGap: '40%',
      },
      {
        name: '最高分速',
        type: 'bar',
        data: bestSpeeds.map((val) => ({
          value: val,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#fbbf24' },
              { offset: 1, color: '#f59e0b80' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barWidth: 18,
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
    <div class="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Building2 class="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 class="font-bold text-slate-800">鸽舍成绩对比</h3>
          <p class="text-xs text-slate-500">各鸽舍平均分速与最高分速</p>
        </div>
      </div>
    </div>
    <div ref="chartRef" class="h-72 w-full" />
  </div>
</template>
