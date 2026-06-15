<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  History,
  Clock,
  AlertCircle,
} from 'lucide-vue-next'
import type { ScanResult, Pigeon } from '@/types/pigeon'
import { cn } from '@/lib/utils'
import { formatTime, RING_NUMBER_PATTERN, validateRingNumber, isLikelyScannerInput } from '@/lib/pigeonUtils'

const props = defineProps<{
  scanHistory: ScanResult[]
  inFlightPigeons: Pigeon[]
}>()

const emit = defineEmits<{
  (e: 'scan', ringNumber: string): void
}>()

const inputValue = ref('')
const lastScanResult = ref<ScanResult | null>(null)
const isShaking = ref(false)
const validationError = ref('')

let scannerBuffer = ''
let scannerTimer: number | null = null

const quickScanList = computed(() => {
  return props.inFlightPigeons.slice(0, 8)
})

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  const newValue = target.value
  inputValue.value = newValue
  validationError.value = ''

  handleScannerInput(newValue)
}

function handleScannerInput(value: string) {
  const addedChars = value.slice(scannerBuffer.length)
  scannerBuffer = value

  if (scannerTimer) {
    clearTimeout(scannerTimer)
  }

  if (addedChars.length > 0 && isLikelyScannerInput(addedChars)) {
    scannerTimer = window.setTimeout(() => {
      if (RING_NUMBER_PATTERN.test(scannerBuffer.trim())) {
        submitScan()
      }
      scannerBuffer = ''
      scannerTimer = null
    }, 80)
  } else {
    scannerTimer = window.setTimeout(() => {
      scannerBuffer = ''
      scannerTimer = null
    }, 200)
  }
}

function submitScan() {
  const error = validateRingNumber(inputValue.value)
  if (error) {
    validationError.value = error
    triggerShake()
    return
  }

  emit('scan', inputValue.value.trim())
  inputValue.value = ''
  scannerBuffer = ''
  validationError.value = ''
}

function handleScan() {
  submitScan()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    submitScan()
  }
}

function triggerShake() {
  isShaking.value = true
  setTimeout(() => {
    isShaking.value = false
  }, 500)
}

function quickScan(ringNumber: string) {
  validationError.value = ''
  emit('scan', ringNumber)
}

watch(
  () => props.scanHistory[0],
  (newVal) => {
    if (newVal) {
      lastScanResult.value = newVal
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-fuchsia-50">
      <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
        <ScanLine class="w-5 h-5 text-violet-600" />
        脚环扫码录入
      </h2>
      <p class="text-sm text-slate-500 mt-0.5">扫描赛鸽脚环记录归巢时间</p>
    </div>

    <div class="p-5 space-y-5">
      <div
        :class="cn(
          'relative transition-all',
          isShaking && 'animate-[shake_0.5s_ease-in-out]'
        )"
      >
        <div
          :class="cn(
            'flex items-center gap-3 rounded-xl border-2 p-2 transition-all',
            lastScanResult?.success === true
              ? 'border-emerald-400 bg-emerald-50/50'
              : lastScanResult?.success === false
              ? 'border-red-400 bg-red-50/50'
              : 'border-slate-200 bg-slate-50 focus-within:border-violet-400 focus-within:bg-white'
          )"
        >
          <div
            :class="cn(
              'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
              lastScanResult?.success === true
                ? 'bg-emerald-500'
                : lastScanResult?.success === false
                ? 'bg-red-500'
                : 'bg-violet-500'
            )"
          >
            <ScanLine v-if="!lastScanResult" class="w-6 h-6 text-white" />
            <CheckCircle2 v-else-if="lastScanResult.success" class="w-6 h-6 text-white" />
            <XCircle v-else class="w-6 h-6 text-white" />
          </div>

          <div class="flex-1 relative">
            <input
              :value="inputValue"
              type="text"
              placeholder="请扫描或输入脚环编号，如 CHN-2024-0000001"
              class="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 font-mono text-base"
              @input="onInput"
              @keydown="handleKeydown"
            />
            <div v-if="validationError" class="flex items-center gap-1.5 mt-1">
              <AlertCircle class="w-3 h-3 text-red-500 flex-shrink-0" />
              <span class="text-xs text-red-500 font-medium">{{ validationError }}</span>
            </div>
            <div v-else-if="lastScanResult" class="flex items-center gap-2 mt-0.5">
              <Clock class="w-3 h-3 text-slate-400" />
              <span class="text-xs text-slate-500">
                {{ formatTime(lastScanResult.scanTime) }}
              </span>
              <span
                v-if="lastScanResult.message"
                :class="cn(
                  'text-xs font-medium',
                  lastScanResult.success ? 'text-emerald-600' : 'text-red-600'
                )"
              >
                · {{ lastScanResult.message }}
              </span>
            </div>
          </div>

          <button
            @click="handleScan"
            class="flex-shrink-0 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            确认录入
          </button>
        </div>

        <div class="absolute top-0 left-0 right-0 h-1 -mt-2 overflow-hidden rounded-t-xl">
          <div
            class="h-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 animate-[scan_2s_ease-in-out_infinite]"
          />
        </div>
      </div>

      <div>
        <div class="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
          <AlertCircle class="w-3.5 h-3.5" />
          快捷录入（飞行中赛鸽）
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="pigeon in quickScanList"
            :key="pigeon.id"
            @click="quickScan(pigeon.ringNumber)"
            class="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-xs font-mono text-slate-600 hover:text-violet-700 transition-all"
          >
            {{ pigeon.ringNumber }}
            <span class="text-slate-400 mx-1">·</span>
            <span class="font-medium">{{ pigeon.name }}</span>
          </button>
        </div>
      </div>

      <div class="border-t border-slate-100 pt-4">
        <div class="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
          <History class="w-3.5 h-3.5" />
          最近扫码记录
        </div>
        <div
          v-if="scanHistory.length === 0"
          class="text-center py-6 text-sm text-slate-400"
        >
          暂无扫码记录
        </div>
        <div v-else class="space-y-2 max-h-48 overflow-y-auto">
          <div
            v-for="(record, index) in scanHistory.slice(0, 8)"
            :key="index"
            :class="cn(
              'flex items-center justify-between px-3 py-2 rounded-lg text-sm',
              record.success ? 'bg-emerald-50' : 'bg-red-50'
            )"
          >
            <div class="flex items-center gap-2">
              <CheckCircle2
                v-if="record.success"
                class="w-4 h-4 text-emerald-500 flex-shrink-0"
              />
              <XCircle v-else class="w-4 h-4 text-red-500 flex-shrink-0" />
              <span class="font-mono text-slate-700">{{ record.ringNumber }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span
                v-if="record.message"
                :class="cn('text-xs', record.success ? 'text-emerald-600' : 'text-red-600')"
              >
                {{ record.message }}
              </span>
              <span class="text-xs text-slate-400 font-mono">
                {{ formatTime(record.scanTime) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes scan {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
</style>
