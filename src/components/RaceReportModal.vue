<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue'
import {
  X,
  Trophy,
  Medal,
  Award,
  Download,
  Printer,
  MapPin,
  Cloud,
  Calendar,
  Target,
  CheckCircle,
  Percent,
  Building2,
  Zap,
  FileText,
} from 'lucide-vue-next'
import type { RaceReportData } from '@/types/pigeon'
import { formatTime, formatDuration } from '@/lib/pigeonUtils'
import ArrivalTimeHistogram from '@/components/charts/ArrivalTimeHistogram.vue'

const props = defineProps<{
  visible: boolean
  reportData: RaceReportData | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const reportContentRef = ref<HTMLDivElement | null>(null)
const isExporting = ref(false)

function handleClose() {
  emit('close')
}

function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return {
        icon: Trophy,
        bgClass: 'bg-gradient-to-br from-amber-400 to-yellow-500',
        borderClass: 'border-amber-200',
        bgLight: 'bg-gradient-to-r from-amber-50 to-yellow-50',
      }
    case 2:
      return {
        icon: Medal,
        bgClass: 'bg-gradient-to-br from-slate-300 to-slate-400',
        borderClass: 'border-slate-200',
        bgLight: 'bg-gradient-to-r from-slate-50 to-gray-50',
      }
    case 3:
      return {
        icon: Award,
        bgClass: 'bg-gradient-to-br from-orange-400 to-amber-600',
        borderClass: 'border-orange-200',
        bgLight: 'bg-gradient-to-r from-orange-50 to-amber-50',
      }
    default:
      return {
        icon: null,
        bgClass: 'bg-slate-200',
        borderClass: 'border-slate-200',
        bgLight: 'bg-white',
      }
  }
}

async function handlePrint() {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const reportContent = reportContentRef.value
  if (!reportContent) return

  const printContent = reportContent.innerHTML
  const styles = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules || [])
          .map((rule) => rule.cssText)
          .join('\n')
      } catch {
        return ''
      }
    })
    .join('\n')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>比赛总结报告</title>
        <style>
          ${styles}
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none !important; }
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #fff;
            color: #334155;
          }
          .report-container {
            max-width: 1000px;
            margin: 0 auto;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          ${printContent}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }, 500);
          };
        <\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

async function handleExportPDF() {
  isExporting.value = true
  try {
    await handlePrint()
  } finally {
    isExporting.value = false
  }
}

async function handleExportCSV() {
  if (!props.reportData) return

  const rows: string[][] = []
  const data = props.reportData

  rows.push(['比赛总结报告', ''])
  rows.push(['生成时间', data.generateTime.toLocaleString('zh-CN')])
  rows.push([''])

  rows.push(['=== 比赛基本信息 ===', ''])
  rows.push(['比赛名称', data.basicInfo.name])
  rows.push(['比赛距离', `${data.basicInfo.distance} 公里`])
  rows.push(['司放地', data.basicInfo.releaseLocation])
  rows.push(['天气条件', data.basicInfo.weather])
  rows.push(['天气详情', data.basicInfo.weatherDetail])
  rows.push(['司放时间', data.basicInfo.releaseTime.toLocaleString('zh-CN')])
  if (data.basicInfo.endTime) {
    rows.push(['结束时间', data.basicInfo.endTime.toLocaleString('zh-CN')])
  }
  rows.push([''])

  rows.push(['=== 比赛统计 ===', ''])
  rows.push(['参赛羽数', data.totalPigeons.toString()])
  rows.push(['归巢羽数', data.arrivedPigeons.toString()])
  rows.push(['归巢率', `${data.returnRate}%`])
  rows.push([''])

  rows.push(['=== 前三名成绩 ===', ''])
  rows.push(['排名', '脚环号', '鸽名', '鸽舍', '分速(m/分)', '空距(km)', '归巢时间', '飞行时间'])
  data.topThree.forEach((record) => {
    rows.push([
      `第${record.rank}名`,
      record.ringNumber,
      record.pigeonName,
      record.loftName,
      record.speed?.toFixed(2) || '',
      (record.distance / 1000).toFixed(2),
      record.arrivalTime ? formatTime(record.arrivalTime) : '',
      record.arrivalTime ? formatDuration(record.releaseTime, record.arrivalTime) : '',
    ])
  })
  rows.push([''])

  rows.push(['=== 鸽舍归巢率排行 ===', ''])
  rows.push(['排名', '鸽舍名称', '参赛羽数', '归巢羽数', '归巢率(%)', '平均分速(m/分)', '最高分速(m/分)'])
  data.loftRankings.forEach((loft, index) => {
    rows.push([
      (index + 1).toString(),
      loft.loftName,
      loft.totalPigeons.toString(),
      loft.arrivedPigeons.toString(),
      loft.returnRate.toFixed(2),
      loft.avgSpeed.toFixed(2),
      loft.bestSpeed.toFixed(2),
    ])
  })

  const csvContent = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `比赛报告_${data.generateTime.toISOString().slice(0, 10)}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible && reportData"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        @click.self="handleClose"
      >
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <div class="flex-shrink-0 px-8 py-5 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-purple-600">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <FileText class="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 class="text-xl font-bold text-white">比赛总结报告</h2>
                  <p class="text-indigo-200 text-sm">
                    生成时间：{{ reportData.generateTime.toLocaleString('zh-CN') }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="no-print flex items-center gap-2">
                  <button
                    @click="handleExportCSV"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <Download class="w-4 h-4" />
                    导出CSV
                  </button>
                  <button
                    @click="handleExportPDF"
                    :disabled="isExporting"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <Printer class="w-4 h-4" />
                    {{ isExporting ? '导出中...' : '打印/导出PDF' }}
                  </button>
                </div>
                <button
                  @click="handleClose"
                  class="no-print p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-8">
            <div ref="reportContentRef" class="space-y-8">
              <div class="text-center pb-6 border-b-2 border-slate-200">
                <h1 class="text-3xl font-bold text-slate-800 mb-2">
                  {{ reportData.basicInfo.name }}
                </h1>
                <p class="text-slate-500">
                  比赛距离：{{ reportData.basicInfo.distance }} 公里 · 司放地：{{ reportData.basicInfo.releaseLocation }}
                </p>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200">
                  <div class="flex items-center gap-2 mb-2">
                    <Target class="w-5 h-5 text-sky-600" />
                    <span class="text-sm text-sky-600 font-medium">参赛羽数</span>
                  </div>
                  <div class="text-3xl font-bold text-slate-800 font-mono">
                    {{ reportData.totalPigeons }}
                  </div>
                </div>
                <div class="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
                  <div class="flex items-center gap-2 mb-2">
                    <CheckCircle class="w-5 h-5 text-emerald-600" />
                    <span class="text-sm text-emerald-600 font-medium">归巢羽数</span>
                  </div>
                  <div class="text-3xl font-bold text-slate-800 font-mono">
                    {{ reportData.arrivedPigeons }}
                  </div>
                </div>
                <div class="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
                  <div class="flex items-center gap-2 mb-2">
                    <Percent class="w-5 h-5 text-indigo-600" />
                    <span class="text-sm text-indigo-600 font-medium">归巢率</span>
                  </div>
                  <div class="text-3xl font-bold text-slate-800 font-mono">
                    {{ reportData.returnRate }}%
                  </div>
                </div>
                <div class="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                  <div class="flex items-center gap-2 mb-2">
                    <Trophy class="w-5 h-5 text-amber-600" />
                    <span class="text-sm text-amber-600 font-medium">最高分速</span>
                  </div>
                  <div class="text-3xl font-bold text-slate-800 font-mono">
                    {{ reportData.topThree[0]?.speed?.toFixed(1) || 0 }}
                    <span class="text-sm font-normal text-slate-500">m/分</span>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                  <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <MapPin class="w-5 h-5 text-indigo-600" />
                    比赛基本信息
                  </h3>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center py-2 border-b border-slate-200">
                      <span class="text-slate-500">司放地</span>
                      <span class="font-semibold text-slate-800">{{ reportData.basicInfo.releaseLocation }}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-slate-200">
                      <span class="text-slate-500">天气条件</span>
                      <span class="font-semibold text-slate-800">{{ reportData.basicInfo.weather }}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-slate-200">
                      <span class="text-slate-500">天气详情</span>
                      <span class="font-semibold text-slate-800">{{ reportData.basicInfo.weatherDetail }}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-slate-200">
                      <span class="text-slate-500">司放时间</span>
                      <span class="font-semibold text-slate-800">{{ reportData.basicInfo.releaseTime.toLocaleString('zh-CN') }}</span>
                    </div>
                    <div v-if="reportData.basicInfo.endTime" class="flex justify-between items-center py-2">
                      <span class="text-slate-500">结束时间</span>
                      <span class="font-semibold text-slate-800">{{ reportData.basicInfo.endTime.toLocaleString('zh-CN') }}</span>
                    </div>
                  </div>
                </div>

                <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                  <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Calendar class="w-5 h-5 text-indigo-600" />
                    比赛统计概览
                  </h3>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center py-2 border-b border-slate-200">
                      <span class="text-slate-500">参赛鸽舍数</span>
                      <span class="font-semibold text-slate-800">{{ reportData.loftRankings.length }} 家</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-slate-200">
                      <span class="text-slate-500">未归巢羽数</span>
                      <span class="font-semibold text-slate-800">{{ reportData.totalPigeons - reportData.arrivedPigeons }} 羽</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-slate-200">
                      <span class="text-slate-500">平均分速</span>
                      <span class="font-semibold text-slate-800 font-mono">
                        {{ reportData.topThree.length > 0
                          ? (reportData.topThree.reduce((sum, r) => sum + (r.speed || 0), 0) / reportData.topThree.length).toFixed(2)
                          : 0 }} m/分
                      </span>
                    </div>
                    <div class="flex justify-between items-center py-2">
                      <span class="text-slate-500">报告生成时间</span>
                      <span class="font-semibold text-slate-800">{{ reportData.generateTime.toLocaleString('zh-CN') }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Trophy class="w-5 h-5 text-amber-500" />
                  前三名成绩
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    v-for="record in reportData.topThree"
                    :key="record.rank"
                    :class="[
                      'p-6 rounded-2xl border-2 transition-all',
                      getRankStyle(record.rank!).borderClass,
                      getRankStyle(record.rank!).bgLight,
                    ]"
                  >
                    <div class="flex items-center gap-4 mb-4">
                      <div
                        :class="[
                          'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
                          getRankStyle(record.rank!).bgClass,
                        ]"
                      >
                        <component
                          :is="getRankStyle(record.rank!).icon"
                          class="w-7 h-7 text-white"
                        />
                      </div>
                      <div>
                        <div class="text-2xl font-bold text-slate-800">第 {{ record.rank }} 名</div>
                        <div class="text-sm text-slate-500 font-mono">{{ record.ringNumber }}</div>
                      </div>
                    </div>
                    <div class="space-y-2">
                      <div class="flex justify-between">
                        <span class="text-slate-500">鸽名</span>
                        <span class="font-semibold text-slate-800">{{ record.pigeonName }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500">鸽舍</span>
                        <span class="font-semibold text-slate-800">{{ record.loftName }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500">分速</span>
                        <span class="font-bold text-indigo-600 font-mono">{{ record.speed?.toFixed(2) }} m/分</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500">空距</span>
                        <span class="font-semibold text-slate-800">{{ (record.distance / 1000).toFixed(2) }} km</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500">飞行时间</span>
                        <span class="font-semibold text-emerald-600 font-mono">
                          {{ record.arrivalTime ? formatDuration(record.releaseTime, record.arrivalTime) : '-' }}
                        </span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500">归巢时间</span>
                        <span class="font-semibold text-slate-800">
                          {{ record.arrivalTime ? formatTime(record.arrivalTime) : '-' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Building2 class="w-5 h-5 text-indigo-600" />
                  鸽舍归巢率排行
                </h3>
                <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <table class="w-full">
                    <thead class="bg-gradient-to-r from-slate-50 to-slate-100">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">排名</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">鸽舍</th>
                        <th class="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">参赛</th>
                        <th class="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">归巢</th>
                        <th class="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">归巢率</th>
                        <th class="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">平均分速</th>
                        <th class="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">最高分速</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      <tr
                        v-for="(loft, index) in reportData.loftRankings"
                        :key="loft.loftId"
                        class="hover:bg-slate-50 transition-colors"
                      >
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex items-center gap-2">
                            <div
                              class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                              :class="[
                                index === 0 ? 'bg-amber-100 text-amber-700' :
                                index === 1 ? 'bg-slate-200 text-slate-700' :
                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                'bg-slate-100 text-slate-600',
                              ]"
                            >
                              {{ index + 1 }}
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex items-center gap-3">
                            <span
                              class="w-3 h-3 rounded-full"
                              :style="{ backgroundColor: loft.loftColor }"
                            />
                            <span class="font-semibold text-slate-800">{{ loft.loftName }}</span>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-center text-slate-700">{{ loft.totalPigeons }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-center text-emerald-600 font-medium">{{ loft.arrivedPigeons }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-center">
                          <div class="flex items-center justify-center gap-2">
                            <div class="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                :style="{ width: `${loft.returnRate}%` }"
                              />
                            </div>
                            <span class="text-sm font-bold text-indigo-600 min-w-[50px]">{{ loft.returnRate }}%</span>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right font-mono text-slate-700">{{ loft.avgSpeed.toFixed(2) }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-amber-600">{{ loft.bestSpeed.toFixed(2) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <ArrivalTimeHistogram
                  :time-distribution="reportData.timeDistribution"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95) translateY(20px);
}
</style>
