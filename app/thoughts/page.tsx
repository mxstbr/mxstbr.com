import { BlogPosts } from 'app/components/posts'

// TODO
export const metadata = {
  title: 'Blog',
  description: 'Read my blog.',
}

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Essays</h1>
      <BlogPosts />
    </section>
  )
}
