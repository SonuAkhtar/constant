import { describe, expect, it } from 'vitest'
import { cascadeSlotTiming, DEFAULT_TIMINGS, formatSlotTime } from './useSlotTimingStore'

describe('cascadeSlotTiming', () => {
  it('moves the neighbouring slot edges with the edited slot', () => {
    const r = cascadeSlotTiming(DEFAULT_TIMINGS, 'afternoon', '13:00', '18:00')
    expect('timings' in r && r.timings.morning.end).toBe('13:00')
    expect('timings' in r && r.timings.evening.start).toBe('18:00')
  })

  it.each([
    ['end before start', '15:00', '13:00'],
    ['empty start', '', '13:00'],
    ['squeezes morning to nothing', '06:00', '17:00'],
  ])('rejects %s', (_label, start, end) => {
    expect('error' in cascadeSlotTiming(DEFAULT_TIMINGS, 'afternoon', start, end)).toBe(true)
  })
})

describe('formatSlotTime', () => {
  it('formats 12-hour times and survives bad input', () => {
    expect(formatSlotTime({ start: '06:00', end: '12:30' })).toBe('6am - 12:30pm')
    expect(formatSlotTime({ start: '', end: '12:00' })).not.toContain('undefined')
  })
})
