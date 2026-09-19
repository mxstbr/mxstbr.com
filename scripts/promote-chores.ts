import nextEnv from '@next/env'
import { cutoverBalances } from '../app/lib/chores2/balance-cutover'

nextEnv.loadEnvConfig(process.cwd())
const [phase, flag] = process.argv.slice(2)
if (
  (phase !== 'initial' && phase !== 'final') ||
  (flag && flag !== '--apply')
) {
  console.error(
    'Usage: pnpm exec tsm scripts/promote-chores.ts initial|final [--apply]',
  )
  process.exitCode = 1
} else {
  cutoverBalances({ phase, apply: flag === '--apply' })
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(
        error instanceof Error ? error.message : 'Balance cutover failed.',
      )
      process.exitCode = 1
    })
}
