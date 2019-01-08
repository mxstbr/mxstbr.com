import BlogPost from '../../components/BlogPost';

export const meta = {
  published: true,
  publishedAt: '2018-01-10',
  title: 'Spectrum in Hindsight: Bad Tech Decisions',
  path: '/blog/technical-hindsight-spectrum',
  summary: 'Spectrum is an open source chat app for large online communities. With the benefit of hindsight after two years, here are the technical decisions I would change if we were starting over'
}

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>

👋 I am Max, the technical co-founder of [Spectrum](https://spectrum.chat). Spectrum is an [open source](https://github.com/withspectrum/spectrum) chat app for large online communities and was recently acquired by GitHub. We are a team of three with a predominantly frontend and design background and have worked on it for close to two years.

With the benefit of hindsight, here are the technical decisions I would change if we were starting over.

### Go mobile-first and use react-native-web

Most people prefer mobile apps for chatting with others. Yet, a big part of the appeal of Spectrum is that all the content is public and search-indexed, so we had to build the web app first.

Although the search indexing worked out, we should have optimised our web app for mobile first. While a good mobile experience on desktop is bearable, a desktop experience on mobile or a crappy mobile experience is not.

We are building native apps, but starting from scratch is time consuming. If we had used [react-native-web](https://github.com/necolas/react-native-web) to build the base components for the web app we could have reused them for the native apps—a big win for moving fast! 💯

### Use Next.js for server-side rendering

We needed server-side rendering for SEO purposes ([client-side rendering does not cut it](https://twitter.com/mxstbr/status/985188986414161921)) but had already built a first version of the app with [create-react-app](https://github.com/facebook/create-react-app). We thought about switching to [Next.js](https://nextjs.org) but reworking the routing setup seemed like a lot of effort. I mean, how hard can it be to build a server-side rendering setup from scratch?! 🤔

Turns out it is tough. It takes a lot of work and it is difficult to provide a good experience, for both developers and users. 

Next.js offers an amazing development experience and fast performance out of the box, not to mention the great community and excellent documentation. I would use it in a heartbeat if we started over today (in fact, [this website is built with Next.js](https://github.com/mxstbr/mxstbr.com)).

### Leverage a well-known database

We chose [RethinkDB](https://www.rethinkdb.com) as our primary data store mainly because of [changefeeds](https://rethinkdb.com/docs/changefeeds/javascript/). They allow you to listen to live updates on (almost) any query. I thought this would reduce complexity by avoiding a separate PubSub system for real-time functionality.

Unfortunately, we have had a lot of troubles with RethinkDB. Since it is not widely used, there is little documentation and knowledge about operations. We have had many database outages and debugging them often feels like shooting in the dark.

It also turns out that changefeeds do not scale as well as we had expected. While we managed to work around it, we should not have had to. 😕

Nowadays, I would choose a more established database and build a PubSub system on top.

#### ...and use Prisma as the ORM

Another reason why we chose RethinkDB is the Node.js driver, which has a beautiful query API. For example, check out this query which loads a paginated list of the threads posted by a user:

```JS
const getThreadsByUser = (id, skip, limit) => {
  return db
    .table('threads')
    .getAll(id, { index: 'userId' })
    .skip(skip || 0)
    .limit(limit || 10)
    .run();
}
```

That is one pretty API! 😍 But there is a new kid on the block and it looks even better: [Prisma](https://prisma.io).

With Prisma, you define your database schema with the GraphQL Schema Definition Language. It then automatically generates type-safe SQL queries—a phenomenal developer experience! It would also have been a natural fit for our GraphQL-based API.

Let's look at the same query again, but this time using Prisma (and do not forget, it is fully type-safe!):

```JS
const getThreadsByUser = (id, after, first) => {
  return db
    .user({ id })
    .threads({ 
      first,
      after,
    });
}
```

😍😍😍

Unfortunately Prisma didn't exist yet when we were starting out, it could have helped us move faster and avoid a lot of bugs at the same time.

### Avoid WYSIWYG editing

The main action users perform on Spectrum is writing content, so we wanted it to be as nice as possible. We decided to replace our plaintext markdown input with a custom WYSIWYG editor based on [Draft.js](https://draft-js.org).

Unfortunately it is really buggy. Even after months of work it is not as good as our users need it to be—we constantly hear complaints about it. The lack of cross-browser support also means that we had to keep the plaintext input around as a fallback. 👎

While another WYSIWYG framework might have worked, we should have focused on more pressing features instead of working on polish—the plaintext markdown input was fine.

### Summary

To summarise, this is what I would change if we were starting over today:

- optimise for mobile first
- use react-native-web for the base components
- use Next.js for the web app
- leverage a more established database
- use Prisma as the "ORM"
- avoid WYSIWYG editing

What is your current stack and what would you change about it? 🧐 Ping me [on Twitter](https://twitter.com/mxstbr) and let me know!
