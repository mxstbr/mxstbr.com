import { deviceActor } from 'app/lib/chores2/auth'
import { choresService } from 'app/lib/chores2/runtime'
import { ChoresBoard } from './board'

export const dynamic = 'force-dynamic'
export default async function Page() {
  const actor = await deviceActor()
  if (!actor)
    return (
      <main className="c2-lock">
        <span aria-hidden="true">🌈</span>
        <h1>Your chore board</h1>
        <p>Ask your parent to open this board on your iPad.</p>
        <p>They can get a device link by asking ChatGPT.</p>
      </main>
    )
  return <ChoresBoard initial={await choresService().getBoard(actor)} />
}
