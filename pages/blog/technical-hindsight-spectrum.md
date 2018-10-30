import PageHeader from '../../components/PageHeader';

<PageHeader title="CTO Regrets: What I'd do differently" />

I'm the technical cofounder of [Spectrum](https://spectrum.chat) ([learn more about it](/blog/2017/10/spectrum)). With the benefit of hindsight, here's some technical decisions I'd make differently if we were to start over.

### Go mobile-first with react-native-web

Not using [react-native-web](https://github.com/necolas/react-native-web) was the single biggest mistake we made. Spectrum is a chat app, and most people want to use chat apps from their phone and receive push notifications when conversations are ongoing.

While our bet that search-indexed chat could be big was right (~60% of users came to Spectrum from organic search in the last 30 days), we should've optimized our web app for mobile first. If we'd then used react-native-web we could've shipped the same codebase as native apps, a big win for our users who've been asking for them forever while we have to rebuild the whole UI.

The posterchild of this approach is the new [mobile.twitter.com](https://mobile.twitter.com). In fact, it's so much faster, sleeker and better that the current Twitter website that they're going to move it to twitter.com soon.

### Use Next.js for server-side rendering

We knew we needed server-side rendering (search-indexed chat, remember?) but already had a prototype of the app built with create-react-app. We decided that reworking all the routing and repo setup would be more effort than building our own server-side rendering server, and didn't switch to [Next.js](https://nextjs.org).

In hindsight, we should've. Writing your own production-ready SSR server is hard and maintenance is a pain. We never managed to get the development experience right (Next.js does lots of smart things to make it great) and it hurt our development speed and user experience.

### Leverage a well-known database

We use RethinkDB as our primary data store. The main reason behind that decision were changefeeds, which allow you to listen to live updates on (almost) any RethinkDB query. Since Spectrum is largely real-time, this seemed like an important feature at the time.

Unfortunately, we've had a lot of troubles with RethinkDB. Since it's not very widely used, there isn't a lot of expertise on running it. Writing fast queries takes a lot of work as there isn't a lot of information anywhere on how to do that. Sometime it would've been great to hire a contractor to solve some of these problems, but there's almost nobody that has worked with RethinkDB at scale before.

It also turned out that changefeeds do not scale at all, you can hardly have more than a hundred at a time. This led to one of the most long-lasting and annoying bugs we've had to date where our API or database server would crash multiple times a day. It took us months to figure out how to fix it, since we were operating under the assumption that changefeeds will scale just fine. (I'll write more about this in a future post)

We should've used a more well-known and widely used relational database, most likely Postgres.

#### ...and use Prisma as the ORM

One of the other reasons we went with RethinkDB is that the Node API is the best of any database I'd ever seen and a million times better than a SQL string soup. Here's an example of a GraphQL resolver that loads the threads a user posted:

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

Prisma is _amazing_. Using the GraphQL Schema Definition Language ("SDL") to define your database schema allows for some nice features and an amazing Node API (we're also using GraphQL for our API, so using the SDL to define our database schema would've been a natural fit):

- Auto-generated and fully type-safe database queries (via flowtype or typescript)
- Auto-generated migrations when you change the db schema
- An amazing Node API:

  ```JS
  const Query = {
    User: {
      threads: ({ id }, { after, first }, { prisma }) => 
        prisma.user({ id }).threads({ first, after }),
    }
  }
  ```

Using Prisma would have saved us so much time and from so many bugs. Automatically generated and fully type safe database queries? Automatically generated migrations?! Yes please!
