import { deviceActor } from 'app/lib/chores2/auth'
import { choresService } from 'app/lib/chores2/runtime'
import { ChoresBoard } from './board'
import { LoginForm } from './login-form'

export const dynamic = 'force-dynamic'
export default async function Page() {
  const actor = await deviceActor()
  if (!actor) return <LoginForm />
  return <ChoresBoard initial={await choresService().getBoard(actor)} />
}
