import { Octokit } from '@octokit/rest'
import { getBlogPosts } from './app/thoughts/utils'

import env from '@next/env'
const projectDir = process.cwd()
env.loadEnvConfig(projectDir)

async function main() {
  console.log('Start')
  const octokit = new Octokit({
    auth: process.env.GITHUB_ACCESS_TOKEN,
  })

  try {
    console.log('Getting file…')
    const response = await octokit.repos.getContent({
      owner: 'mxstbr',
      repo: 'mxstbr',
      path: 'README.md',
    })

    if (Array.isArray(response.data) || response.data.type !== 'file') {
      throw new Error('README.md is not a file. Aborting.')
    }

    const content = Buffer.from(response.data.content, 'base64').toString()
    console.log('Got file:')
    console.log(content)

    const blogPosts = getBlogPosts()
    // Markdown output for each essay:

    // ### [You probably don't need GraphQL](https://mxstbr.com/thoughts/graphql) (19,386 views)
    //
    // It might be surprising to hear the co-founder of a GraphQL company say you probably don't need it. Let me explain.
    const text = blogPosts
      .map(
        (post) =>
          `### [${post.metadata.title}](https://mxstbr.com/thoughts/${
            post.slug
          }) (${
            // TODO: Move to Redis
            post.metadata.views.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })
          } views)\n\n${post.metadata.summary}`
      )
      .join('\n\n')
    console.log('New content:')
    console.log(text)

    const newContent = content.replace(
      /<!-- essay-marker -->[\s\S]*<!-- \/essay-marker -->/,
      `<!-- essay-marker -->\n\n${text}\n\n<!-- \/essay-marker -->`
    )
    console.log('New file:')
    console.log(newContent)

    if (newContent.replace(/\s/g, '') === content.replace(/\s/g, '')) {
      console.log('No changes detected. Exiting.')
      return
    }

    console.log('Committing file...')
    const result = await octokit.repos.createOrUpdateFileContents({
      owner: 'mxstbr',
      repo: 'mxstbr',
      path: 'README.md',
      message:
        'bot: update essays (see https://github.com/mxstbr/mxstbr.com/blob/master/sync-essays-to-github.ts)',
      content: Buffer.from(newContent).toString('base64'),
      sha: response.data.sha,
    })
    console.log(result.status, result.data)
    console.log('File committed successfully!')
  } catch (error) {
    console.error('Error retrieving README.md:', error)
  }
}

main()
