import PageHeader from '../../components/PageHeader';

<PageHeader title="CTO Regrets: What I'd Do Differently" />

export const frontmatter = {
  published: false,
  hidden: true
}

In case you're new here, 👋 hey I'm Max, the technical cofounder of [Spectrum](https://spectrum.chat). Spectrum is a real-time, public, threaded chat app for large-scale communities. We're a team of three who all code, and we've been working on Spectrum for almost two years. It's also [fully open source](https://github.com/withspectrum/spectrum), so feel free to check out our code for more context.

With the benefit of hindsight, here's some technical decisions I'd change if we were to start over.

### Go mobile-first and use react-native-web

People use apps on their phone so much more than web apps, especially for chatting. For us, going web-first was still the right call as we correctly bet on search-indexing being important.

Having said that, we should've optimised our web app for mobile. Lots of frequent users use Spectrum on their phones, and it's not a great experience at the moment. 

If we'd done that and used [react-native-web](https://github.com/necolas/react-native-web) we could've quickly shipped the same codebase as native apps. That would've been a huge win for us and our users!

### Use Next.js for server-side rendering

We knew we needed server-side rendering (search-indexed chat, remember?) but already had a prototype of the app built with create-react-app. We thought about switching to [Next.js](https://nextjs.org), but reworking all the routing seemed like a lot of effort. Building our own server-side rendering server though, how hard can that be? 

In hindsight, we should've switched to Next.js. Writing your own production-ready SSR server is hard and needs a lot of maintenance. We didn't get the development experience right either, which hurt our velocity and UX.

### Leverage a well-known database

We chose RethinkDB as our primary data store, mostly because of changefeeds. Changefeeds allow you to listen to live updates on (almost) any RethinkDB query. Since Spectrum has to be real-time, this seemed like an important feature.

Unfortunately, we've had a lot of troubles with RethinkDB. Since it's not very widely used, there isn't much of a community around it. There is little documentation around query performance and operating a server cluster. Debugging slow queries or dropped connections feels like shooting in the dark.

We also realised that changefeeds do not scale at all, you can only run very few concurrently. The feature that made us chose RethinkDB in the first place turned out not to be useful in practice! While we managed to work around that eventually, we shouldn't have had to.

If we were to do it over again, I would go with a more established database, most likely Postgres.

#### ...and use Prisma as the ORM

One of the other reasons we went with RethinkDB is that the Node API is incredible. See for example this GraphQL resolver, which loads the threads a user posted:

```JS
const getThreadsByUser = (userId: string, after?: number, first?: number) => {
  return db
    .table('threads')
    .getAll(userId, { index: 'userId' })
    .orderBy(r.desc('createdAt'))
    .skip(after || 0)
    .limit(first || 10)
    .run();
}

const Query = {
  User: {
    threads: ({ id }, { after, first }) => getThreadsByUser(id, after, first),
  }
}
```

While that's great, there's a new kid on the block and it's even more awesome: [Prisma](https://prisma.io).

We are already using GraphQL for our API, so using the GraphQL SDL to define our db schema would have been a natural fit. On top of that, Prisma automatically generates(!) type-safe(!!) database queries and migrations(!!!)—a phenomenal developer experience! Let's look at the same GraphQL resolver again, but this time using Prisma:

```JS
const Query = {
  User: {
    threads: ({ id }, { after, first }, { prisma }) => 
      prisma.user({ id }).threads({ first, after }),
  }
}
```

Using Prisma would have let us move much quicker and avoid many bugs.

### Summary

To summarise, if we were to start over, I would:

- ...optimise for mobile first
- ...use react-native-web to quickly ship native apps
- ...use Next.js for the web app
- ...leverage a more established database
- ...use Prisma as the "ORM"

I'd love to know what your current stack is and what you'd like to change about it! Ping me [on Twitter](https://twitter.com/mxstbr) and tell me about your project.