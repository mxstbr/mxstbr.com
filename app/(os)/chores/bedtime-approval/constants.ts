export const BEDTIME_TEMPLATES = [
  {
    key: 'inBedOnTime',
    title: "Was in bed before Alexa says 'Bedtime' (changed, brushed, and peed) yesterday 🛌",
    stars: 1,
    emoji: '🛌',
  },
  {
    key: 'delightfulNight',
    title: 'Made it a delightful bedtime last night all the way to waking up today 😴',
    stars: 2,
    emoji: '😴',
  },
] as const

export type BedtimeTemplate = (typeof BEDTIME_TEMPLATES)[number]
export type BedtimeTemplateKey = BedtimeTemplate['key']
