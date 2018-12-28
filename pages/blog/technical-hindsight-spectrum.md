import PageHeader from '../../components/PageHeader';

<PageHeader title="CTO Regrets: What I'd Do Differently" />

export const frontmatter = {
  published: false,
  hidden: true
}

A little bit of background: I'm Max, the technical cofounder of [Spectrum](https://spectrum.chat). Spectrum is a public, [open source](https://github.com/withspectrum/spectrum), threaded chat app for large online communities and was recently acquired by GitHub. We're a team of three, and have worked on it for almost two years.

With the benefit of hindsight, here's some technical decisions I'd change if we were to start over.

### Go mobile-first and use react-native-web

People use chat apps on their phone a lot more than on desktop. We still built a web app before native apps, as a big part of the allure of Spectrum is that the content is fully search indexed.

Having said that, we should've optimised our web app for mobile first. A good mobile experience on desktop is bearable, but a desktop experience on mobile or a crappy mobile experience isn't.

We still wanted to build native apps, but starting them from scratch proved too time consuming and we still haven't finished them. If we'd used [react-native-web](https://github.com/necolas/react-native-web) to build our base component library and optimized for mobile first we could've quickly shipped native apps based on our existing web app—a big win when you're trying to move fast!

### Use Next.js for server-side rendering

We knew we needed server-side rendering for SEO purposes (no, [client-side rendering doesn't cut it](https://twitter.com/mxstbr/status/985188986414161921)), but already had a MVP of the app built with create-react-app. We thought about switching to [Next.js](https://nextjs.org), but reworking the routing setup seemed like a lot of effort. Building our own server-side rendering server, how hard could that be, right? 🤔

We should've switched to Next.js. Writing a production-ready SSR server is hard and requires a lot of maintenance. We didn't get the development experience right either, which hurt our momentum. Next.js does so much for you out of the box, from the amazing DX to fast performance, that it's always worth using if you need SSR.

### Leverage a well-known database

We chose RethinkDB as our primary data store, mainly because of changefeeds. Changefeeds allow you to listen to live updates on (almost) any query. Since Spectrum is a chat app, this promised to reduce complexity by avoiding a separate PubSub layer for live updates. 🏎

Unfortunately, we've had a lot of troubles with RethinkDB. There isn't much of a community around it since it's not widely used, so there is little documentation around query performance and operations. Debugging slow queries or connection issues often feels like shooting in the dark, and we've had many sleepless nights due to unexpected outages.

It also turns out that changefeeds do not scale at all. Their implementation is imperformant and start breaking down if you have more than a couple hundred concurrent ones. The feature that made us chose RethinkDB in the first place turned out not to be useful in practice! While we've managed to work around it with some effort, we shouldn't have had to.

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

If we were to start over I would take a good look at Prisma. While it might be too immature and cutting edge, it's worth evaluating as the DX promises to be great.

### No WYSIWYG

The main action users do on Spectrum is writing, so we wanted that experience to be as nice as possible. We decided to replace our MVP plain text markdown input with a custom WYSIWYG editor based on [Draft.js](https://draft-js.org).

Unfortunately, the writing experience sucks. Even after months of work it's not as good as our users deserve and we constantly hear complaints about it. DraftJS also has bad cross-browser support, so we need to fall back to plain text on Android anyway.

We should've stuck with the plain text + markdown input we had at the start. While non-technical folks might not be familiar with markdown, most of our users are anyway, so we should've focussed other, more important features instead of WYSIWYG editing.

### Summary

To summarise, if we were to start over, I would:

- ...optimise for mobile first
- ...use react-native-web to quickly ship native apps
- ...use Next.js for the web app
- ...leverage a more established database
- ...use Prisma as the "ORM"
- ...not build a WYSIWYG editor

What is your current stack and what would you change about it? Ping me [on Twitter](https://twitter.com/mxstbr) and tell me about it!