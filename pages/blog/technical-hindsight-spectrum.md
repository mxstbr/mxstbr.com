import PageHeader from '../../components/PageHeader';

<PageHeader title="CTO Regrets: What I'd do differently" />

I'm the technical cofounder of [Spectrum](https://spectrum.chat) ([learn more about it](/blog/2017/10/spectrum)). With the benefit of hindsight, here's some technical decisions I'd change if we were to start over.

### Go mobile-first with react-native-web

Not choosing [react-native-web](https://github.com/necolas/react-native-web) is the biggest regret I have. People use apps on their phone so much more than web apps, especially chat apps like Spectrum.

Our bet on search-indexed public chat paid off, so going web-first was the right call. We should've used react-native-web and optimised our web app for mobile though. We could've then shipped the same codebase as native apps!

The posterchild of this approach is the new and awesome [mobile.twitter.com](https://mobile.twitter.com). It's so much better that the current Twitter website that they're going to move it to twitter.com soon.

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

Prisma is _amazing_. We are already using GraphQL for our API, so using the GraphQL SDL to define our db schema would have been a natural fit. That abstraction in turn allows for some phenomal developer experience enhancements:

- Auto-generated, type-safe (!) database queries
- Automatic migrations when you change the db schema
- A sensational developer experience in Node:

  ```JS
  const Query = {
    User: {
      threads: ({ id }, { after, first }, { prisma }) => 
        prisma.user({ id }).threads({ first, after }),
    }
  }
  ```

Using Prisma would have saved us so much time and from so many bugs. Automatically generated and fully type safe database queries? Automatically generated migrations?! Yes please!
