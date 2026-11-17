import { describe, it, expect } from 'vitest'
import { publicDisplayName as source } from '../../lib/discretion'
import { publicDisplayName as copy } from '../../../mini-services/live-stream/display-name'

const cases: Array<[string, Parameters<typeof source>[0], string | undefined]> = [
  ['nickname', { nickname: 'Amber 4821', firstName: 'Ada', lastName: 'Lovelace' }, undefined],
  ['first and last initial', { firstName: 'Ada', lastName: 'Lovelace' }, undefined],
  ['empty last name', { firstName: 'Ada', lastName: '' }, undefined],
  ['null last name', { firstName: 'Ada', lastName: null }, undefined],
  ['null person', null, undefined],
  ['null person with fallback', null, 'A calo. member'],
  ['no first name', { firstName: '', lastName: 'Lovelace' }, 'Friend'],
  ['whitespace nickname falls through', { nickname: '   ', firstName: 'Ada', lastName: 'Lovelace' }, undefined],
  ['whitespace around names', { firstName: '  Ada ', lastName: '  lovelace ' }, undefined],
]

describe('mini-service publicDisplayName matches src/lib/discretion', () => {
  it.each(cases)('%s', (_name, input, fallback) => {
    expect(copy(input, fallback)).toBe(source(input, fallback))
  })

  it('sanity: expected values', () => {
    expect(copy({ nickname: 'Amber 4821', firstName: 'Ada', lastName: 'L' })).toBe('Amber 4821')
    expect(copy({ firstName: 'Ada', lastName: 'Lovelace' })).toBe('Ada L.')
    expect(copy({ firstName: 'Ada', lastName: '' })).toBe('Ada')
  })
})
