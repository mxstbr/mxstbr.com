import { LiteYoutubeEmbed } from "react-lite-yt-embed";
import { Tweet } from "react-twitter-widgets"
import PageHeader from "../../components/PageHeader";
import Head from "../../components/Head";
import WideSection from "../../components/WideSection";

<PageHeader title="Problems" mb={0}>
  <Head
    title="Problems – Max Stoiber (@mxstbr)"
    description="A list of problems I encounter relatively frequently that annoy me."
  />
</PageHeader>

Inspired by [Wilhelm Klopp](https://wilhelmklopp.com/problems/), these are some of the problems I'm thinking about. If any of these trigger any thoughts, please [reach out and talk to me](https://twitter.com/mxstbr) about them — I'd love to chat!

## Local dev environments are brittle

Making local dev environments work often requires incantations of unbelievable length. What should the right set of env variables look like? Where do you get those from? How do you start the server, the client and the db and connect them all together? How do you abstract the differences between operating systems? etc. etc. etc.

Docker _kind of_ solves this, but it's really optimized for production usage. It makes a lot of common development tasks unbearably slow. (e.g. installing dependencies, watching files, syncing files from host to volume, etc.) You have to remember to execute commands in the container (`docker-compose exec app yarn add package`). etc.etc.

Fundamentally, Docker is the wrong tool for the job. It works, but it's far from ideal.

docker-compose though is really nice: One command to start/stop the local development environment which'll work on any operating system?! Fantastic!

Is there a way to get the benefits of Docker (-compose) in a lighter-weight package optimized for development?

## Browser DevTools are optimized for debugging, not for development, and are too generic

Browser devtools are a jack of all trades, master of none. They're fine, but they could be much more specific to _my_ app and setup.

ui-devtools.com is a great example of "DevTools specific to my stack" and makes for a fantastic development experience.

However, contrast that with the React DevTools: those are only useful for debugging. UI Devtools, on the other hand, is useful for _development_.

My first intuition was that it's because UI Devtools writes out to my code, but really that's not the point. It could just as well not do that and still be super useful.

What makes UI Devtools useful for development is its ability to scope itself to _my app_. I can lightly try different of _my styles_ on _my app_ in real-time.

Think about this then: how could React DevTools scope itself to my app and be useful for development?

What if you could drag and drop any React component that's already in your app onto the page? Or even just edit them in real-time into the JSX tree?

## It is impossible to know who owns what in a big company

At GitHub, we had a Slack channel for asking "Who owns this?", and even then it was really hard to figure out how to find who to talk to about a certain thing.

On top of that, it's really hard to know what _isn't_ owned by anyone. What's currently unowned and bitrotting?

Could be specific to code, internal tools, or even all processes. Who owns the code review process? Who owns the promotion process? etc. etc.

## Making good decisions is really hard

How do you make a good decisions? 🤷‍♂️ It's hard to learn the skill of making good decisions.

Might be because the iteration speed is really slow? You can only try one branch, and you can't really figure out if the other one would've worked better or worse — you basically can't A/B test a decision.
