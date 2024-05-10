import { Redis } from '@upstash/redis'

export default async function Views(props: { slug: string }) {
  const redis = Redis.fromEnv()
  const { slug } = props

  const views =
    (await redis.get<number>(['pageviews', 'essay', slug].join(':'))) || 0

  return `${views.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })} views`
}
