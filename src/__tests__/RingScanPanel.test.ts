import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RingScanPanel from '@/components/RingScanPanel.vue'

function mountPanel() {
  return mount(RingScanPanel, {
    props: {
      scanHistory: [],
      inFlightPigeons: [],
    },
  })
}

describe('RingScanPanel manual ring number entry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('does not emit scan when a paused manual input reaches incomplete 14 or 15 character values', async () => {
    const wrapper = mountPanel()
    const input = wrapper.find('input')

    await input.setValue('CHN-2024-0000')
    vi.advanceTimersByTime(201)

    await input.setValue('CHN-2024-00000')
    vi.advanceTimersByTime(80)
    expect(wrapper.emitted('scan')).toBeUndefined()

    await input.setValue('CHN-2024-000000')
    vi.advanceTimersByTime(80)
    expect(wrapper.emitted('scan')).toBeUndefined()
  })

  it('does not auto-submit a complete value when it is typed one character at a time', async () => {
    const wrapper = mountPanel()
    const input = wrapper.find('input')
    const ringNumber = 'CHN-2024-0000001'

    for (let index = 1; index <= ringNumber.length; index++) {
      await input.setValue(ringNumber.slice(0, index))
      vi.advanceTimersByTime(20)
    }

    vi.advanceTimersByTime(250)

    expect(wrapper.emitted('scan')).toBeUndefined()
  })

  it('auto-submits a complete scanner-style value after the scanner debounce', async () => {
    const wrapper = mountPanel()
    const input = wrapper.find('input')

    await input.setValue('CHN-2024-0000001')
    vi.advanceTimersByTime(79)
    expect(wrapper.emitted('scan')).toBeUndefined()

    vi.advanceTimersByTime(1)

    expect(wrapper.emitted('scan')).toEqual([['CHN-2024-0000001']])
  })
})
