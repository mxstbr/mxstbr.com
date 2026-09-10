import { ChoresService } from './service'
import { RedisRepository, MemoryRepository } from './repository'
import { fixture } from './fixtures'

export function developmentFixture() {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.CHORES2_DEV_FIXTURE === '1'
  )
}
const globalState = globalThis as typeof globalThis & {
  chores2Development?: MemoryRepository
}
export function choresService() {
  if (developmentFixture()) {
    if (!globalState.chores2Development) {
      const f = fixture(new Date('2026-09-09T15:00:00Z'))
      globalState.chores2Development = new MemoryRepository(f.core, f.days)
    }
    return new ChoresService(
      globalState.chores2Development,
      () => new Date('2026-09-09T15:00:00Z'),
    )
  }
  return new ChoresService(new RedisRepository())
}
