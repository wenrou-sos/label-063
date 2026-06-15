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
import { BarChart3 } from 'lucide-vue-next'
import type { TimeDistribution } from '@/types/pigeon'

echarts.use([
  BarChart,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
])

const props = defineProps<{
  timeDistribution: TimeDistribution
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const chartOption = computed(() => {
  const { bins, counts, maxCount } = props.timeDistribution

  return {
    grid: {
      left: 56,
      right: 24,
      top: 40,
      bottom: 56,
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
        return `
          <div style="font-weight: 600; margin-bottom: 4px;">${data.name}</div>
          <div style="display: flex; justify-content: space-between; gap: 16px; font-size: 12px;">
            <span style="color: #64748b;">归巢羽数</span>
            <span style="font-weight: 600; color: #6366f1;">${data.value} 羽</span>
          </div>
        `
      },
    },
    xAxis: {
      type: 'category',
      data: bins.map((b) => b.label),
      name: '归巢时间段',
      nameLocation: 'middle',
      nameGap: 32,
      nameTextStyle: {
        color: '#94a3b8',
        fontSize: 11,
      },
      axisLabel: {
        color: '#64748b',
        fontSize: 10,
        rotate: 30,
      },
      axisLine: {
        lineStyle: {
          color: '#e2e8f0',
        },
      },
    },
    yAxis: {
      type: 'value',
      name: '归巢羽数',
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: {
        color: '#94a3b8',
        fontSize: 11,
      },
      min: 0,
      max: maxCount > 0 ? maxCount + 1 : 5,
      interval: 1,
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        formatter: '{value} 羽',
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
    series: [
      {
        name: '归巢羽数',
        type: 'bar',
        data: counts,
        barWidth: '60%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#6366f1' },
            { offset: 1, color: '#8b5cf6' },
          ]),
          borderRadius: [6, 6, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#4f46e5' },
              { offset: 1, color: '#7c3aed' },
            ]),
          },
        },
        label: {
          show: true,
          position: 'top',
          color: '#6366f1',
          fontSize: 11,
          fontWeight: 600,
          formatter: '{c}',
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

watch(
  () => props.timeDistribution,
  () => {
    chartInstance?.setOption(chartOption.value)
  },
  { deep: true }
)

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
            <BarChart3 class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="font-bold text-slate-800">归巢时间分布</h3>
            <p class="text-xs text-slate-500">各时间段归巢羽数统计</p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-lg font-bold text-indigo-600 font-mono">
            {{ timeDistribution.counts.reduce((a, b) => a + b, 0) }}
          </div>
          <div class="text-xs text-slate-500">有效记录</div>
        </div>
      </div>
    </div>
    <div ref="chartRef" class="h-72 w-full" />
  </div>
</template>
