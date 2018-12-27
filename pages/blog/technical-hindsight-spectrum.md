import PageHeader from '../../components/PageHeader';

<PageHeader title="CTO Regrets: What I'd Do Differently" />

export const frontmatter = {
  published: false,
  hidden: true
}

In case you're new here: 👋 Hey I'm Max, the technical cofounder of [Spectrum](https://spectrum.chat). Spectrum is a public, [open source](https://github.com/withspectrum/spectrum), threaded chat app for large online communities and was recently acquired by GitHub. We're a team of three, and have worked on it for almost two years.

With the benefit of hindsight, here's some technical decisions I'd change if we were to start over.

### Go mobile-first and use react-native-web

People use chat apps on their phone a lot more than on desktop. We still built a web app before native apps, as a big part of the allure of Spectrum is the search-indexing of the chats.

Having said that, we should've optimised our web app for mobile first. A large part of our users view Spectrum on their phones anyway, and a good mobile experience on desktop is bearable. A crappy mobile experience isn't.

If we'd then used [react-native-web](https://github.com/necolas/react-native-web) we could've quickly shipped nice native apps, our users' most requested feature, from the same codebase—a big win!

### Use Next.js for server-side rendering

We knew we needed server-side rendering for SEO purposes (no, [client-side rendering doesn't cut it](https://twitter.com/mxstbr/status/985188986414161921)), but already had  a MVP of the app built with create-react-app. We thought about switching to [Next.js](https://nextjs.org), but reworking the routing setup seemed like a lot of effort. Building our own server-side rendering server, how hard could that be, right? 

We should've switched to Next.js. Writing a production-ready SSR server is hard and requires a lot of maintenance. We didn't get the development experience right either, which hurt our development velocity. Next.js does so much for you out of the box, from fast performance all the way to a great development experience, that it's always worth using if you need SSR.

### Leverage a well-known database

We chose RethinkDB as our primary data store, mostly because of changefeeds. Changefeeds allow you to listen to live updates on (almost) any RethinkDB query. Since Spectrum has to be real-time, this seemed like a great feature to have.

Unfortunately, we've had a lot of troubles with RethinkDB. Since it's not very widely used, there isn't much of a community around it and there is little documentation around query performance and operating a server cluster. Debugging slow queries or connection issues feels like shooting in the dark.

We also quickly realised that changefeeds do not scale at all, you can only run few concurrently. The feature that made us chose RethinkDB in the first place turned out not to be useful in practice! While we managed to work around that eventually, we shouldn't have had to.

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

Using Prisma would have let us move quicker, be more consistent and avoid more bugs.

### No WYSIWYG

The main action users do on Spectrum is writing, so we wanted to experience to be as nice as possible. We decided to replace our MVP plain text markdown input with a custom WYSIWYG editor based on [Draft.js](https://draft-js.org).

Unfortunately, the writing experience sucks. It's buggy, even after months of work it's still not as good as our users deserve and we constantly hear complaints about it. DraftJS also has bad cross-browser support, so we need to fall back to plain text on Android.

Maybe a different, more mature WYSIWYG editing framework could've worked for us, but really we should've stuck with the plain text + markdown input we had at the start. While non-technical folks might not be familiar with markdown, most of our users are anyway, so we should've built other, more important features instead.

### Summary

To summarise, if we were to start over, I would:

- ...optimise for mobile first
- ...use react-native-web to quickly ship native apps
- ...use Next.js for the web app
- ...leverage a more established database
- ...use Prisma as the "ORM"
- ...not build a WYSIWYG editor

What is your current stack and what would you change about it? Ping me [on Twitter](https://twitter.com/mxstbr) and tell me about it!