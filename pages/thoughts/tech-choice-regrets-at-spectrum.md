import BlogPost from "../../components/BlogPost";
import Lesson from "../../components/Lesson";

export const meta = {
  published: true,
  publishedAt: "2019-01-16",
  title: "Tech Choices I Regret at Spectrum",
  summary:
    "Spectrum is an open source chat app for large online communities. With the benefit of hindsight, here are the technology choices I regret.",
  likes: 1354
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

👋 I am Max, the technical co-founder of [Spectrum](https://spectrum.chat). Spectrum is an [open source](https://github.com/withspectrum/spectrum) chat app for large online communities and was recently acquired by GitHub. We are a team of three with a predominantly frontend and design background and have worked on it for close to two years.

With the benefit of hindsight, here are the technology choices I regret and the lessons I have learned.

### Regret 1: Not using react-native-web

A big part of Spectrum's appeal is that the content is public and search-indexed, which is why we built the website before native apps.

Although the search-indexing was a success, our users have been requesting a better mobile experience. We are building native apps now, but starting from scratch is time consuming. If we had used [react-native-web](https://github.com/necolas/react-native-web) to build the website, we could have reused the base components and built the native apps much faster! 🏎💨

On top of that, we should have also optimised the website for mobile first. A great mobile experience on desktop is bearable and only needs tweaking to work well. However, a desktop experience on mobile is annoying, no matter how great, and it has proven hard to make ours work well on devices of all sizes.

<Lesson
  title="Lesson 1"
  body="Building a good product is all about experimentation and momentum. Optimize for iteration speed and flexibility."
/>

### Regret 2: Not using Next.js

We needed server-side rendering for SEO purposes ([client-side rendering does not cut it](https://twitter.com/mxstbr/status/985188986414161921)) but had already built a first version of the app with [create-react-app](https://github.com/facebook/create-react-app). We thought about switching to [Next.js](https://nextjs.org), but I decided that reworking the routing and data fetching would be more effort than building our own server-side rendering server.

Turns out, building your own production-ready SSR setup is tough. It takes a lot of work and it is difficult to provide a good experience, for both developers and users.

Next.js offers an amazing development experience and fast performance out of the box, not to mention the great community and excellent documentation. I would use it in a heartbeat if we started over today (in fact, [this website is built with Next.js](https://github.com/mxstbr/mxstbr.com) 😍).

<Lesson
  title="Lesson 2"
  body="Use existing solutions for technological problems where possible, particularly ones you do not understand deeply."
/>

### Regret 3: Using RethinkDB

I chose [RethinkDB](https://www.rethinkdb.com) as our primary data store mainly because of [changefeeds](https://rethinkdb.com/docs/changefeeds/javascript/). They allow you to listen to live updates on (almost) any query. I thought this would reduce complexity by avoiding a separate PubSub system for real-time functionality.

Unfortunately, we have had a lot of troubles with RethinkDB. Since it is not widely used, there is little documentation and knowledge about operations. We have had many database outages and debugging them has often felt like shooting in the dark.

It also turns out that changefeeds do not scale as well as we had expected. While we managed to work around it, we should not have had to. 😕

Nowadays, I would choose a more established database (Postgres?) and build a PubSub system on top.

<Lesson
  title="Lesson 3"
  body="Carefully choose core technologies that are hard to change later."
  last={false}
/>

<Lesson
  title="Lesson 4"
  body="Prioritize community size and active maintenance, especially in unfamiliar territory."
  first={false}
/>

### Regret 4: Using DraftJS and WYSIWYG editing

Writing is one of the primary activities on Spectrum, so we wanted the experience to be great. I decided to replace our plaintext markdown input with a custom WYSIWYG editor based on [Draft.js](https://draftjs.org), which had recently been released by Facebook.

Unfortunately it did not work out well. The editor is really buggy, even after months of work our users rightfully complain about it constantly. On top of that, the library makes up a majority of our JavaScript bundle size and the lack of cross-browser support means that we have to keep the plaintext input around as a fallback. 👎

Another framework might have worked better, but in reality we should have focused on more pressing features instead. I thought we needed WYSIWYG editing but did not validate it by talking to our users. Otherwise, we would have quickly realised that there was no need for it.

<Lesson
  title="Lesson 5"
  body="Deliberately assess cutting edge technologies, bias towards conservative choices."
  last={false}
/>

<Lesson
  title="Lesson 6"
  body="Be open with your roadmap to learn about your users priorities."
  first={false}
/>

### Takeaways

Changing these decisions would not have made Spectrum a better product by itself. Yet, it would have saved us time and allowed us to spend more time experimenting.

To summarize, here are the six lessons I am taking away for my next projects:

1. Building a good product is all about experimentation. Optimize for iteration speed and flexibility.
1. Use existing solutions for technological problems where possible, particularly ones you do not understand deeply.
1. Carefully choose core technologies that are hard to change later.
1. Prioritize community size and active maintenance, especially in unfamiliar territory.
1. Deliberately assess cutting edge technologies, bias towards conservative choices.
1. Be open with your roadmap to learn about your users priorities.
