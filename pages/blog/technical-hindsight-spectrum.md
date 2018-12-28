import PageHeader from '../../components/PageHeader';

<PageHeader title="CTO Regrets: What I'd Do Differently" />

export const frontmatter = {
  published: false,
  hidden: true
}

👋 I'm Max, the technical cofounder of [Spectrum](https://spectrum.chat). Spectrum is a public, [open source](https://github.com/withspectrum/spectrum), threaded chat app for large online communities and was recently acquired by GitHub. We're a team of three, and have worked on it for almost two years.

With the benefit of hindsight, here's some technical decisions I'd change if we were to start over.

### Go mobile-first and use react-native-web

In general, people prefer mobile apps over desktop apps for chatting with others. However, a big part of the allure of Spectrum is that the content is fully search-indexed. For this reason, we built out the web experience first, making it easy for crawlers to index pages and help people discover the threads on Spectrum.

In hindsight, we should have optimised our web app for mobile first. A good mobile experience on desktop is bearable, but a desktop experience on mobile or a crappy mobile experience isn't.

We still want to build native apps, but starting from scratch has proved too time consuming and we still haven't finished development. If we'd used [react-native-web](https://github.com/necolas/react-native-web) from the start to build our base component library, we could have quickly shipped native apps based on our existing web app—a big win when you're trying to move fast! 💯

### Use Next.js for server-side rendering

We knew we needed server-side rendering for SEO purposes (no, [client-side rendering doesn't cut it](https://twitter.com/mxstbr/status/985188986414161921)), but already had a MVP of the app built with [create-react-app](https://github.com/facebook/create-react-app). We thought about switching to [Next.js](https://nextjs.org), but reworking the routing setup seemed like a lot of effort. Building our own [production-ready server-side rendering server](https://github.com/withspectrum/spectrum/tree/alpha/hyperion), how hard could that be, right? 🤔

Turns out, it's tough. The development experience (DX) is difficult to get right (we didn't, which hurt our momentum) and it requires a lot of maintenance. Next.js deals with so much out of the box, from the amazing DX, seamless upgrades and great community all the way to fast performance, that I'd use it in a heartbeat if I were starting over today.

### Leverage a well-known database

We chose [RethinkDB](https://www.rethinkdb.com) as our primary data store, mainly because of [changefeeds](https://rethinkdb.com/docs/changefeeds/javascript/). Changefeeds allow you to listen to live updates on (almost) any query. Since Spectrum is a chat app, this promised to reduce complexity by avoiding a separate PubSub layer for live updates.

Unfortunately, we've had a lot of troubles with RethinkDB. There isn't much of a community around it since it's not widely used, so there is little documentation around query performance and operations. Debugging slow queries or connection issues often feels like shooting in the dark, and we've had many sleepless nights due to unexpected outages.

It also turns out that changefeeds do not scale as well as promised. Their implementation is imperformant and start breaking down if you have more than a couple hundred concurrent listeners. The feature that made us choose RethinkDB in the first place turned out not to be useful in practice! While we've managed to work around it with some effort, it slowed us down considerably. 😕

If we were to do it over again, I would choose a more established database, most likely Postgres.

#### ...and use Prisma as the ORM

One of the other reasons we went with RethinkDB is the Node.js driver—the API is beautiful. For example, check out this GraphQL resolver which loads a paginated list of the threads a specific user has posted:

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

We are already using GraphQL for our API, so using the GraphQL SDL to define our db schema would have been a natural fit. On top of that, Prisma automatically generates(!) type-safe(!!) database queries(!!!)—a phenomenal developer experience! Let's look at the same GraphQL resolver again, but this time using Prisma:

```JS
const Query = {
  User: {
    threads: ({ id }, { after, first }, { prisma }) => 
      prisma.user({ id }).threads({ first, after }),
  }
}
```

😍😍😍

If we were to start over I would take a good look at Prisma. While it might still be immature and on the cutting edge, it's worth evaluating.

### No WYSIWYG

The main action users perform on Spectrum is writing content, so we wanted that experience to be as nice as possible. We decided to replace our MVP plaintext + Markdown input with a custom WYSIWYG editor based on [Draft.js](https://draft-js.org).

Unfortunately, the writing experience on Spectrum is buggy and breaks between browsers and operating systems. Even after months of work it's not as good as our users deserve and we constantly hear complaints about it. The lack of great cross-browser support meant that in some cases we had to fall back to a plaintext input anyways. 👎

We should've stuck with the plaintext + Markdown input we had at the start. This decision would have allowed us to work on more important features instead of WYSIWYG editing.

### Summary

To summarise, if we were to start over, I would:

- optimise for mobile first
- use react-native-web to quickly ship native apps
- use Next.js for the web app
- leverage a more established database
- use Prisma as the "ORM"
- not build a WYSIWYG editor

What is your current stack and what would you change about it? 🧐 Ping me [on Twitter](https://twitter.com/mxstbr) and tell me about it!
