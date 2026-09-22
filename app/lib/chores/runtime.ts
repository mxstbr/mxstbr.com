import { ChoresService } from './service'
import { RedisRepository, MemoryRepository } from './repository'
import { fixture } from './fixtures'

export function developmentFixture() {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.CHORES_DEV_FIXTURE === '1'
  )
}
const globalState = globalThis as typeof globalThis & {
  choresDevelopment?: MemoryRepository
}
export function choresService() {
  if (developmentFixture()) {
    if (!globalState.choresDevelopment) {
      const f = fixture(new Date('2026-09-09T15:00:00Z'))
      globalState.choresDevelopment = new MemoryRepository(f.core, f.days)
    }
    return new ChoresService(
      globalState.choresDevelopment,
      () => new Date('2026-09-09T15:00:00Z'),
    )
  }
  return new ChoresService(new RedisRepository())
}
