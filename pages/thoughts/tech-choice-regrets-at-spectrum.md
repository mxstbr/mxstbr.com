import BlogPost from '../../components/BlogPost';

export const meta = {
  published: true,
  publishedAt: '2019-01-10',
  title: 'Tech Choices I Regret at Spectrum',
  summary: 'Spectrum is an open source chat app for large online communities. With the benefit of hindsight, here are the technical decisions I would change if we were starting over.'
}

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>

👋 I am Max, the technical co-founder of [Spectrum](https://spectrum.chat). Spectrum is an [open source](https://github.com/withspectrum/spectrum) chat app for large online communities and was recently acquired by GitHub. We are a team of three with a predominantly frontend and design background and have worked on it for close to two years.

With the benefit of hindsight, here are the technical choices I regret.

### Regret 1: Not using react-native-web

A big part of Spectrum's appeal is that the content is public and search-indexed, which is why we built the website before native apps.

Although the search-indexing was a success, our users often request a better mobile experience. We are building native apps now, but starting from scratch is time consuming. If we had used [react-native-web](https://github.com/necolas/react-native-web) to build the website, we could have reused the base components and built the native apps much faster! 🏎💨

On top of that, we should have also optimised the website for mobile first. A great mobile experience on desktop is bearable and only needs tweaking to work well. However, a desktop experience on mobile is annoying, no matter how great, and it has proven hard to make ours work well on devices of all sizes.

### Regret 2: Not using Next.js

We needed server-side rendering for SEO purposes ([client-side rendering does not cut it](https://twitter.com/mxstbr/status/985188986414161921)) but had already built a first version of the app with [create-react-app](https://github.com/facebook/create-react-app). We thought about switching to [Next.js](https://nextjs.org), but I decided that reworking the routing and data fetching would be more effort than building our own server-side rendering server.

Turns out, building your own production-ready SSR setup is tough. It takes a lot of work and it is difficult to provide a good experience, for both developers and users. 

Next.js offers an amazing development experience and fast performance out of the box, not to mention the great community and excellent documentation. I would use it in a heartbeat if we started over today (in fact, [this website is built with Next.js](https://github.com/mxstbr/mxstbr.com) 😍).

### Regret 3: Using RethinkDB

I chose [RethinkDB](https://www.rethinkdb.com) as our primary data store mainly because of [changefeeds](https://rethinkdb.com/docs/changefeeds/javascript/). They allow you to listen to live updates on (almost) any query. I thought this would reduce complexity by avoiding a separate PubSub system for real-time functionality.

Unfortunately, we have had a lot of troubles with RethinkDB. Since it is not widely used, there is little documentation and knowledge about operations. We have had many database outages and debugging them often feels like shooting in the dark.

It also turns out that changefeeds do not scale as well as we had expected. While we managed to work around it, we should not have had to. 😕

Nowadays, I would choose a more established database (Postgres?) and build a PubSub system on top.

### Regret 4: Using DraftJS for WYSIWYG editing

Writing is one of the primary activities on Spectrum, so we wanted the experience to be great. I decided to replace our plaintext markdown input with a custom WYSIWYG editor based on [Draft.js](https://draft-js.org).

Unfortunately it did not work out well. The editor is really buggy, even after months of work our users rightfully complain about it constantly. On top of that, the library makes up a majority of our JavaScript bundle size and the lack of cross-browser support means that we had to keep the plaintext input around as a fallback. 👎

While another WYSIWYG framework might have worked, we should have focused on more pressing features—the plaintext markdown input was fine.

### Summary

To summarise, these are my regrets:

1. Not using react-native-web
2. Not building mobile-first
3. Not using Next.js
4. Using RethinkDB
5. Using DraftJS

### Lessons Learned

I learned a lot of lessons from the experience of starting and building Spectrum, and I will not make the same mistakes for my next projects:

1. Deliberately choose core technologies that are hard to change later.
1. Prefer conserative choices over the cutting edge.
1. Community size and active maintenance are vital, especially in unfamiliar territory.
1. Optimise for iteration speed and flexibility. Building good products is all about experimenting.
1. Leave interesting technological problems to other people. Focus on your users.

On top of that, writing this down has been invaluable to help me crystallise my thoughts.