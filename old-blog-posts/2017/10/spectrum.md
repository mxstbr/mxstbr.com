import PageHeader from '../../../../components/PageHeader'

export const frontmatter = {
  "published": true,
  "hidden": false,
  "title": "Starting something new: Introducing Spectrum",
  "tags": "spectrum personal",
  "twitter_large": true,
  "image": "spectrum.png",
  "custom_excerpt": "Seven months ago I quietly started working on a new project: not an open source or side project, but a product and a company. Say hello to Spectrum!"
};

<PageHeader title="Starting something new: Introducing Spectrum" />

Seven months ago I quietly started working on a new project: not an open source or side project, but a product and a company. It’s called [Spectrum](https://spectrum.chat).

[![Spectrum](/static/images/spectrum.png)](https://spectrum.chat)

## Soooo, what is it?

[Spectrum](https://spectrum.chat) is a new platform for you to join, start and build online communities. We’ve designed it with scalability in mind, creating tools that make growing and managing communities faster and easier for groups and businesses.

Today, there are very few choices when it comes to building your community online. More and more people are building theirs on platforms like Slack (and other IRC-alikes; Gitter, Discord, etc.), rolling a self-hosted forum, or starting a Facebook group.

I’ve been running large communities for my open source projects on these platforms for years, and have personally felt the pain of managing discussions with hundreds and thousands of people who contribute from all around the world. Even when everything is as carefully organized as can be things start to break down as these groups grow:

- With five conversations going on at the same time you’re not quite sure anymore who’s talking with whom—it’s impossible to keep track of.
- You want to talk about this one topic somebody mentioned five hours ago but the message is now 15 pages up and nobody knows what you’re talking about anymore. Don’t even get me started on topics from days or even, gasp, weeks ago!
- This is amplified by the fact that searching and linking to old messages is often a pain. Many times valuable and interesting conversations are lost forever, or the knowledge is trapped in the tool itself, never to be discovered from the outside.

### The Spark


I'm not building [Spectrum](https://spectrum.chat) on my own: I've been working on this with my two good friends, [Brian](https://twitter.com/brian_lovin) and [Bryn](https://twitter.com/uberbryn).

During the past two years they have run a podcast network called SpecFM and hosted a Slack community for all of their listeners. As the community grew (the Slack team had 9,000 members!), they realized that Slack just wasn’t the right place for it to live—conversations were getting lost, people were talking over one another, and it was a constant game of whack-a-mole with notifications.

After investigating all the other products and options, they realized that nothing quite fit their needs for having productive and engaging conversations with so many people from all around the world. So they set out to build a new space for the SpecFM community.

### The Flame

As Brian and Bryn built their first MVP of the new SpecFM platform, other people started describing their own painful experiences of growing communities on tools like Slack or Facebook.

That’s when they told me about their idea, and I realized this was something I need for my communities too! It became clear that this could be so much bigger than an one-off side project. We have the chance to build a platform to equip any group or business with the right tools to manage and grow their online community.

Based on our own experiences, and those of all the groups we’ve worked with and talked to, we approached the problem heads-on and built [Spectrum](https://spectrum.chat) differently, tailor-made for the purpose:

- Every conversation on [Spectrum](https://spectrum.chat) starts as a thread, its own place to provide rich context for the conversation ahead. Once a thread is published others can join the conversation.
- Conversations in threads are modeled after real-time chat applications. It feels more present than a static list of threaded comments, and when multiple people are online talking at the same time it feels like any other chat app you know.
- Because [Spectrum](https://spectrum.chat) is a platform, you are able to join all of your favorite communities with one profile, one login, one set of notifications and direct messages .
- By having all of your communities in one place, you get a single feed of all the things that you're interested in, sorted by where the most active conversations are taking place right now.

## It exists!

We’ve been building [Spectrum](https://spectrum.chat) for the past seven months, first as a public alpha for friends and family and then as a public beta with the SpecFM community as our test bed. It’s been seven exciting months and I’m proud of how far we’ve come in this short amount of time.

Already, there are vibrant and active communities around a variety of topics like [Sketch](https://spectrum.chat/sketch) (2,600+ people), [React](https://spectrum.chat/react) (1,600+ people), [Figma](https://spectrum.chat/figma) (1,400+ people), [styled-components](https://spectrum.chat/styled-components) (1,000+ people), [Frontend Café](https://spectrum.chat/frontend) (600+ people) and many more!

People have also started experimenting with the Spectrum format, for example Sophia Pang who created the [Tech Tea](https://spectrum.chat/tech-tea) community to provide important context and kick off in-depth discussions around recent tech news.

A great example of a thread is [this discussion about resumés and how to improve them](https://spectrum.chat/thread/5f5c1db7-8280-497e-a7ea-17e4ea265a4c) — the conversation lives at a shareable link, indexed on search engines for people to discover, contribute to and share. The thread is not locked up in a real-time feed of chat; instead, people can join the conversation at any time in the future and chime in with new thoughts, all without losing the original context.

## Check it out!

Hop on the [explore page](https://spectrum.chat/explore), find some topics that interest you and come chat; if the community you're looking for doesn't exist [create a new one](https://spectrum.chat/new/community), we'd love to have you!

## Technical notes

We'll write more about this soon, but since I'm otherwise going to get a ton of questions about our stack: the frontend is a server-side rendered and code split React app (build with styled-components of course) which gets the data from a homegrown GraphQL API.

We're heavy users of the entire Apollo toolchain, using `graphql-tools` and `graphql-server-express` on the backend and Apollo Client on the frontend. All of our real-time functionality is also implemented via GraphQL subscriptions.

While our frontend is well set up and quick (except for bundle size optimizations), our backend could use some performance improvements, which we're working on. Try running a WebPageTest audit on [spectrum.chat/styled-components](https://spectrum.chat/styled-components) and see for yourself!

## Thank you Thinkmill

On a last, more personal note I have to thank Thinkmill. Being employed to work on OSS was an amazing experience and I'm ever grateful to [Jed](https://twitter.com/JedWatson), [Boris](https://twitter.com/BorisBozic), [Sharkie](https://twitter.com/twalve) and the whole Thinkmill crew for the opportunity to do so for a year. I learned a lot and had so much fun doing it!

That's it folks, talk to you on [Spectrum](https://spectrum.chat)! ✌️
