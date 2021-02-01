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
  - The React DevTools are only useful for debugging. Compared, UI Devtoosl is useful for _development_.