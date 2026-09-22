import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const docs = resolve(root, 'docs/chores2')
const data = JSON.parse(
  readFileSync(resolve(docs, 'rebuild-features.json'), 'utf8'),
)
const features = [...data.features, ...data.newFeatures]
const exclusions = new Map(
  data.notCurrentBehaviors.map((item) => [item.id, item]),
)
const ids = new Set(features.map((item) => item.id))
const originalIds = new Set([
  ...Array.from({ length: 69 }, (_, i) => `K${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 54 }, (_, i) => `P${String(i + 1).padStart(2, '0')}`),
])
if (
  ids.size !== features.length ||
  data.features.length !== 123 ||
  data.features.some((feature) => !originalIds.has(feature.id)) ||
  !data.newFeatures.some((feature) => feature.id === 'K70') ||
  !data.newFeatures.some((feature) => feature.id === 'P55')
)
  throw new Error(
    'Preserve the 123 original IDs and the two added requirements.',
  )
for (const feature of features) {
  if (feature.isCurrentBehavior !== (feature.disposition !== 'removed'))
    throw new Error(`Contradictory behavior status: ${feature.id}`)
  if (
    !feature.isCurrentBehavior &&
    (!feature.notBehavior || !feature.notBehaviorRefs.length)
  )
    throw new Error(`Missing explicit exclusion: ${feature.id}`)
  for (const id of feature.notBehaviorRefs)
    if (!exclusions.has(id)) throw new Error(`Unknown exclusion: ${id}`)
  for (const path of feature.implementation.files)
    if (!existsSync(resolve(root, path)))
      throw new Error(`Missing implementation path: ${path}`)
}
for (const item of exclusions.values())
  for (const id of item.featureIds)
    if (!ids.has(id)) throw new Error(`Unknown feature: ${id}`)

const label = (feature) =>
  feature.isCurrentBehavior
    ? `Current behavior · ${feature.disposition.replaceAll('_', ' ')}`
    : 'Not current behavior · removed'
const negatives = (feature) =>
  feature.notBehaviorRefs
    .map(
      (id) =>
        `[${id}: ${exclusions.get(id).title}](inventory.md#${id.toLowerCase()})`,
    )
    .join('; ')
const cell = (value) =>
  String(value ?? '')
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ')
const generated =
  '<!-- Generated from rebuild-features.json by node scripts/render-chores-behaviors.mjs. -->'
const asOf = `Audited ${data.auditedAt} against application commit \`${data.auditedSourceCommit}\`. Current product: **/chores**. The separate legacy board is **/chores2**.`
const count = `${data.features.length} original IDs + ${data.newFeatures.length} added requirements = ${features.length} records; ${features.filter((f) => f.isCurrentBehavior).length} current capabilities, ${features.filter((f) => !f.isCurrentBehavior).length} removed capabilities, and ${exclusions.size} explicit not-current-behavior rules.`

const inventory = [
  '# Chores: current kid and parent behavior inventory',
  '',
  generated,
  '',
  asOf,
  '',
  'This is the current behavior reference for a rebuild. Positive capabilities describe the shipped system. **Not current behavior** explicitly rejects an old or superseded behavior; it must not be rebuilt merely because legacy code or an old prototype contains it. Lower-priority capabilities are still implemented unless marked removed.',
  '',
  count,
  '',
  'Use [scope and acceptance rules](rebuild-scope.md), [current iPad interface](ipad-landscape-ui.md), [coverage/evidence](coverage.md), and [agent operations](managing.md) for supporting detail. The [annotated legacy audit](legacy-inventory.md) preserves the historical source without presenting it as current behavior.',
  '',
  '## Current decisions at a glance',
  '',
  ...Object.entries(data.confirmedDecisions).map(
    ([key, value]) => `- **${key}:** ${value}`,
  ),
  '',
  '## Explicitly not current behavior',
  '',
]
for (const item of exclusions.values())
  inventory.push(
    `<a id="${item.id.toLowerCase()}"></a>`,
    '',
    `### ${item.id} — ${item.title}`,
    '',
    `**Not current behavior:** ${item.notBehavior}`,
    '',
    `**Current behavior:** ${item.currentBehavior}`,
    '',
    `Applies to ${item.featureIds.join(', ')}. Basis: ${item.basis.replaceAll('_', ' ')}.`,
    '',
  )
let previousGroup
for (const feature of features) {
  const group = feature.group || 'Added rebuild capabilities'
  if (previousGroup !== group) {
    inventory.push(`## ${group}`, '')
    previousGroup = group
  }
  inventory.push(
    `<a id="${feature.id.toLowerCase()}"></a>`,
    '',
    `- **${feature.id} — ${feature.isCurrentBehavior ? feature.targetStory : feature.notBehavior}** _${label(feature)}._ ${feature.targetNotes}${feature.notBehaviorRefs.length ? ` **Not current behavior:** ${negatives(feature)}.` : ''}`,
    '',
  )
}

const dispositions = [
  '# Chores behavior dispositions',
  '',
  generated,
  '',
  asOf,
  '',
  count,
  '',
  'The full current descriptions and explicit exclusions are in [inventory.md](inventory.md). The [legacy audit](legacy-inventory.md) is historical. This index and coverage.md are rendered from the same JSON so a removed legacy capability cannot silently become a positive requirement.',
  '',
  '| ID | State | Current capability or explicit exclusion | Not current behavior |',
  '| --- | --- | --- | --- |',
  ...features.map(
    (f) =>
      `| [${f.id}](inventory.md#${f.id.toLowerCase()}) | ${label(f)} | ${cell(f.isCurrentBehavior ? f.targetStory : f.notBehavior)} | ${cell(negatives(f) || 'No additional exclusion specific to this capability.')} |`,
  ),
  '',
]
const coverage = [
  '# Chores current behavior coverage',
  '',
  generated,
  '',
  asOf,
  '',
  'Evidence is source inspection plus the listed previously completed checks; this documentation update does not claim a new test run or new physical-iPad verification. Excluded rows document absence in the current product, regardless of separate legacy code.',
  '',
  '| ID | State | Current capability or explicit exclusion | Implementation evidence | Verification evidence |',
  '| --- | --- | --- | --- | --- |',
  ...features.map(
    (f) =>
      `| [${f.id}](inventory.md#${f.id.toLowerCase()}) | ${f.isCurrentBehavior ? 'Current' : '**Not current behavior**'} | ${cell(f.isCurrentBehavior ? f.targetStory : f.notBehavior)} | ${f.implementation.files.map((p) => `[${p}](../../${p.replaceAll(' ', '%20')})`).join(', ')} | ${cell(f.implementation.verification)} |`,
  ),
  '',
]
for (const [file, lines] of [
  ['inventory.md', inventory],
  ['rebuild-features.md', dispositions],
  ['coverage.md', coverage],
])
  writeFileSync(resolve(docs, file), lines.join('\n'))
console.log(
  `Rendered ${features.length} behavior records and ${exclusions.size} exclusions.`,
)
