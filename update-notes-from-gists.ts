import { Octokit } from '@octokit/rest'
import env from '@next/env'

const NOTES_GIST_ID = '29f4eebada6196debb1b085a844e49aa'

const projectDir = process.cwd()
env.loadEnvConfig(projectDir)

async function main() {
  const octokit = new Octokit({
    auth: process.env.GITHUB_ACCESS_TOKEN,
  })

  const response = await octokit.gists.get({
    gist_id: NOTES_GIST_ID,
  })

  const { files } = response.data

  if (!files || response.status !== 200) {
    throw new Error('Could not get gist.')
  }

  console.log(files)
}

main()
