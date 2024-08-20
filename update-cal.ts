import { Redis } from '@upstash/redis'
import { events } from './madison'
import env from '@next/env'

const projectDir = process.cwd()
env.loadEnvConfig(projectDir)

const redis = Redis.fromEnv()

async function main() {
  redis.json.set(`cal:${process.env.CAL_PASSWORD}`, '$', events)
}

main()
