import PageHeader from '../../components/PageHeader';

<PageHeader title="CTO Regrets: What I'd Do Differently" />

export const frontmatter = {
  published: false,
  hidden: true
}

👋 I'm Max, the technical cofounder of [Spectrum](https://spectrum.chat). Spectrum is a public, [open source](https://github.com/withspectrum/spectrum), threaded chat app for large online communities and was recently acquired by GitHub. We're a team of three, and have worked on it for almost two years.

With the benefit of hindsight, here are the technical decisions I'd change if we were to start over.

### Go mobile-first and use react-native-web

In general, people prefer mobile apps over desktop apps for chatting with others. However, a big part of the allure of Spectrum is that the content is fully search-indexed. For this reason, we built the web experience first, making it easy for crawlers to index pages and help people discover the communities on Spectrum.

In hindsight, we should've optimised our web app for mobile first. While a good mobile experience on desktop is bearable, a desktop experience on mobile or a crappy mobile experience isn't.

We still want to build native apps, but starting from scratch is time consuming and we still haven't finished them. If we used [react-native-web](https://github.com/necolas/react-native-web) from the start to build our base component library, we could've quickly shipped native apps based on our existing web app—a big win when you're trying to move fast! 💯

### Use Next.js for server-side rendering

We knew we needed server-side rendering for SEO purposes (no, [client-side rendering doesn't cut it](https://twitter.com/mxstbr/status/985188986414161921)), but already had a MVP of the app built with [create-react-app](https://github.com/facebook/create-react-app). We thought about switching to [Next.js](https://nextjs.org), but reworking the routing setup seemed like a lot of effort. Building our own [production-ready server-side rendering server](https://github.com/withspectrum/spectrum/tree/alpha/hyperion), how hard could that be, right? 🤔

Turns out, it's tough. It requires a lot of maintenance and it's difficult to provide a nice development experience (we didn't, which hurt our momentum). Next.js has an amazing DX, a great community and fast performance out of the box, so I'd use it in a heartbeat if we started over today.

### Leverage a well-known database

We chose [RethinkDB](https://www.rethinkdb.com) as our primary data store mainly because of [changefeeds](https://rethinkdb.com/docs/changefeeds/javascript/). Changefeeds allow you to listen to live updates on (almost) any query. This promised to reduce complexity by avoiding a separate PubSub layer for real-time functionality.

Unfortunately, we've had a lot of troubles with RethinkDB. Since it's not widely used there's little documentation on query performance and operations. Debugging slow queries or connection issues often feels like shooting in the dark, and we've had many sleepless nights over outages.

It also turns out that changefeeds do not scale as well as we'd hoped, our cluster could only handle a couple hundred of listeners at most. The feature that made us choose RethinkDB in the first place turned out not to be useful in practice. While we've managed to work around it with some effort, it slowed us down considerably. 😕

If we were to do it over again, I'd choose a more established database (most likely Postgres) and build a PubSub layer based on Redis.

#### ...and use Prisma as the ORM

One of the other reasons we went with RethinkDB is the Node.js driver—the API is beautiful. For example, check out this GraphQL resolver which loads a paginated list of the threads posted by a user:

```JS
const getThreadsByUser = (userId, skip, limit) => {
  return db
    .table('threads')
    .getAll(userId, { index: 'userId' })
    .orderBy(r.desc('createdAt'))
    .skip(skip || 0)
    .limit(limit || 10)
    .run();
}

const Query = {
  User: {
    threads: ({ id }, { after, first }) => getThreadsByUser(id, after, first),
  }
}
```

That's one pretty API! 😍 But, there's a new kid on the block and it's even better: [Prisma](https://prisma.io).

We're already using GraphQL for our API, so using the GraphQL SDL to define our database schema would've been a natural fit. On top of that, Prisma automatically generates(!) type-safe(!!) database queries(!!!)—a phenomenal developer experience! Let's look at the same GraphQL resolver again, but this time using Prisma:

```JS
const Query = {
  User: {
    threads: ({ id }, { after, first }, { prisma }) => 
      prisma.user({ id }).threads({ first, after }),
  }
}
```

😍😍😍

If we were to start over, I'd take a good look at Prisma. While it might still be immature and on the cutting edge, it'd have been worth evaluating.

### No WYSIWYG

The main action users perform on Spectrum is writing content, so we wanted that experience to be as nice as possible. We decided to replace our MVP plaintext + Markdown input with a custom WYSIWYG editor based on [Draft.js](https://draft-js.org).

Unfortunately, the writing experience on Spectrum is buggy. Even after months of work it's not as good as our users need it to be and we constantly hear complaints about it. The lack of cross-browser support also means that in some cases we have to fall back to a plaintext input anyways. 👎

We should've stuck with the plaintext + Markdown input we had at the start. This decision would've allowed us to work on more important features instead of WYSIWYG editing.

### Summary

To summarise the things I'd change:

- optimise for mobile first
- use react-native-web to quickly ship native apps
- use Next.js for the web app
- leverage a more established database
- use Prisma as the "ORM"
- avoid WYSIWYG editing

What is your current stack and what would you change about it? 🧐 Ping me [on Twitter](https://twitter.com/mxstbr) and let me know!
