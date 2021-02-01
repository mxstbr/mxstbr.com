import { LiteYoutubeEmbed } from "react-lite-yt-embed";
import { Tweet } from "react-twitter-widgets"
import PageHeader from "../../components/PageHeader";
import Head from "../../components/Head";
import WideSection from "../../components/WideSection";

<PageHeader title="My Story" mb={0}>
  <Head
    title="Problem list – Max Stoiber (@mxstbr)"
    description="A list of problems I encounter relatively frequently that annoy me."
  />
</PageHeader>

- Reproducible local dev envs that work across operating systems.
  - Docker is way too heavy and makes a lot of common tasks (eg yarn installing, file watching) unbearably slow. 
  - However, the fact that I can reliably start and connect my app + a db locally in one command and know that it'll work on any other machine is pretty cool and docker-compose is sweeeeet
  - Is there a way to get the benefits without the drawbacks? Some kind of lighter-weight Docker?
- Browser devtools are a jack of all trades, master of none. They're fine, but they could be much more specific to _my_ app and setup. 
  - https://ui-devtools.com/ is a great example of "DevTools specific to my stack"
  - The React DevTools are only useful for debugging. Compared, UI Devtools is useful for _development_.
    - Is that because UI Devtools writes out to my code?
      - Not really. It could just as well not do that and still be super useful I'm pretty sure. What makes it more useful for development is its ability to scope itself to _my app_.
  - How could React DevTools scope itself to my app?
    - What if you could drag and drop any React component that's already in your app onto the page?
      - Or even just edit them in the JSX tree?
- Making good decisions is really hard, and it's hard to learn the skill of making good decisions.
  - Might be because the iteration speed is really slow. You can only try one branch, and you can't really figure out if the other one would've worked better or worse — you basically can't A/B test a decision.
- It is impossible to know who owns what in a big company. At GitHub, we had a Slack channel for asking "Who owns this?", and even there some of the most senior members of the company couldn't answer that question.
  - On top of that, it's really hard to know what _isn't_ owned by anyone. What's currently unowned and bitrotting?
  - Could be specific to code, internal tools, or even all processes. Who owns the code review process? Who owns the promotion process? etc. etc.