import { deviceActor } from 'app/lib/chores/auth'
import { choresService } from 'app/lib/chores/runtime'
import { choresAppVersion } from 'app/lib/chores/app-version'
import { ChoresBoard } from './board'
import { LoginForm } from './login-form'

export const dynamic = 'force-dynamic'
export default async function Page() {
  const actor = await deviceActor()
  if (!actor) return <LoginForm />
  return (
    <ChoresBoard
      initial={await choresService().getBoard(actor)}
      version={choresAppVersion()}
    />
  )
}
