import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  RING_NUMBER_PATTERN,
  validateRingNumber,
  isLikelyScannerInput,
} from '@/lib/pigeonUtils'

function simulateTypingSequence(fullRingNumber: string): {
  partialSubmissions: string[]
  validSubmission: string | null
} {
  const partialSubmissions: string[] = []
  let validSubmission: string | null = null

  for (let i = 1; i <= fullRingNumber.length; i++) {
    const currentInput = fullRingNumber.slice(0, i)
    const addedChars = currentInput.slice(Math.max(0, i - 1))
    const isScanner = isLikelyScannerInput(addedChars)

    if (isScanner && RING_NUMBER_PATTERN.test(currentInput.trim())) {
      validSubmission = currentInput.trim()
    }

    if (!isScanner) {
      const error = validateRingNumber(currentInput)
      if (error) {
        partialSubmissions.push(currentInput)
      }
    }
  }

  return { partialSubmissions, validSubmission }
}

describe('脚环扫码提前提交 Bug 修复验证', () => {
  describe('场景1: 手动逐字输入完整脚环号，不应在任何中间步骤自动提交', () => {
    it('输入 "CHN-2024-0000001" 逐字输入时，不应在长度=14时触发提交', () => {
      const ringNumber = 'CHN-2024-0000001'

      for (let i = 1; i < ringNumber.length; i++) {
        const partial = ringNumber.slice(0, i)
        const addedChars = ringNumber.slice(i - 1, i)

        const isScanner = isLikelyScannerInput(addedChars)
        if (isScanner) continue

        const validationError = validateRingNumber(partial)
        expect(validationError).not.toBeNull()
      }
    })

    it('完整输入后才通过格式校验', () => {
      const ringNumber = 'CHN-2024-0000001'
      expect(validateRingNumber(ringNumber)).toBeNull()
    })

    it('长度=14时的部分输入 "CHN-2024-00000" 应被格式校验拒绝', () => {
      const partial14 = 'CHN-2024-00000'
      expect(partial14.length).toBe(14)
      expect(validateRingNumber(partial14)).not.toBeNull()
    })

    it('长度=15时的部分输入 "CHN-2024-000000" 应被格式校验拒绝', () => {
      const partial15 = 'CHN-2024-000000'
      expect(partial15.length).toBe(15)
      expect(validateRingNumber(partial15)).not.toBeNull()
    })
  })

  describe('场景2: 扫码枪快速输入完整脚环号，应自动提交', () => {
    it('扫码枪一次性输入完整编号应被识别为扫码输入', () => {
      const scannerInput = 'CHN-2024-0000001'
      expect(isLikelyScannerInput(scannerInput)).toBe(true)
    })

    it('扫码枪分两次输入（前半+后半）应被识别', () => {
      expect(isLikelyScannerInput('CHN-2024-')).toBe(true)
      expect(isLikelyScannerInput('0000001')).toBe(true)
    })
  })

  describe('场景3: 手动输入后按回车或点击按钮提交', () => {
    it('完整输入后按回车应通过校验', () => {
      const fullInput = 'CHN-2024-0000001'
      expect(validateRingNumber(fullInput)).toBeNull()
    })

    it('不完整输入后按回车应被拦截', () => {
      const incompleteInputs = [
        'CHN-2024-000000',
        'CHN-2024-00000',
        'CHN-2024-0000',
        'CHN-2024-000',
        'CHN-2024-00',
        'CHN-2024-0',
        'CHN-2024-',
        'CHN-2024',
        'CHN-202',
        'CHN-20',
        'CHN-2',
        'CHN-',
        'CHN',
        'CH',
        'C',
      ]

      incompleteInputs.forEach((input) => {
        expect(validateRingNumber(input)).not.toBeNull()
      })
    })
  })

  describe('场景4: 格式校验覆盖各种错误输入', () => {
    it('应拒绝小写格式', () => {
      expect(validateRingNumber('chn-2024-0000001')).not.toBeNull()
    })

    it('应拒绝年份为非数字', () => {
      expect(validateRingNumber('CHN-ABCD-0000001')).not.toBeNull()
    })

    it('应拒绝序号不足7位', () => {
      expect(validateRingNumber('CHN-2024-000001')).not.toBeNull()
    })

    it('应拒绝序号超过7位', () => {
      expect(validateRingNumber('CHN-2024-00000001')).not.toBeNull()
    })

    it('应拒绝缺少前缀', () => {
      expect(validateRingNumber('2024-0000001')).not.toBeNull()
    })

    it('应拒绝使用空格代替连字符', () => {
      expect(validateRingNumber('CHN 2024 0000001')).not.toBeNull()
    })
  })

  describe('场景5: 模拟完整打字序列 - 验证不存在提前提交', () => {
    it('手动逐字输入 "CHN-2024-0000001" 全程不产生自动提交', () => {
      const { partialSubmissions, validSubmission } = simulateTypingSequence('CHN-2024-0000001')

      expect(partialSubmissions.length).toBeGreaterThan(0)
      expect(validSubmission).toBeNull()
    })
  })
})
