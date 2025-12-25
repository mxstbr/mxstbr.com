import Link from 'next/link'
import { BlogPosts } from 'app/components/posts'
import { ItemList, ItemListItem } from 'app/components/item-list'
import { Section } from 'app/components/section'

export default async function Home() {
  return (
    <div className="space-y-20">
      <Section title="TL;DR">
        <ItemList>
          <ItemListItem
            left={
              <>
                Software Developer passionate about{' '}
                <a href="#">web technologies</a>
              </>
            }
            right={`💻`}
          ></ItemListItem>
          <ItemListItem
            left={
              <>
                Writer sharing thoughts on{' '}
                <Link href="/thoughts">technology and development</Link>
              </>
            }
            right={`✍️`}
          ></ItemListItem>
          <ItemListItem
            left={
              <>
                Digital gardener cultivating{' '}
                <Link href="/notes">ideas and explorations</Link>
              </>
            }
            right={`🌱`}
          ></ItemListItem>
          <ItemListItem
            left={<>Based in [Your Location]</>}
            right={`📍`}
          ></ItemListItem>
        </ItemList>
      </Section>

      <div className="relative flex-1">
        {/* Background */}
        <div className="absolute -top-6 -left-6 -right-6 -bottom-6 bg-slate-100 dark:bg-slate-900 sm:rounded-md border border-solid border-slate-300 dark:border-slate-700" />
        <Section className="relative">
          <h2 className="font-bold relative text-lg">Essays</h2>
          <BlogPosts />
        </Section>
      </div>
    </div>
  )
}
